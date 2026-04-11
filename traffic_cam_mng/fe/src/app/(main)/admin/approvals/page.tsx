"use client";

import { useEffect, useState } from "react";
import { approvalService } from "@/services/cameraService";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    approvalService.list({ status: "PENDING" })
      .then((res) => setApprovals(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await approvalService.approve(id);
    load();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    await approvalService.reject(id, reason);
    load();
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Pending Approvals</h2>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">No pending approvals</div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-yellow-800/30 bg-yellow-950/10 p-4">
              <div>
                <h3 className="text-sm font-medium text-white">{a.cameraName || "Camera"}</h3>
                <p className="text-xs text-gray-400">Requested by: {a.requestedByName} &middot; {new Date(a.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApprove(a.id)} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Approve</button>
                <button onClick={() => handleReject(a.id)} className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
