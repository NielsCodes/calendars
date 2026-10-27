"""Test the system checks of the calendars core app."""

from django.test import override_settings

import pytest

from core.checks import check_silent_login_logout_endpoint


@pytest.mark.parametrize(
    "silent_login_enabled, logout_endpoint, expected_ids",
    [
        (True, None, ["core.W001"]),
        (True, "https://oidc.test/logout", []),
        (False, None, []),
    ],
)
def test_check_silent_login_logout_endpoint(
    silent_login_enabled, logout_endpoint, expected_ids
):
    """Silent login without a logout endpoint should raise a warning."""
    with override_settings(
        FRONTEND_SILENT_LOGIN_ENABLED=silent_login_enabled,
        OIDC_OP_LOGOUT_ENDPOINT=logout_endpoint,
    ):
        messages = check_silent_login_logout_endpoint(None)

    assert [message.id for message in messages] == expected_ids
