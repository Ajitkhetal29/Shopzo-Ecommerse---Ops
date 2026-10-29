"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";

type AgentItem = {
  _id: string;
  name: string;
  email: string;
  contact: string;
  shopzoDeliveryId?: string;
  workingRadius?: number;
  workSameAsHome?: boolean;
  homeAddress?: { formatted?: string; city?: string; state?: string };
  address?: { formatted?: string; city?: string; state?: string };
  aadhaar?: {
    number?: string;
    frontPhoto?: string;
    backPhoto?: string;
  };
  vehicleDetails?: {
    vehicleType?: string;
    vehicleNumber?: string;
    vehicleRcPhoto?: string;
    licensePhoto?: string;
  };
  kycSubmittedAt?: string;
  approvedAt?: string;
  createdAt?: string;
  approvalStatus?: "incomplete" | "pending" | "approved" | "rejected" | string;
  isActive?: boolean;
  rejectionReason?: string | null;
};

type QueueStatus = "pending" | "approved" | "rejected";

const TABS: { id: QueueStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function addr(a?: { formatted?: string; city?: string; state?: string }) {
  return a?.formatted || [a?.city, a?.state].filter(Boolean).join(", ") || "—";
}

export default function DeliveryAgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [status, setStatus] = useState<QueueStatus>("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.LIST_DELIVERY_AGENTS, {
        withCredentials: true,
        params: { status, q: query || undefined },
      });
      if (res.data.success) setAgents(res.data.agents || []);
    } catch {
      toast.error("Failed to load delivery partners");
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const approve = async (id: string) => {
    setActingId(id);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.APPROVE_DELIVERY_AGENT}/${id}/approve`,
        {},
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchAgents();
      } else toast.error(res.data.message || "Approve failed");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error.response?.data?.message || "Approve failed" : "Approve failed"
      );
    } finally {
      setActingId(null);
    }
  };

  const reject = async (id: string) => {
    setActingId(id);
    try {
      const res = await axios.post(
        `${API_ENDPOINTS.REJECT_DELIVERY_AGENT}/${id}/reject`,
        { reason: rejectReason.trim() || undefined },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setRejectId(null);
        setRejectReason("");
        await fetchAgents();
      } else toast.error(res.data.message || "Reject failed");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error.response?.data?.message || "Reject failed" : "Reject failed"
      );
    } finally {
      setActingId(null);
    }
  };

  const setActive = async (id: string, isActive: boolean) => {
    setActingId(id);
    try {
      const res = await axios.patch(
        `${API_ENDPOINTS.SET_DELIVERY_AGENT_ACTIVE}/${id}/active`,
        { isActive },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchAgents();
      } else toast.error(res.data.message || "Update failed");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error.response?.data?.message || "Update failed" : "Update failed"
      );
    } finally {
      setActingId(null);
    }
  };

  const emptyCopy =
    status === "pending"
      ? "Submitted Aadhaar + vehicle packs show up here."
      : status === "approved"
        ? "Approved partners show up here."
        : "Rejected KYC packs show up here.";

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="border-b border-slate-200/80 pb-6 dark:border-slate-700/60">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Delivery agent KYC
        </h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Review pending KYC, look up approved or rejected partners, and deactivate an approved account
          from here.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id);
                setRejectId(null);
                setRejectReason("");
              }}
              className={`h-9 rounded-xl px-3 text-sm font-semibold ${
                status === tab.id
                  ? "bg-amber-600 text-white"
                  : "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, mobile, id"
          className="h-10 w-full rounded-xl border border-slate-300 bg-transparent px-3 text-sm sm:max-w-xs dark:border-slate-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-card p-12 text-center shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nothing in this view</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emptyCopy}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <article
              key={agent._id}
              className="rounded-2xl border border-slate-200/80 bg-card p-5 shadow-sm dark:border-slate-600/80 dark:bg-slate-800/80"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{agent.name}</h2>
                      <StatusPill status={agent.approvalStatus || "incomplete"} />
                      {agent.approvalStatus === "approved" ? (
                        <StatusPill status={agent.isActive === false ? "inactive" : "active"} />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {agent.shopzoDeliveryId} · {agent.email} · {agent.contact}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {agent.approvalStatus === "approved" && agent.approvedAt
                        ? `Approved ${new Date(agent.approvedAt).toLocaleString()}`
                        : agent.kycSubmittedAt
                          ? `KYC submitted ${new Date(agent.kycSubmittedAt).toLocaleString()}`
                          : "KYC not submitted"}
                    </p>
                    {agent.approvalStatus === "rejected" && agent.rejectionReason ? (
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">{agent.rejectionReason}</p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Home" value={addr(agent.homeAddress)} />
                    <Info
                      label="Work hub"
                      value={`${addr(agent.address)}${agent.workSameAsHome ? " (same as home)" : ""} · ${agent.workingRadius || 20} km`}
                    />
                    <Info label="Aadhaar" value={agent.aadhaar?.number || "—"} />
                    <Info
                      label="Vehicle"
                      value={`${agent.vehicleDetails?.vehicleType || "—"} · ${agent.vehicleDetails?.vehicleNumber || "—"}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Doc label="Aadhaar front" src={agent.aadhaar?.frontPhoto} />
                    <Doc label="Aadhaar back" src={agent.aadhaar?.backPhoto} />
                    <Doc label="RC" src={agent.vehicleDetails?.vehicleRcPhoto} />
                    <Doc label="License" src={agent.vehicleDetails?.licensePhoto} />
                  </div>

                  {rejectId === agent._id ? (
                    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-600">
                      <label className="block text-sm">
                        <span className="mb-1.5 block font-medium text-slate-600 dark:text-slate-300">
                          Rejection reason
                        </span>
                        <input
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Aadhaar back unclear"
                          className="h-10 w-full rounded-xl border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-600"
                        />
                      </label>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectId(null);
                            setRejectReason("");
                          }}
                          className="h-9 rounded-xl border border-slate-300 px-3 text-sm font-semibold dark:border-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={actingId === agent._id}
                          onClick={() => reject(agent._id)}
                          className="h-9 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Confirm reject
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {agent.approvalStatus === "pending" && rejectId !== agent._id ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={actingId === agent._id}
                      onClick={() => setRejectId(agent._id)}
                      className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={actingId === agent._id}
                      onClick={() => approve(agent._id)}
                      className="h-10 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white disabled:opacity-60 hover:bg-amber-700"
                    >
                      Approve
                    </button>
                  </div>
                ) : null}
                {agent.approvalStatus === "approved" ? (
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      disabled={actingId === agent._id}
                      onClick={() => setActive(agent._id, agent.isActive === false)}
                      className={`h-10 rounded-xl px-4 text-sm font-semibold disabled:opacity-60 ${
                        agent.isActive === false
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "border border-red-300 text-red-700 dark:border-red-900 dark:text-red-300"
                      }`}
                    >
                      {agent.isActive === false ? "Reactivate" : "Deactivate"}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "approved" || status === "active"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
      : status === "pending"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"
        : status === "rejected" || status === "inactive"
          ? "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${className}`}>
      {status}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 px-3 py-2 dark:border-slate-600/80">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

function Doc({ label, src }: { label: string; src?: string }) {
  return (
    <a
      href={src || undefined}
      target="_blank"
      rel="noreferrer"
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 ${src ? "" : "pointer-events-none opacity-60"}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center text-xs text-slate-500">Missing</div>
      )}
      <p className="border-t border-slate-200 px-2 py-1.5 text-center text-[11px] font-semibold dark:border-slate-600">
        {label}
      </p>
    </a>
  );
}
