"use client";

import { useEffect, useState } from "react";
import { cameraService } from "@/services/cameraService";

export default function LiveViewPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cameraService.list({ size: 100 })
      .then((res) => setCameras((res.data.data?.items || []).filter((c: any) => c.status === "ACTIVE")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Live View</h2>

      {loading ? (
        <p className="text-gray-500">Loading cameras...</p>
      ) : cameras.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <p className="text-gray-500">No active cameras</p>
          <p className="mt-1 text-sm text-gray-600">Add and activate cameras to view live streams</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {cameras.map((cam: any) => (
            <div key={cam.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
              <div className="flex h-64 items-center justify-center bg-black text-gray-600">
                <div className="text-center">
                  <p className="text-2xl">&#127909;</p>
                  <p className="mt-2 text-sm">{cam.name}</p>
                  <p className="text-xs text-gray-700">{cam.sourceType} stream</p>
                  <p className="mt-2 text-xs text-blue-400">HLS.js player pending</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-gray-800 px-4 py-2">
                <span className="text-sm text-gray-300">{cam.name}</span>
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-400">LIVE</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
