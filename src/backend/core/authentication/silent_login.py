"""Settings that silent login depends on."""

from django.conf import settings


def get_silent_login_blockers():
    """
    Return the names of the unset settings that stop logout from ending the
    SSO session.

    Logout ends the SSO session only when it can send the stored ID token to
    the logout endpoint of the OIDC provider. If it cannot, silent login logs
    the user back in at once.
    """
    return [
        name
        for name in ("OIDC_OP_LOGOUT_ENDPOINT", "OIDC_STORE_ID_TOKEN")
        if not getattr(settings, name)
    ]
