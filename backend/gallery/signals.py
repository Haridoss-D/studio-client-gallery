import logging

import cloudinary.uploader
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Photo

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Photo)
def delete_file_from_cloudinary(sender, instance, **kwargs):
    # Runs whenever a photo row is deleted, including when its whole gallery is deleted.
    if not instance.public_id:
        return
    try:
        cloudinary.uploader.destroy(instance.public_id, type="authenticated", invalidate=True)
    except Exception:
        logger.exception("Could not delete %s from Cloudinary", instance.public_id)
