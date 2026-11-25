import logging
import os
import tempfile
import zipfile

import requests
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .cloud import signed_url
from .models import Gallery, PhotoSelection
from .serializers import GallerySerializer
from .views import annotated_galleries

logger = logging.getLogger(__name__)


def chosen(gallery):
    """The client's real selections, read from the database."""
    return (
        PhotoSelection.objects.filter(gallery=gallery)
        .select_related("photo")
        .order_by("photo__filename", "photo_id")
    )


@api_view(["GET"])
def selected_photos(request, gallery_id):
    gallery = get_object_or_404(annotated_galleries(), pk=gallery_id)
    photos = [
        {
            "id": s.photo.id,
            "filename": s.photo.filename,
            "thumbnail": signed_url(s.photo.public_id, 600),
            "preview": signed_url(s.photo.public_id, 2000),
            "download": signed_url(s.photo.public_id, download=True),  # original quality
            "selected_at": s.selected_at,
        }
        for s in chosen(gallery)
    ]
    return Response({"gallery": GallerySerializer(gallery).data, "photos": photos})


def unique_name(filename, used):
    base = os.path.basename(filename) or "photo.jpg"
    stem, ext = os.path.splitext(base)
    name, n = base, 1
    while name.lower() in used:  # two photos can share a filename
        n += 1
        name = f"{stem}_{n}{ext}"
    used.add(name.lower())
    return name


@api_view(["GET"])
def selected_zip(request, gallery_id):
    gallery = get_object_or_404(Gallery, pk=gallery_id)
    selections = list(chosen(gallery))
    if not selections:
        return Response({"detail": "No photos are selected yet."}, status=400)

    archive_file = tempfile.TemporaryFile()  # on disk, so big galleries don't fill memory
    used = set()
    try:
        with zipfile.ZipFile(archive_file, "w", zipfile.ZIP_STORED) as archive:
            for s in selections:
                name = unique_name(s.photo.filename, used)
                with requests.get(signed_url(s.photo.public_id), stream=True, timeout=60) as response:
                    response.raise_for_status()
                    with archive.open(name, "w", force_zip64=True) as out:
                        for chunk in response.iter_content(256 * 1024):
                            out.write(chunk)
    except requests.RequestException:
        archive_file.close()
        logger.exception("Could not build the ZIP")
        return Response({"detail": "Could not fetch a photo from Cloudinary. Please try again."}, status=502)

    archive_file.seek(0)
    return FileResponse(
        archive_file,
        as_attachment=True,
        filename=f"{slugify(gallery.title) or 'gallery'}-selected.zip",
        content_type="application/zip",
    )
