import secrets

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


def generate_token():
    """A long random string used in the private client link."""
    return secrets.token_urlsafe(32)


class Client(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        self.email = self.email.strip().lower()  # one client per email address
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} <{self.email}>"


class Gallery(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUBMITTED = "submitted", "Submitted"
        REOPENED = "reopened", "Reopened"
        COMPLETED = "completed", "Completed"

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="galleries")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    photoshoot_date = models.DateField(null=True, blank=True)
    selection_limit = models.PositiveIntegerField(default=20, validators=[MinValueValidator(1)])
    private_token = models.CharField(max_length=64, unique=True, default=generate_token, editable=False)
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "galleries"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(selection_limit__gte=1),
                name="gallery_selection_limit_at_least_1",
            )
        ]

    def clean(self):
        if self.photoshoot_date and self.expiry_date and self.expiry_date < self.photoshoot_date:
            raise ValidationError("The expiry date can't be before the photoshoot date.")

    @property
    def is_expired(self):
        return bool(self.expiry_date and self.expiry_date < timezone.localdate())

    @property
    def selected_count(self):
        return self.selections.count()

    def __str__(self):
        return f"{self.title} ({self.client.name})"


class Photo(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="photos")
    public_id = models.CharField(max_length=255, blank=True)  # Cloudinary ID, needed to delete the file later
    image_url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["filename", "id"]

    def __str__(self):
        return self.filename


class PhotoSelection(models.Model):
    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="selections")
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, related_name="selections")
    selected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["selected_at"]
        constraints = [
            # The same photo can't be selected twice in a gallery
            models.UniqueConstraint(fields=["gallery", "photo"], name="one_selection_per_photo"),
        ]

    def clean(self):
        # A client can only select photos that belong to their own gallery
        if self.photo_id and self.gallery_id and self.photo.gallery_id != self.gallery_id:
            raise ValidationError("This photo belongs to a different gallery.")

    def save(self, *args, **kwargs):
        self.full_clean()  # runs clean() and the duplicate check before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.gallery.title}: {self.photo.filename}"


class GallerySubmission(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        REOPENED = "reopened", "Reopened"
        COMPLETED = "completed", "Completed"

    gallery = models.ForeignKey(Gallery, on_delete=models.CASCADE, related_name="submissions")
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SUBMITTED)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.gallery.title} ({self.status})"
