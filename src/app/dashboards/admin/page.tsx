"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { setDashboardStats } from "@/store/slices/dashboardStats";
import type { AppDispatch, RootState } from "@/store";

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

  const stats = useMemo(
    () => [
      { name: "Total Users", value: String(dashboardStats.totalUsers ?? 0), icon: "👥", href: "/users", iconWrap: "bg-amber-100 dark:bg-amber-500/20" },
      { name: "Warehouses", value: String(dashboardStats.totalWarehouses ?? 0), icon: "🏭", href: "/warehouse", iconWrap: "bg-emerald-100 dark:bg-emerald-500/20" },
      { name: "Vendors", value: String(dashboardStats.totalVendors ?? 0), icon: "🏢", href: "/vendor", iconWrap: "bg-sky-100 dark:bg-sky-500/20" },
      { name: "Departments", value: String(dashboardStats.totalDepartments ?? 0), icon: "🏛️", href: "/genral", iconWrap: "bg-teal-100 dark:bg-teal-500/20" },
      { name: "Roles", value: String(dashboardStats.totalRoles ?? 0), icon: "👔", href: "/genral", iconWrap: "bg-rose-100 dark:bg-rose-500/20" },
      { name: "Orders", value: "0", icon: "📦", href: "/orders", iconWrap: "bg-violet-100 dark:bg-violet-500/20" },
      { name: "Products", value: String(dashboardStats.totalProducts ?? 0), icon: "🛍️", href: "/products", iconWrap: "bg-orange-100 dark:bg-orange-500/20" },
    ],
    [dashboardStats],
  );

  const quickActions = [
    { name: "Add User", href: "/users/add", icon: "➕" },
    { name: "Add Warehouse", href: "/warehouse/add", icon: "🏭" },
    { name: "Add Vendor", href: "/vendor/add", icon: "🏢" },
    { name: "Manage General", href: "/genral", icon: "⚙️" },
    { name: "View Orders", href: "/orders", icon: "📋" },
    { name: "Manage Products", href: "/products", icon: "📦" },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-[2.05rem] lg:text-[2.2rem] lg:leading-tight">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-[0.95rem] leading-relaxed text-slate-600 dark:text-slate-400">
          Overview of your e-commerce operations — users, inventory, partners, and catalog health at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading metrics…</p>
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Key metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-amber-500/35 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/90"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.iconWrap} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg`}>
                  <span aria-hidden>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{stat.name}</p>
                  <p className="mt-1 text-[2rem] font-semibold tabular-nums leading-none tracking-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Quick actions</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Shortcuts to common admin tasks</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex min-h-[3.25rem] items-center rounded-xl border border-slate-200/80 px-3 py-3 transition-colors hover:border-amber-500/40 hover:bg-amber-50/80 dark:border-slate-700 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/10 sm:px-4"
            >
              <span className="mr-3 text-xl" aria-hidden>
                {action.icon}
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:p-6">
        <h2 className="mb-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Recent activity</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Latest changes across the platform</p>
        <div className="rounded-xl border border-dashed border-slate-200/90 py-14 text-center dark:border-slate-600/80">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No recent activity to display</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
