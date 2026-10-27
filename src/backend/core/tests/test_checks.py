"""Test the system checks of the calendars core app."""

from django.test import override_settings

import pytest

from core.checks import check_silent_login_logout


@pytest.mark.parametrize(
    "silent_login_enabled, logout_endpoint, store_id_token, expected_ids",
    [
        (True, None, True, ["core.W001"]),
        (True, "https://oidc.test/logout", False, ["core.W001"]),
        (True, "https://oidc.test/logout", True, []),
        (False, None, False, []),
    ],
)
def test_check_silent_login_logout(
    silent_login_enabled, logout_endpoint, store_id_token, expected_ids
):
    """Silent login should raise a warning when logout cannot end the SSO session."""
    with override_settings(
        FRONTEND_SILENT_LOGIN_ENABLED=silent_login_enabled,
        OIDC_OP_LOGOUT_ENDPOINT=logout_endpoint,
        OIDC_STORE_ID_TOKEN=store_id_token,
    ):
        messages = check_silent_login_logout(None)

    assert [message.id for message in messages] == expected_ids
