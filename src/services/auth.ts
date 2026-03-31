const BASE_URL = "http://localhost:3001";

export async function signup(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err: AuthError = await res.json();
    throw new Error(err.error.message);
  }

  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err: AuthError = await res.json();
    throw new Error(err.error.message);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ token: string }> {
  const res = await fetch(`${BASE_URL}/user/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh token");
  }

  return res.json();
}

export async function fetchCurrentUser(
  token: string
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }

  return res.json();
}

let refreshPromise: Promise<string> | null = null;

export async function authFetch(
  url: string,
  options: RequestInit = {},
  onAuthFailure?: () => void
): Promise<Response> {
  const token = localStorage.getItem("audo_auth_token");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status !== 401) return res;

  const storedRefreshToken = localStorage.getItem("audo_refresh_token");
  if (!storedRefreshToken) {
    onAuthFailure?.();
    return res;
  }

  try {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken(storedRefreshToken).then(
        (data) => {
          localStorage.setItem("audo_auth_token", data.token);
          return data.token;
        }
      );
    }

    const newToken = await refreshPromise;

    const retried = fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    });
    refreshPromise = null;
    return retried;
  } catch {
    refreshPromise = null;
    onAuthFailure?.();
    return res;
  }
}
