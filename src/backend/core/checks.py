"""System checks for the calendars core app."""

from django.conf import settings
from django.core import checks

from core.authentication.silent_login import get_silent_login_blockers


@checks.register()
def check_silent_login_logout(app_configs, **kwargs):  # pylint: disable=unused-argument
    """Warn when silent login is enabled but logout cannot end the SSO session."""
    if not settings.FRONTEND_SILENT_LOGIN_ENABLED:
        return []

    blockers = get_silent_login_blockers()
    if not blockers:
        return []

    return [
        checks.Warning(
            "FRONTEND_SILENT_LOGIN_ENABLED is ignored because these settings "
            f"are not set: {', '.join(blockers)}.",
            hint=(
                "Set OIDC_OP_LOGOUT_ENDPOINT to the end session endpoint of the "
                "OIDC provider and keep OIDC_STORE_ID_TOKEN on. Without them, "
                "logout keeps the SSO session and silent login logs the user "
                "back in."
            ),
            id="core.W001",
        )
    ]
