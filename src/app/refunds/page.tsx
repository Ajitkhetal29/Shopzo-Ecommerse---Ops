"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";

type Refund = {
  _id: string;
  amount: number;
  status: "pending" | "approved" | "processing" | "refunded" | "rejected";
  reason?: string;
  notes?: string;
  paymentMethod?: string;
  razorpayPaymentId?: string | null;
  createdAt?: string;
  user?: { name?: string; email?: string; phone?: string };
  order?: { _id: string; orderStatus?: string; paymentStatus?: string };
};

const TABS = ["all", "pending", "approved", "processing", "refunded", "rejected"] as const;

const NEXT: Record<Refund["status"], Refund["status"][]> = {
  pending: ["approved", "rejected"],
  approved: ["processing", "rejected"],
  processing: ["refunded", "rejected"],
  refunded: [],
  rejected: [],
};

const badge = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "approved":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "processing":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    case "refunded":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "rejected":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function OpsRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => setPage(1), [tab]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_REFUNDS, {
        withCredentials: true,
        params: { status: tab, page, limit: 10 },
      });
      if (res.data.success) {
        setRefunds(res.data.refunds ?? []);
        setTotalPages(Math.max(1, Number(res.data.totalPages) || 1));
        setTotalCount(Number(res.data.totalCount) || 0);
      }
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const updateStatus = async (id: string, status: Refund["status"]) => {
    setUpdatingId(id);
    try {
      await axios.patch(
        `${API_ENDPOINTS.UPDATE_REFUND_STATUS}/${id}/status`,
        { status },
        { withCredentials: true }
      );
      toast.success(`Refund marked ${status}`);
      await fetchRefunds();
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Refunds</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Review and update refund tickets. Mark refunded after money is sent.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading refunds...</p>
      ) : refunds.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          No refunds found
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div
              key={refund._id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {refund.createdAt ? new Date(refund.createdAt).toLocaleString() : "-"} · order #
                    {refund.order?._id ? String(refund.order._id).slice(-8).toUpperCase() : "-"}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {refund.user?.name || "Buyer"} · ₹{Number(refund.amount || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {refund.user?.phone || refund.user?.email || "-"} · {refund.reason?.replace("_", " ")}
                  </p>
                  {refund.razorpayPaymentId ? (
                    <p className="mt-1 font-mono text-xs text-slate-500">{refund.razorpayPaymentId}</p>
                  ) : null}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge(refund.status)}`}>
                  {refund.status}
                </span>
              </div>

              {NEXT[refund.status].length > 0 && (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {NEXT[refund.status].map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updatingId === refund._id}
                      onClick={() => updateStatus(refund._id, status)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize disabled:opacity-50 ${
                        status === "rejected"
                          ? "border border-rose-300 text-rose-700"
                          : "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      }`}
                    >
                      {updatingId === refund._id ? "Updating..." : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-2 text-sm text-slate-600 dark:text-slate-400">
          <span>
            Page {page} of {totalPages} · {totalCount} total
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
