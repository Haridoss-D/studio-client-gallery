from django.contrib.auth import authenticate
from django.db.models import Count
from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Client, Gallery, GallerySubmission, Photo
from .serializers import GallerySerializer


class LoginThrottle(AnonRateThrottle):
    scope = "login"
    rate = "10/min"  # slows down password guessing


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    return Response({"message": "Backend is connected"})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
    if user is None or not user.is_staff:
        return Response({"detail": "Wrong username or password."}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username})


@api_view(["POST"])
def logout(request):
    request.auth.delete()  # the token stops working immediately
    return Response({"detail": "Logged out."})


def annotated_galleries():
    return Gallery.objects.select_related("client").annotate(
        photos_total=Count("photos", distinct=True),
        selections_total=Count("selections", distinct=True),
    )


@api_view(["GET"])
def dashboard(request):
    G = Gallery.Status
    galleries = Gallery.objects
    recent = annotated_galleries()[:5]
    return Response({
        "total_galleries": galleries.count(),
        "total_clients": Client.objects.count(),
        "total_photos": Photo.objects.count(),
        "pending_selections": galleries.filter(status__in=[G.PENDING, G.REOPENED]).count(),
        "submitted_selections": galleries.filter(status__in=[G.SUBMITTED, G.COMPLETED]).count(),
        "recent_galleries": GallerySerializer(recent, many=True).data,
    })


class GalleryViewSet(viewsets.ModelViewSet):
    """List, create, view, edit and delete galleries (admin only)."""

    serializer_class = GallerySerializer

    def get_queryset(self):
        return annotated_galleries()

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        gallery = self.get_object()
        gallery.status = Gallery.Status.REOPENED
        gallery.save(update_fields=["status"])
        gallery.submissions.exclude(status=GallerySubmission.Status.REOPENED).update(
            status=GallerySubmission.Status.REOPENED
        )
        return Response(self.get_serializer(gallery).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        gallery = self.get_object()
        if gallery.status != Gallery.Status.SUBMITTED:
            return Response({"detail": "Only a submitted selection can be marked as completed."}, status=400)
        gallery.status = Gallery.Status.COMPLETED
        gallery.save(update_fields=["status"])
        gallery.submissions.filter(status=GallerySubmission.Status.SUBMITTED).update(
            status=GallerySubmission.Status.COMPLETED
        )
        return Response(self.get_serializer(gallery).data)
