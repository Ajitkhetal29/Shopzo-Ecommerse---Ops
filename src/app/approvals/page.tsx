"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";

type ApprovalItem = {
  _id: string;
  type: "warehouse" | "vendor";
  name: string;
  email: string;
  contactNumber: string;
  address?: { formatted?: string; city?: string; state?: string };
  createdAt?: string;
};

export default function ApprovalsPage() {
  const [tab, setTab] = useState<"warehouse" | "vendor">("warehouse");
  const [warehouses, setWarehouses] = useState<ApprovalItem[]>([]);
  const [vendors, setVendors] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_PENDING_APPROVALS, { withCredentials: true });
      if (res.data.success) {
        setWarehouses(res.data.warehouses || []);
        setVendors(res.data.vendors || []);
      }
    } catch {
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const review = async (kind: "warehouse" | "vendor", id: string, decision: "approve" | "reject") => {
    setActingId(id);
    try {
      const base =
        kind === "warehouse" ? API_ENDPOINTS.REVIEW_WAREHOUSE_APPROVAL : API_ENDPOINTS.REVIEW_VENDOR_APPROVAL;
      const res = await axios.post(`${base}/${id}`, { decision }, { withCredentials: true });
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchPending();
      } else {
        toast.error(res.data.message || "Action failed");
      }
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : "Action failed";
      toast.error(message || "Action failed");
    } finally {
      setActingId(null);
    }
  };

  const items = tab === "warehouse" ? warehouses : vendors;

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Approvals
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Self-registered warehouses and vendors wait here until Super Admin approves login.
        </p>
      </div>

      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
        {(["warehouse", "vendor"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === value
                ? "bg-amber-600 text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            {value}s ({value === "warehouse" ? warehouses.length : vendors.length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-card p-12 text-center shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No pending {tab}s</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New self-registrations will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.email}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.contactNumber}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {item.address?.formatted || [item.address?.city, item.address?.state].filter(Boolean).join(", ") || "No address"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={actingId === item._id}
                    onClick={() => review(tab, item._id, "reject")}
                    className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actingId === item._id}
                    onClick={() => review(tab, item._id, "approve")}
                    className="h-10 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white disabled:opacity-60 hover:bg-amber-700"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
