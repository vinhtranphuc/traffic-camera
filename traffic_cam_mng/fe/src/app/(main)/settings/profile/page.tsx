"use client";

import { useEffect, useState } from "react";
import { userService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    userService.getProfile().then((res) => {
      const p = res.data.data;
      setForm({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "" });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(form);
      setUser({ ...user!, fullName: res.data.data.fullName });
      setMsg("Profile updated!");
    } catch { setMsg("Failed to update"); }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Profile Settings</h2>
      <div className="max-w-lg space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-6">
        {msg && <div className="rounded bg-green-600/20 p-2 text-sm text-green-400">{msg}</div>}
        <div>
          <label className="mb-1 block text-sm text-gray-400">Full Name</label>
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Email</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" />
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
