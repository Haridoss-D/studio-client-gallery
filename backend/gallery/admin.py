from django.contrib import admin

from .models import Client, Gallery, GallerySubmission, Photo, PhotoSelection


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "created_at")
    search_fields = ("name", "email")


@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ("title", "client", "status", "selection_limit", "expiry_date", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "client__name", "client__email")
    readonly_fields = ("private_token", "created_at")


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ("filename", "gallery", "uploaded_at")
    search_fields = ("filename",)


@admin.register(PhotoSelection)
class PhotoSelectionAdmin(admin.ModelAdmin):
    list_display = ("gallery", "photo", "selected_at")


@admin.register(GallerySubmission)
class GallerySubmissionAdmin(admin.ModelAdmin):
    list_display = ("gallery", "status", "submitted_at")
    list_filter = ("status",)
