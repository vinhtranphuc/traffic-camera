"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cameraService } from "@/services/cameraService";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", sourceType: "RTSP", url: "", username: "", password: "", port: "554" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    cameraService.list()
      .then((res) => setCameras(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await cameraService.create({
        name: form.name,
        sourceType: form.sourceType,
        connectionConfig: { url: form.url, username: form.username, password: form.password, port: form.port },
      });
      setShowAdd(false);
      setForm({ name: "", sourceType: "RTSP", url: "", username: "", password: "", port: "554" });
      load();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this camera?")) return;
    await cameraService.delete(id);
    load();
  };

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-400",
    PENDING_APPROVAL: "bg-yellow-500/15 text-yellow-400",
    REJECTED: "bg-red-500/15 text-red-400",
    OFFLINE: "bg-gray-500/15 text-gray-400",
    STOPPED: "bg-gray-500/15 text-gray-400",
    ERROR: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Cameras</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + Add Camera
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-gray-300">New Camera</h3>
          <div className="grid grid-cols-3 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Camera name" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
              <option value="RTSP">RTSP</option>
              <option value="HTTP_MJPEG">HTTP/MJPEG</option>
              <option value="HLS">HLS</option>
              <option value="WEBRTC">WebRTC</option>
              <option value="USB">USB</option>
            </select>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="URL / IP Address" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} placeholder="Port" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving..." : "Create Camera"}
            </button>
            <button onClick={() => setShowAdd(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Loading cameras...</div>
      ) : cameras.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <p className="text-lg text-gray-500">No cameras yet</p>
          <p className="mt-1 text-sm text-gray-600">Click &quot;Add Camera&quot; to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {cameras.map((cam: any) => (
            <div key={cam.id} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">{cam.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{cam.sourceType} &middot; {cam.ownerName || "Unknown"}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[cam.status] || "bg-gray-700 text-gray-400"}`}>
                  {cam.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/cameras/${cam.id}`} className="rounded bg-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-600">Detail</Link>
                {cam.status === "ACTIVE" && (
                  <button onClick={() => cameraService.stop(cam.id).then(load)} className="rounded bg-yellow-600/20 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-600/30">Stop</button>
                )}
                {cam.status === "STOPPED" && (
                  <button onClick={() => cameraService.start(cam.id).then(load)} className="rounded bg-green-600/20 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600/30">Start</button>
                )}
                <button onClick={() => handleDelete(cam.id)} className="rounded bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/30">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
