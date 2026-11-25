import cloudinary.utils


def signed_url(public_id, width=None, download=False):
    """
    Photos are stored in Cloudinary as 'authenticated' (private) files.
    A plain URL does not work for them: only a URL signed by our server does.
    """
    options = {}
    if width:
        options["transformation"] = [{"width": width, "crop": "limit", "quality": "auto", "fetch_format": "auto"}]
    elif download:
        options["transformation"] = [{"flags": "attachment"}]
    url, _ = cloudinary.utils.cloudinary_url(
        public_id, type="authenticated", sign_url=True, secure=True, **options
    )
    return url
