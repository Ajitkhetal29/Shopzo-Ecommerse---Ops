"use client";

import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type AddressBits = {
  area?: string;
  city?: string;
  state?: string;
  formatted?: string;
};

type Partner = {
  _id: string;
  name: string;
  email: string;
  contact: string;
  shopzoDeliveryId?: string;
  homeAddress?: AddressBits;
  address?: AddressBits;
  workSameAsHome?: boolean;
  workingRadius?: number;
  approvalStatus?: string;
  isActive?: boolean;
  dutyMode?: boolean;
  vehicleDetails?: { vehicleType?: string; vehicleNumber?: string };
};

function place(address?: AddressBits) {
  return address?.area || address?.city || address?.formatted || "—";
}

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(API_ENDPOINTS.LIST_DELIVERY_PARTNERS, {
          withCredentials: true,
          params: {
            page: pagination.page,
            limit: pagination.limit,
            q: query || undefined,
            area: area || undefined,
          },
        });
        if (cancelled) return;
        if (res.data.success) {
          setPartners(res.data.agents || []);
          setTotal(res.data.total || 0);
          setAreas(res.data.areas || []);
        }
      } catch {
        if (cancelled) return;
        setError("Failed to load delivery partners.");
        toast.error("Failed to load delivery partners.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pagination.page, pagination.limit, query, area]);

  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));
  const startCount = total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endCount = Math.min(pagination.page * pagination.limit, total);

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-[2rem] lg:leading-tight">
          Delivery partners
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Look up partners by mobile number and filter by the area they live or work in.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-card p-4 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mobile number"
            inputMode="tel"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 lg:max-w-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All areas</option>
            {areas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-card shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Home area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Work area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800/80">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No delivery partners match this search.
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20">
                            <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                              {partner.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{partner.name}</p>
                            <p className="text-xs text-slate-500">{partner.shopzoDeliveryId || partner.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {partner.contact}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {place(partner.homeAddress)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {partner.workSameAsHome ? "Same as home" : place(partner.address)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            partner.approvalStatus === "approved" && partner.isActive !== false
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                              : partner.approvalStatus === "pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : partner.approvalStatus === "rejected" || partner.isActive === false
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {partner.isActive === false ? "inactive" : partner.approvalStatus || "incomplete"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing {startCount} to {endCount} of {total} partners
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                pagination.page === 1
                  ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-600 dark:text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Previous
            </button>

            {Array.from({ length: 5 }, (_, i) => {
              const pageNum = pagination.page - 2 + i;
              if (pageNum <= 0 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    pagination.page === pageNum
                      ? "bg-amber-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= totalPages}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                pagination.page >= totalPages
                  ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-600 dark:text-slate-400"
                  : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Next
            </button>

            <select
              value={pagination.limit}
              onChange={(e) =>
                setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value, 10), page: 1 }))
              }
              className="ml-1 h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
