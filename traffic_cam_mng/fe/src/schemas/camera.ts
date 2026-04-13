import { z } from "zod";

export const rtspConnectionSchema = z.object({
  host: z.string().min(1, "Host bắt buộc"),
  port: z.string().regex(/^\d+$/, "Cổng phải là số").default("554"),
  path: z.string().default(""),
  username: z.string().optional(),
  password: z.string().optional(),
});

export const httpMjpegConnectionSchema = z.object({
  url: z.string().url("URL không hợp lệ"),
  authType: z.enum(["none", "basic", "bearer"]).default("none"),
  username: z.string().optional(),
  password: z.string().optional(),
  bearerToken: z.string().optional(),
});

export const hlsConnectionSchema = z.object({
  url: z.string().regex(/\.m3u8($|\?)/i, "URL phải là .m3u8"),
});

export const webrtcConnectionSchema = z.object({
  signalingUrl: z.string().url("Signaling URL không hợp lệ"),
  iceServers: z.string().optional(),
});

export const usbConnectionSchema = z.object({
  device: z.string().min(1, "Đường dẫn thiết bị bắt buộc"),
});

export const cameraFormSchema = z.object({
  name: z.string().min(1, "Tên camera bắt buộc").max(100),
  sourceType: z.enum(["RTSP", "HTTP_MJPEG", "WEBRTC", "USB", "HLS"]),
  connectionConfig: z.record(z.any()),
  groupId: z.string().optional().nullable(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  detectionSettings: z.object({
    detectVehicles: z.boolean().default(true),
    vehicleTypes: z.array(z.enum(["car", "truck", "bus", "motorcycle"])).default(["car", "motorcycle"]),
    detectPersons: z.boolean().default(false),
    detectPlates: z.boolean().default(false),
  }).optional(),
  detectionEnabled: z.boolean().default(false),
});

export type CameraFormData = z.infer<typeof cameraFormSchema>;
