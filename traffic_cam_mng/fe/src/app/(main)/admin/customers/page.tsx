"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/authService";

export default function CustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "CUSTOMER" });

  const load = () => {
    setLoading(true);
    userService.listUsers({ size: 50 })
      .then((res) => setUsers(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      await userService.createUser(form);
      setShowCreate(false);
      setForm({ username: "", password: "", fullName: "", role: "CUSTOMER" });
      load();
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">+ Create User</button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700">Create</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-gray-800 text-gray-400">
            <th className="px-4 py-3">Username</th><th className="px-4 py-3">Full Name</th>
            <th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No users</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="px-4 py-3 text-white">{u.username}</td>
                <td className="px-4 py-3 text-gray-300">{u.fullName}</td>
                <td className="px-4 py-3"><span className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">{u.role}</span></td>
                <td className="px-4 py-3">{u.isLocked ? <span className="text-red-400">Locked</span> : <span className="text-green-400">Active</span>}</td>
                <td className="px-4 py-3">
                  {u.isLocked ? (
                    <button onClick={() => userService.unlockUser(u.id).then(load)} className="rounded bg-green-600/20 px-2 py-1 text-xs text-green-400">Unlock</button>
                  ) : (
                    <button onClick={() => userService.lockUser(u.id, "Admin action").then(load)} className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400">Lock</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
