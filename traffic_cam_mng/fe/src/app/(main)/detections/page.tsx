"use client";

import { useEffect, useState } from "react";
import { detectionService } from "@/services/cameraService";

export default function DetectionsPage() {
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plateFilter, setPlateFilter] = useState("");

  const load = (plate?: string) => {
    setLoading(true);
    detectionService.search({ plateText: plate || undefined, size: 50 })
      .then((res) => setDetections(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Detection History</h2>
        <div className="flex gap-2">
          <input value={plateFilter} onChange={(e) => setPlateFilter(e.target.value)} placeholder="Search plate..." className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          <button onClick={() => load(plateFilter)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Search</button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Camera</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Plate</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : detections.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No detections found</td></tr>
            ) : (
              detections.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-300">{new Date(d.timestamp).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-gray-300">{d.cameraName || d.cameraId}</td>
                  <td className="px-4 py-3"><span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">{d.objectType}</span></td>
                  <td className="px-4 py-3 text-gray-300">{(d.confidence * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">{d.plateText ? <span className="rounded bg-cyan-600/20 px-2 py-0.5 text-xs font-mono text-cyan-400">{d.plateText}</span> : <span className="text-gray-600">-</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
