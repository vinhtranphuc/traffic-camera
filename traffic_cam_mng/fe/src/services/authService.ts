import api from "@/lib/api";

export const authService = {
  login: (username: string, password: string) =>
    api.post("/v1/auth/login", { username, password }),

  register: (data: { username: string; password: string; fullName: string; email?: string }) =>
    api.post("/v1/auth/register", data),

  refresh: (refreshToken: string) =>
    api.post("/v1/auth/refresh", { refreshToken }),

  logout: (refreshToken?: string) =>
    api.post("/v1/auth/logout", { refreshToken }),

  logoutAll: () => api.post("/v1/auth/logout-all"),
};

export const userService = {
  getProfile: () => api.get("/v1/users/me"),
  updateProfile: (data: any) => api.put("/v1/users/me", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/v1/users/me/password", data),
  getSessions: () => api.get("/v1/users/me/sessions"),
  revokeSession: (id: string) => api.delete(`/v1/users/me/sessions/${id}`),
  listUsers: (params?: any) => api.get("/v1/users", { params }),
  createUser: (data: any) => api.post("/v1/users", data),
  lockUser: (id: string, reason?: string) => api.put(`/v1/users/${id}/lock`, { reason }),
  unlockUser: (id: string) => api.put(`/v1/users/${id}/unlock`),
};
