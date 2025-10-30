interface TokenData {
  access: string;
  refresh: string;
}

export const saveTokenData = (tokenData: TokenData): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("access", tokenData.access);
  localStorage.setItem("refresh", tokenData.refresh);
};

export const clearTokenData = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("authUser");

  localStorage.setItem("authUser", "");

  localStorage.removeItem("authUser");
};

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("access");
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("refresh");
};

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  const token = getAccessToken();
  return !!token;
};
