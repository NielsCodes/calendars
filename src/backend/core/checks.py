"""System checks for the calendars core app."""

from django.conf import settings
from django.core import checks


@checks.register()
def check_silent_login_logout_endpoint(app_configs, **kwargs):  # pylint: disable=unused-argument
    """Warn when silent login is enabled but logout cannot end the SSO session."""
    if not settings.FRONTEND_SILENT_LOGIN_ENABLED or settings.OIDC_OP_LOGOUT_ENDPOINT:
        return []

    return [
        checks.Warning(
            "FRONTEND_SILENT_LOGIN_ENABLED is ignored "
            "because OIDC_OP_LOGOUT_ENDPOINT is not set.",
            hint=(
                "Set OIDC_OP_LOGOUT_ENDPOINT to the end session endpoint of the "
                "OIDC provider. Without it, logout keeps the SSO session and "
                "silent login logs the user back in."
            ),
            id="core.W001",
        )
    ]
