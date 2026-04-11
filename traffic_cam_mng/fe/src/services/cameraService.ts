import api from "@/lib/api";

export const cameraService = {
  list: (params?: any) => api.get("/v1/cameras", { params }),
  get: (id: string) => api.get(`/v1/cameras/${id}`),
  create: (data: any) => api.post("/v1/cameras", data),
  update: (id: string, data: any) => api.put(`/v1/cameras/${id}`, data),
  delete: (id: string) => api.delete(`/v1/cameras/${id}`),
  start: (id: string) => api.put(`/v1/cameras/${id}/start`),
  stop: (id: string) => api.put(`/v1/cameras/${id}/stop`),
  getMap: () => api.get("/v1/cameras/map"),
  getStatusSummary: () => api.get("/v1/cameras/status-summary"),
};

export const approvalService = {
  list: (params?: any) => api.get("/v1/camera-approvals", { params }),
  get: (id: string) => api.get(`/v1/camera-approvals/${id}`),
  approve: (id: string) => api.put(`/v1/camera-approvals/${id}/approve`),
  reject: (id: string, reason?: string) =>
    api.put(`/v1/camera-approvals/${id}/reject`, { reason }),
};

export const groupService = {
  list: () => api.get("/v1/camera-groups"),
  create: (name: string, description?: string) =>
    api.post("/v1/camera-groups", { name, description }),
  delete: (id: string) => api.delete(`/v1/camera-groups/${id}`),
};

export const detectionService = {
  search: (params?: any) => api.get("/v1/detections", { params }),
  get: (id: string) => api.get(`/v1/detections/${id}`),
  getStats: (days?: number) => api.get("/v1/detections/stats", { params: { days } }),
};

export const dashboardService = {
  getSummary: () => api.get("/v1/dashboard/summary"),
  getDetectionTrend: (days?: number) =>
    api.get("/v1/dashboard/detection-trend", { params: { days } }),
  getCameraStatus: () => api.get("/v1/dashboard/camera-status"),
};

export const notificationService = {
  list: (params?: any) => api.get("/v1/notifications", { params }),
  getUnreadCount: () => api.get("/v1/notifications/unread-count"),
  markRead: (id: string) => api.put(`/v1/notifications/${id}/read`),
  markAllRead: () => api.put("/v1/notifications/read-all"),
  delete: (id: string) => api.delete(`/v1/notifications/${id}`),
};

export const systemConfigService = {
  getAll: () => api.get("/v1/system-config"),
  update: (key: string, value: string) =>
    api.put(`/v1/system-config/${key}`, { value }),
  getEnabledSources: () => api.get("/v1/system-config/public/enabled-sources"),
};

export const adminAssignmentService = {
  list: () => api.get("/v1/admin-assignments"),
  assign: (adminId: string, customerId: string) =>
    api.post("/v1/admin-assignments", { adminId, customerId }),
  remove: (adminId: string, customerId: string) =>
    api.delete(`/v1/admin-assignments/${adminId}/${customerId}`),
  getAdminCustomers: (adminId: string) =>
    api.get(`/v1/admin-assignments/admins/${adminId}/customers`),
  getUnassigned: () => api.get("/v1/admin-assignments/unassigned-customers"),
};
