import logging

import cloudinary
import cloudinary.uploader
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .cloud import signed_url
from .models import Gallery, Photo

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_MB = 25


def looks_like_image(file):
    """Checks the first bytes of the file, so a renamed .txt file is refused."""
    head = file.read(12)
    file.seek(0)
    return (
        head.startswith(b"\xff\xd8\xff")                      # JPEG
        or head.startswith(b"\x89PNG\r\n\x1a\n")              # PNG
        or (head[:4] == b"RIFF" and head[8:12] == b"WEBP")    # WebP
    )


def photo_json(photo):
    return {
        "id": photo.id,
        "filename": photo.filename,
        "thumbnail": signed_url(photo.public_id, 600),
        "preview": signed_url(photo.public_id, 2000),
        "uploaded_at": photo.uploaded_at,
    }


@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def gallery_photos(request, gallery_id):
    gallery = get_object_or_404(Gallery, pk=gallery_id)

    if request.method == "GET":
        return Response([photo_json(p) for p in gallery.photos.all()])

    file = request.FILES.get("file")
    if file is None:
        return Response({"detail": "No file was sent."}, status=400)
    if file.content_type not in ALLOWED_TYPES or not looks_like_image(file):
        return Response({"detail": "Only JPG, PNG or WebP photos are allowed."}, status=400)
    if file.size > MAX_MB * 1024 * 1024:
        return Response({"detail": f"Each photo must be under {MAX_MB} MB."}, status=400)
    if not cloudinary.config().cloud_name:
        return Response({"detail": "Cloudinary is not set up. Check the CLOUDINARY values in backend/.env."}, status=500)

    try:
        result = cloudinary.uploader.upload(
            file,
            type="authenticated",  # private: no public link to the original
            folder=f"studioframe/gallery-{gallery.id}",
            use_filename=False,
            unique_filename=True,
        )
    except Exception:
        logger.exception("Cloudinary upload failed")
        return Response({"detail": "The upload to Cloudinary failed. Please try again."}, status=502)

    photo = Photo.objects.create(
        gallery=gallery,
        public_id=result["public_id"],
        image_url=result["secure_url"],
        thumbnail_url=signed_url(result["public_id"], 600),
        filename=file.name[:255],
    )
    return Response(photo_json(photo), status=201)


@api_view(["DELETE"])
def photo_detail(request, pk):
    photo = get_object_or_404(Photo, pk=pk)
    photo.delete()  # signals.py also removes the file from Cloudinary
    return Response(status=204)
