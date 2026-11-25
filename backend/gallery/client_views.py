from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import APIException
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Gallery, GallerySubmission, PhotoSelection
from .photo_views import photo_json

LOCKED = (Gallery.Status.SUBMITTED, Gallery.Status.COMPLETED)


class Gone(APIException):
    status_code = 410
    default_detail = "This gallery has expired. Please contact your photographer."


def public(method):
    """These endpoints need no login. The secret token in the link is the key."""
    def decorator(func):
        return api_view([method])(authentication_classes([])(permission_classes([AllowAny])(func)))
    return decorator


def find_gallery(token, lock=False):
    queryset = Gallery.objects.select_related("client")
    if lock:
        queryset = queryset.select_for_update(of=("self",))  # stops two clicks racing past the limit
    gallery = get_object_or_404(queryset, private_token=token)
    if gallery.is_expired:
        raise Gone()
    return gallery


def selected_ids(gallery):
    return list(gallery.selections.values_list("photo_id", flat=True))


def payload(gallery):
    locked = gallery.status in LOCKED
    submission = gallery.submissions.first() if locked else None
    return {
        "title": gallery.title,
        "client_name": gallery.client.name,
        "description": gallery.description,
        "photoshoot_date": gallery.photoshoot_date,
        "selection_limit": gallery.selection_limit,
        "status": gallery.status,
        "locked": locked,
        "submitted_at": submission.submitted_at if submission else None,
        "selected_ids": selected_ids(gallery),
        "photos": [photo_json(p) for p in gallery.photos.all()],
    }


@public("GET")
def gallery_view(request, token):
    return Response(payload(find_gallery(token)))


@public("POST")
def select_photo(request, token):
    want = request.data.get("selected")
    try:
        photo_id = int(request.data.get("photo_id"))
    except (TypeError, ValueError):
        return Response({"detail": "A valid photo is required."}, status=400)
    if not isinstance(want, bool):
        return Response({"detail": "Say whether the photo is selected or not."}, status=400)

    with transaction.atomic():
        gallery = find_gallery(token, lock=True)
        if gallery.status in LOCKED:
            return Response({"detail": "Your selection has already been submitted."}, status=403)
        photo = get_object_or_404(gallery.photos, pk=photo_id)  # only this gallery's own photos

        if want:
            if not gallery.selections.filter(photo=photo).exists():
                if gallery.selections.count() >= gallery.selection_limit:
                    return Response(
                        {"detail": f"You've reached your limit of {gallery.selection_limit} photos. Unselect one to choose another."},
                        status=400,
                    )
                PhotoSelection.objects.create(gallery=gallery, photo=photo)
        else:
            gallery.selections.filter(photo=photo).delete()

        ids = selected_ids(gallery)
    return Response({"selected_ids": ids})


@public("POST")
def submit_selection(request, token):
    with transaction.atomic():
        gallery = find_gallery(token, lock=True)
        if gallery.status in LOCKED:
            return Response({"detail": "Your selection was already submitted."}, status=409)
        if not gallery.selections.exists():
            return Response({"detail": "Select at least one photo first."}, status=400)
        gallery.status = Gallery.Status.SUBMITTED
        gallery.save(update_fields=["status"])
        GallerySubmission.objects.create(gallery=gallery, status=GallerySubmission.Status.SUBMITTED)
    return Response(payload(gallery))
