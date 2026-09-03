"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api";
import { formatOpsDate, opsBadge } from "../OpsOrderList";

type OpsOrderDetail = {
  _id: string;
  totalAmount?: number;
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  expectedDeliveryDate?: string | null;
  createdAt?: string;
  deliveryInstructions?: string;
  user?: { name?: string; email?: string; phone?: string };
  deliveryContact?: { name?: string; phone?: string };
  deliveryAddress?: { formatted?: string; line1?: string; city?: string; pincode?: string };
  items: {
    quantity: number;
    variant?: { sku?: string; size?: string; color?: string; product?: { name?: string } | null } | null;
  }[];
  fulfillments?: {
    status: string;
    locationType?: string;
    expectedDeliveryDate?: string | null;
    warehouse?: { name?: string } | null;
    vendor?: { name?: string } | null;
    items?: {
      quantity: number;
      variant?: { sku?: string; product?: { name?: string } | null } | null;
    }[];
  }[];
  unfulfilledItems?: {
    quantity: number;
    variant?: { sku?: string; product?: { name?: string } | null } | null;
  }[];
};

const STEPS = ["assigned", "accepted", "packed", "shipped", "delivered"];

export default function OpsOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OpsOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_ENDPOINTS.GET_ORDER_BY_ID}/${params.id}`, {
        withCredentials: true,
      });
      if (res.data.success) setOrder(res.data.order);
      else setError(res.data.message || "Failed to load order");
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message || err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return (
    <div className="space-y-6">
      <Link href="/orders" className="text-sm font-medium text-blue-600 hover:underline">
        ← Back to orders
      </Link>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {order && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                {formatOpsDate(order.createdAt)} · #{String(order._id).slice(-8).toUpperCase()}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {order.user?.name || order.deliveryContact?.name || "Buyer"} · ₹
                {(order.totalAmount ?? 0).toLocaleString()}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {order.user?.email || "-"} · {order.user?.phone || order.deliveryContact?.phone || "-"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${opsBadge(order.orderStatus)}`}>
              {order.orderStatus}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Deliver to</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {order.deliveryAddress?.formatted ||
                [order.deliveryAddress?.line1, order.deliveryAddress?.city, order.deliveryAddress?.pincode]
                  .filter(Boolean)
                  .join(", ") ||
                "-"}
            </p>
            {order.deliveryInstructions ? (
              <p className="mt-2 text-sm text-slate-500">Note: {order.deliveryInstructions}</p>
            ) : null}
            <p className="mt-2 text-sm capitalize text-slate-500">
              {order.paymentMethod} · {order.paymentStatus} · ETA {formatOpsDate(order.expectedDeliveryDate)}
            </p>
          </div>

          {order.orderStatus !== "cancelled" && (order.unfulfilledItems || []).length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Dropped items:{" "}
              {(order.unfulfilledItems || [])
                .map((line) => `${line.variant?.product?.name || line.variant?.sku || "Item"} ×${line.quantity}`)
                .join(", ")}
            </div>
          )}

          {(order.fulfillments || []).map((fulfillment, idx) => {
            const current = STEPS.indexOf(fulfillment.status);
            const name =
              fulfillment.warehouse?.name || fulfillment.vendor?.name || fulfillment.locationType || "Hub";
            return (
              <div
                key={`${order._id}-f-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-medium text-slate-900 dark:text-white">
                    Shipment {idx + 1} · {name}
                  </p>
                  <span className="text-xs capitalize text-slate-500">{fulfillment.status}</span>
                </div>
                <ol className="mt-4 space-y-2">
                  {STEPS.map((step, stepIdx) => (
                    <li key={step} className="flex items-center gap-3 text-sm capitalize text-slate-600 dark:text-slate-300">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          fulfillment.status === "cancelled"
                            ? "bg-rose-400"
                            : stepIdx <= current
                              ? "bg-slate-900 dark:bg-white"
                              : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      {step}
                    </li>
                  ))}
                </ol>
                <ul className="mt-3 space-y-1 text-sm text-slate-500">
                  {(fulfillment.items || []).map((line, lineIdx) => (
                    <li key={`${order._id}-l-${lineIdx}`}>
                      {line.variant?.product?.name || line.variant?.sku || "Item"} ×{line.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
