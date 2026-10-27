import { baseApiUrl } from "@/features/api/utils";

const SILENT_LOGIN_RETRY_KEY = "calendars_silent-login-retry";
const SILENT_LOGIN_PENDING_KEY = "calendars_silent-login-pending";
const SILENT_LOGIN_RETRY_INTERVAL = 30 * 1000;

export const canAttemptSilentLogin = () => {
  try {
    const nextRetryTime = localStorage.getItem(SILENT_LOGIN_RETRY_KEY);
    if (!nextRetryTime) {
      return true;
    }
    return Date.now() > Number(nextRetryTime);
  } catch {
    return false;
  }
};

const startCooldown = () => {
  localStorage.setItem(SILENT_LOGIN_RETRY_KEY, String(Date.now() + SILENT_LOGIN_RETRY_INTERVAL));
};

/**
 * Forget the attempt in flight in this tab. Call it once the visitor is
 * logged in, so a later logout does not count as a failed attempt.
 */
export const clearPendingSilentLogin = () => {
  try {
    sessionStorage.removeItem(SILENT_LOGIN_PENDING_KEY);
  } catch {
    // Nothing to clear when storage is blocked.
  }
};

/**
 * Redirect to the OIDC provider with prompt=none, logging the visitor in if they
 * already have an SSO session and returning them here if they don't. Returns
 * whether the redirect was started.
 */
export const attemptSilentLogin = () => {
  // A user the app refuses is still authenticated at the provider, so retrying
  // would log them in and bounce them off again until the cooldown catches up.
  const hasAuthError = new URLSearchParams(window.location.search).has("auth_error");

  try {
    // A pending attempt means the provider sent the visitor back without a
    // session. The cooldown started before the redirect and can already be
    // over after a slow round trip, so restart it from now.
    if (sessionStorage.getItem(SILENT_LOGIN_PENDING_KEY)) {
      sessionStorage.removeItem(SILENT_LOGIN_PENDING_KEY);
      startCooldown();
      return false;
    }

    if (!canAttemptSilentLogin() || hasAuthError) {
      return false;
    }

    startCooldown();
    sessionStorage.setItem(SILENT_LOGIN_PENDING_KEY, "1");
  } catch {
    // The cooldown is what stops a redirect loop, so without it, don't go.
    return false;
  }

  const url = new URL("authenticate/", baseApiUrl());
  url.searchParams.set("silent", "true");
  url.searchParams.set("returnTo", window.location.href);
  window.location.replace(url.href);
  return true;
};
