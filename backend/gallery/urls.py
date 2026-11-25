from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import client_views, photo_views, selection_views, views

router = DefaultRouter()
router.register("admin/galleries", views.GalleryViewSet, basename="gallery")

urlpatterns = [
    path("health/", views.health),
    path("auth/login/", views.login),
    path("auth/logout/", views.logout),
    path("admin/dashboard/", views.dashboard),
    path("admin/galleries/<int:gallery_id>/photos/", photo_views.gallery_photos),
    path("admin/galleries/<int:gallery_id>/selected/", selection_views.selected_photos),
    path("admin/galleries/<int:gallery_id>/selected/zip/", selection_views.selected_zip),
    path("admin/photos/<int:pk>/", photo_views.photo_detail),
    # Public, token-protected client endpoints
    path("client/<str:token>/", client_views.gallery_view),
    path("client/<str:token>/select/", client_views.select_photo),
    path("client/<str:token>/submit/", client_views.submit_selection),
    path("", include(router.urls)),
]
