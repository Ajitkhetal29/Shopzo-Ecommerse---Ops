"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
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
  fulfillments?: {
    status: string;
    locationType?: string;
    expectedDeliveryDate?: string | null;
  }[];
};

const TABS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const badge = (status?: string) => {
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

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

export default function OpsOrdersPage() {
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [tab]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_ORDERS, {
        withCredentials: true,
        params: { status: tab, page, limit: 10 },
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
  }, [tab, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          All buyer orders and their fulfillment status
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
        <p className="text-sm text-slate-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800">
          No orders found
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {formatDate(order.createdAt)} · #{String(order._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {order.user?.name || order.deliveryContact?.name || "Buyer"} · ₹
                    {(order.totalAmount ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {order.user?.phone || order.deliveryContact?.phone || "-"} ·{" "}
                    {order.deliveryAddress?.formatted ||
                      [order.deliveryAddress?.city, order.deliveryAddress?.pincode].filter(Boolean).join(" ") ||
                      "-"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                  <span className="text-xs capitalize text-slate-500">
                    {order.paymentMethod} · {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                ETA: {formatDate(order.expectedDeliveryDate)}
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {order.items.map((item, idx) => (
                  <li key={`${order._id}-${idx}`} className="flex justify-between gap-3">
                    <span>{item.variant?.product?.name || item.variant?.sku || "Item"}</span>
                    <span className="text-slate-500">×{item.quantity}</span>
                  </li>
                ))}
              </ul>

              {order.fulfillments && order.fulfillments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.fulfillments.map((f, idx) => (
                    <span
                      key={`${order._id}-f-${idx}`}
                      className="rounded-full border border-slate-200 px-2 py-0.5 text-xs capitalize text-slate-600 dark:border-slate-600 dark:text-slate-300"
                    >
                      {f.locationType || "shipment"}: {f.status}
                    </span>
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
