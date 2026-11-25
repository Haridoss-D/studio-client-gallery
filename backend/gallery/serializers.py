from rest_framework import serializers

from .models import Client, Gallery


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["id", "name", "email", "phone"]


class GallerySerializer(serializers.ModelSerializer):
    # Read: the client is shown as a small object.
    client = ClientSerializer(read_only=True)
    # Write: the admin form sends flat client_* fields.
    client_name = serializers.CharField(write_only=True, max_length=120)
    client_email = serializers.EmailField(write_only=True)
    client_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=30)

    photo_count = serializers.SerializerMethodField()
    selected_count = serializers.SerializerMethodField()
    submitted_at = serializers.SerializerMethodField()

    class Meta:
        model = Gallery
        fields = [
            "id", "client", "client_name", "client_email", "client_phone", "title", "description",
            "photoshoot_date", "selection_limit", "private_token", "expiry_date", "status",
            "created_at", "photo_count", "selected_count", "submitted_at",
        ]
        read_only_fields = ["private_token", "status", "created_at"]

    def get_photo_count(self, obj):
        value = getattr(obj, "photos_total", None)
        return obj.photos.count() if value is None else value

    def get_selected_count(self, obj):
        value = getattr(obj, "selections_total", None)
        return obj.selections.count() if value is None else value

    def get_submitted_at(self, obj):
        if obj.status not in (Gallery.Status.SUBMITTED, Gallery.Status.COMPLETED):
            return None
        sub = obj.submissions.first()  # newest first
        return sub.submitted_at if sub else None

    def validate(self, attrs):
        shoot = attrs.get("photoshoot_date", getattr(self.instance, "photoshoot_date", None))
        expiry = attrs.get("expiry_date", getattr(self.instance, "expiry_date", None))
        if shoot and expiry and expiry < shoot:
            raise serializers.ValidationError({"expiry_date": "The expiry date can't be before the photoshoot date."})
        return attrs

    def _client_from(self, data, fallback_name=None):
        email = data.pop("client_email").strip().lower()
        name = data.pop("client_name", None) or fallback_name
        phone = data.pop("client_phone", "")
        client, created = Client.objects.get_or_create(email=email, defaults={"name": name, "phone": phone})
        if not created:
            client.name = name or client.name
            client.phone = phone or client.phone
            client.save()
        return client

    def create(self, validated_data):
        validated_data["client"] = self._client_from(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "client_email" in validated_data:
            validated_data["client"] = self._client_from(validated_data, instance.client.name)
        else:
            validated_data.pop("client_name", None)
            validated_data.pop("client_phone", None)
        return super().update(instance, validated_data)
