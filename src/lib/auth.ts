const AUTH_TOKEN_KEY = "authToken";
const AUTH_EVENT_NAME = "truckerwatch-auth-changed";

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const isAuthenticated = () => Boolean(getAuthToken());

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem("token");
  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
};

export const onAuthChanged = (callback: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === AUTH_TOKEN_KEY || event.key === "token") {
      callback();
    }
  };

  window.addEventListener(AUTH_EVENT_NAME, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, callback);
    window.removeEventListener("storage", handleStorage);
  };
};
