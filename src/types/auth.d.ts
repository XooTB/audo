interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

interface AuthError {
  error: { message: string };
}
