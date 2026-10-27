import { baseApiUrl } from "@/features/api/utils";

// The two keys use different storage on purpose. The pending marker tracks
// the attempt of this tab, so it lives in sessionStorage. The cooldown limits
// retries across all tabs, so it lives in localStorage.
const SILENT_LOGIN_RETRY_KEY = "calendars_silent-login-retry";
const SILENT_LOGIN_PENDING_KEY = "calendars_silent-login-pending";
const SILENT_LOGIN_RETRY_INTERVAL = 30 * 1000;

const hasRetryCooldownElapsed = () => {
  const nextRetryTime = localStorage.getItem(SILENT_LOGIN_RETRY_KEY);
  if (!nextRetryTime) {
    return true;
  }
  return Date.now() > Number(nextRetryTime);
};

const startCooldown = () => {
  localStorage.setItem(SILENT_LOGIN_RETRY_KEY, String(Date.now() + SILENT_LOGIN_RETRY_INTERVAL));
};

/**
 * Clear the pending attempt of this tab after authentication succeeds.
 * Leaves the shared retry cooldown unchanged.
 */
export const clearPendingSilentLogin = () => {
  try {
    sessionStorage.removeItem(SILENT_LOGIN_PENDING_KEY);
  } catch {
    // Ignore storage failures during cleanup.
  }
};

/**
 * After an anonymous user probe, consume a pending silent login attempt or
 * start one if retries are allowed.
 *
 * Requests prompt=none through the backend and supplies the current URL as
 * returnTo. Returns true when navigation to the backend was requested.
 */
export const attemptSilentLogin = () => {
  // A user the app refuses is still authenticated at the provider, so retrying
  // would log them in and bounce them off again until the cooldown catches up.
  const hasAuthError = new URLSearchParams(window.location.search).has("auth_error");

  try {
    // An earlier attempt is still pending and the visitor is anonymous.
    // Consume it and restart the cooldown to avoid immediately retrying.
    if (sessionStorage.getItem(SILENT_LOGIN_PENDING_KEY)) {
      sessionStorage.removeItem(SILENT_LOGIN_PENDING_KEY);
      startCooldown();
      return false;
    }

    if (!hasRetryCooldownElapsed() || hasAuthError) {
      return false;
    }

    startCooldown();
    sessionStorage.setItem(SILENT_LOGIN_PENDING_KEY, "1");
  } catch {
    // Skip automatic login if retry state cannot be persisted.
    return false;
  }

  const url = new URL("authenticate/", baseApiUrl());
  url.searchParams.set("silent", "true");
  url.searchParams.set("returnTo", window.location.href);
  window.location.replace(url.href);
  return true;
};
