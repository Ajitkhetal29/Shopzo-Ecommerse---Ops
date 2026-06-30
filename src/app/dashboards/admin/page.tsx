"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { setDashboardStats } from "@/store/slices/dashboardStats";
import type { AppDispatch, RootState } from "@/store";

type Metric = {
  name: string;
  value: string;
  href: string;
  change: string;
  tone: "amber" | "emerald" | "sky" | "violet" | "rose" | "slate";
  icon: React.ReactNode;
};

const toneClasses: Record<Metric["tone"], string> = {
  amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-400/20",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-400/20",
  violet:
    "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-400/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/20",
  slate:
    "bg-shop-surface text-foreground ring-shop-border dark:bg-neutral-800 dark:text-neutral-200 dark:ring-shop-border",
};

const pipeline = [
  { label: "Placed", value: 142, width: "88%" },
  { label: "Packed", value: 96, width: "64%" },
  { label: "Out for delivery", value: 58, width: "42%" },
  { label: "Resolved", value: 31, width: "28%" },
];

const alerts = [
  { title: "Vendor onboarding pending", detail: "3 partners waiting for document approval", tone: "amber" },
  { title: "Catalog review", detail: "12 products need price or image fixes", tone: "sky" },
  { title: "Warehouse capacity", detail: "North hub is running at 82% capacity", tone: "rose" },
];

const tasks = [
  { title: "Approve new vendors", meta: "Legal and GST checks", href: "/vendor" },
  { title: "Review product queue", meta: "Images, variants, pricing", href: "/products" },
  { title: "Assign warehouse owners", meta: "User access cleanup", href: "/warehouse" },
  { title: "Refresh general settings", meta: "Roles, categories, departments", href: "/genral" },
];

const AdminDashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dashboardStats = useSelector((state: RootState) => state.dashboardStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await axios.get(API_ENDPOINTS.GET_DASHBOARD_STATS, { withCredentials: true });
        if (!mounted) return;
        if (result.data.success) {
          dispatch(setDashboardStats(result.data.stats));
        } else {
          setError("Could not load dashboard stats.");
        }
      } catch {
        if (mounted) setError("Could not load dashboard stats.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const stats = useMemo<Metric[]>(
    () => [
      {
        name: "Users",
        value: String(dashboardStats.totalUsers ?? 0),
        href: "/users",
        change: "Team access",
        tone: "amber",
        icon: <IconUsers />,
      },
      {
        name: "Warehouses",
        value: String(dashboardStats.totalWarehouses ?? 0),
        href: "/warehouse",
        change: "Fulfilment nodes",
        tone: "emerald",
        icon: <IconWarehouse />,
      },
      {
        name: "Vendors",
        value: String(dashboardStats.totalVendors ?? 0),
        href: "/vendor",
        change: "Seller network",
        tone: "sky",
        icon: <IconStore />,
      },
      {
        name: "Products",
        value: String(dashboardStats.totalProducts ?? 0),
        href: "/products",
        change: "Catalog SKUs",
        tone: "violet",
        icon: <IconBox />,
      },
      {
        name: "Departments",
        value: String(dashboardStats.totalDepartments ?? 0),
        href: "/genral",
        change: "Org setup",
        tone: "rose",
        icon: <IconGrid />,
      },
      {
        name: "Roles",
        value: String(dashboardStats.totalRoles ?? 0),
        href: "/genral",
        change: "Permissions",
        tone: "slate",
        icon: <IconShield />,
      },
    ],
    [dashboardStats],
  );

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5">
      <section className="overflow-hidden rounded-2xl border border-shop-border bg-shop-surface-raised shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.75fr)]">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/20">
                Live operations
              </span>
              <span className="rounded-full bg-shop-surface px-3 py-1 text-xs font-semibold text-shop-muted ring-1 ring-shop-border">
                Admin workspace
              </span>
            </div>

            <div className="mt-8 max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Command center for Shopzo operations
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-shop-muted sm:text-base">
                Track teams, warehouses, vendors, catalog health, and fulfilment pressure from one focused control room.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
              >
                Review catalog
              </Link>
              <Link
                href="/vendor"
                className="inline-flex h-11 items-center rounded-full border border-shop-border px-4 text-sm font-semibold text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Vendor queue
              </Link>
            </div>
          </div>

          <div className="border-t border-shop-border bg-shop-surface p-5 lg:border-l lg:border-t-0 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Today overview</p>
                <p className="mt-1 text-xs text-shop-muted">Operational throughput</p>
              </div>
              <span className="rounded-full bg-shop-surface-raised px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-400/20">
                Stable
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {pipeline.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-shop-muted">{item.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-shop-border">
                    <div className="h-2 rounded-full bg-shop-accent" style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-2xl border border-shop-border bg-shop-surface-raised p-5 text-sm font-medium text-shop-muted shadow-sm">
          Loading dashboard metrics...
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group rounded-2xl border border-shop-border bg-shop-surface-raised p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:hover:border-neutral-600"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${toneClasses[stat.tone]}`}>
                {stat.icon}
              </div>
              <span className="rounded-full bg-shop-surface px-2.5 py-1 text-xs font-semibold text-shop-muted transition group-hover:text-foreground">
                Open
              </span>
            </div>
            <p className="mt-5 text-sm font-medium text-shop-muted">{stat.name}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-4xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-shop-muted">
                {stat.change}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="rounded-2xl border border-shop-border bg-shop-surface-raised p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Priority work</h2>
              <p className="mt-1 text-sm text-shop-muted">Fast actions for the ops team.</p>
            </div>
            <Link href="/genral" className="text-sm font-semibold text-foreground hover:text-shop-accent">
              Manage settings
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {tasks.map((task) => (
              <Link
                key={task.title}
                href={task.href}
                className="rounded-xl border border-shop-border p-4 transition hover:border-shop-accent/40 hover:bg-shop-accent/5 dark:hover:border-shop-accent/30 dark:hover:bg-shop-accent/10"
              >
                <p className="font-semibold text-foreground">{task.title}</p>
                <p className="mt-1 text-sm text-shop-muted">{task.meta}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-shop-border bg-shop-surface-raised p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Risk queue</h2>
          <p className="mt-1 text-sm text-shop-muted">Items that need admin attention.</p>
          <div className="mt-5 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.title} className="rounded-xl border border-shop-border p-4">
                <div className="flex gap-3">
                  <span
                    className={[
                      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                      alert.tone === "amber" ? "bg-amber-500" : alert.tone === "sky" ? "bg-sky-500" : "bg-rose-500",
                    ].join(" ")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <p className="mt-1 text-sm leading-5 text-shop-muted">{alert.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

function IconUsers() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0m8 0a4 4 0 01-8 0m8 0c2.5.6 4 2 4 4v2H4v-2c0-2 1.5-3.4 4-4" />
    </svg>
  );
}

function IconWarehouse() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V8l7-4 7 4v13M8 21v-6h8v6M8 11h8" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16l-1-5H5l-1 5Zm1 0v9h14v-9M8 19v-5h4v5" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v5c0 4.2 2.7 8 7 10 4.3-2 7-5.8 7-10V6l-7-3Z" />
    </svg>
  );
}

export default AdminDashboardPage;
