"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";

type OpsOrder = {
  _id: string;
  totalAmount?: number;
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  expectedDeliveryDate?: string | null;
  createdAt?: string;
  user?: { name?: string; email?: string; phone?: string };
  deliveryContact?: { name?: string; phone?: string };
  deliveryAddress?: { formatted?: string; city?: string; pincode?: string };
  items: {
    quantity: number;
    variant?: { sku?: string; product?: { name?: string } | null } | null;
  }[];
  fulfillments?: { status: string; locationType?: string }[];
};

export const opsBadge = (status?: string) => {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "shipped":
      return "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";
    case "delivered":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
    case "cancelled":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  }
};

export const formatOpsDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

export default function OpsOrderList({
  scope,
  title,
  subtitle,
}: {
  scope: "open" | "history";
  title: string;
  subtitle: string;
}) {
  const tabs =
    scope === "history"
      ? (["all", "delivered", "cancelled"] as const)
      : (["all", "pending", "confirmed", "shipped"] as const);
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [tab, scope]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_ORDERS, {
        withCredentials: true,
        params: { status: tab, scope, page, limit: 10 },
      });
      if (res.data.success) {
        setOrders(res.data.orders ?? []);
        setTotalPages(Math.max(1, Number(res.data.totalPages) || 1));
        setTotalCount(Number(res.data.totalCount) || 0);
      }
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [tab, page, scope]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
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
        <p className="text-sm text-slate-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          No orders found
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order._id} href={`/orders/${order._id}`} className="block">
              <div className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {formatOpsDate(order.createdAt)} · #{String(order._id).slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {order.user?.name || order.deliveryContact?.name || "Buyer"} · ₹
                      {(order.totalAmount ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {order.user?.phone || order.deliveryContact?.phone || "-"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${opsBadge(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-blue-600">View details</p>
              </div>
            </Link>
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
