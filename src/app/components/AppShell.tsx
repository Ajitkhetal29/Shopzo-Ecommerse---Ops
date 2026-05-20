"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { User } from "@/store/slices/authSlice";
import ThemeToggleButton from "@/app/components/ThemeToggleButton";

const SIDEBAR_KEY = "shopzo-sidebar-collapsed";

type NavItem = { label: string; href: string };

type AppShellProps = {
  children: React.ReactNode;
  menuItems: NavItem[];
  user: User;
  brandHref: string;
  onLogout: () => void | Promise<void>;
};

function roleLabel(role: User["role"]) {
  if (!role) return "";
  return typeof role === "object" ? role.name : String(role);
}

function deptLabel(dept: User["department"]) {
  if (!dept) return "";
  return typeof dept === "object" ? dept.name : String(dept);
}

export default function AppShell({ children, menuItems, user, brandHref, onLogout }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const linkActive = (href: string) =>
    href !== "#" && (pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)));

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#f4f7fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh w-[17.5rem] flex-col border-r border-slate-950/10 bg-slate-950 text-slate-300 shadow-2xl shadow-slate-950/10 transition-[transform,width] duration-200 ease-out dark:border-white/10 dark:bg-[#08111f] lg:z-30 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-[4.75rem]" : "lg:w-72",
        ].join(" ")}
      >
        <div className="flex h-[4.25rem] shrink-0 items-center border-b border-white/10 px-4">
          <Link
            href={brandHref}
            className={`flex min-w-0 flex-1 items-center gap-3 text-white ${collapsed ? "justify-center" : ""}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">
              S
            </span>
            <span className={collapsed ? "sr-only" : "min-w-0"}>
              <span className="block text-sm font-bold uppercase tracking-[0.16em]">Shopzo</span>
              <span className="block truncate text-xs font-medium text-slate-400">Operations panel</span>
            </span>
          </Link>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-5">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = linkActive(item.href);
              return (
                <li key={`${item.href}-${item.label}`} className="relative">
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-[0.875rem] font-semibold leading-snug transition-colors sm:text-[0.925rem]",
                      active ? "bg-white text-slate-950 shadow-sm" : "text-slate-400 hover:bg-white/[0.07] hover:text-white",
                      collapsed ? "justify-center px-2.5 py-3" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed ? (
                      <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-amber-400" aria-hidden />
                    ) : null}
                    <NavIcon href={item.href} label={item.label} active={active} />
                    <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 px-3 py-4">
          {!collapsed ? (
            <div className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-200">{deptLabel(user.department) || "Operations"}</p>
            </div>
          ) : null}
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-[4.75rem]" : "lg:ml-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/90 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 sm:gap-3 sm:px-5">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>

          <div className="min-w-0 flex-1 pl-0.5">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Ops command center</p>
            <p className="truncate text-sm leading-snug text-slate-500 dark:text-slate-400">
              Catalog, warehouses, vendors and teams
            </p>
          </div>

          <div className="hidden lg:flex lg:w-[19rem]">
            <label className="relative block w-full">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                placeholder="Search operations..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[0.9375rem] text-slate-700 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-amber-400/50"
              />
            </label>
          </div>

          <Link
            href="/map-test"
            className="hidden shrink-0 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 lg:inline-flex"
          >
            Map Test
          </Link>

          <ThemeToggleButton
            className={[
              "shrink-0 rounded-full border p-2 text-slate-600 transition-colors",
              "border-slate-200/90 bg-white hover:bg-slate-50",
              "dark:border-white/10 dark:bg-white/5 dark:text-amber-100/90 dark:hover:bg-white/10",
            ].join(" ")}
          />

          <div className="hidden min-w-0 items-center gap-3 sm:flex md:gap-4">
            <div className="min-w-0 text-right">
              <p className="truncate text-[0.9375rem] font-semibold text-slate-950 dark:text-slate-100">{user.name}</p>
              <p className="max-w-[16rem] truncate text-xs leading-snug text-slate-500 dark:text-slate-400">
                {deptLabel(user.department)} / {roleLabel(user.role)}
              </p>
              {user.email ? <p className="max-w-[16rem] truncate text-[0.75rem] text-slate-400 dark:text-slate-500">{user.email}</p> : null}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white dark:bg-amber-300 dark:text-slate-950">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-[0.8125rem] font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 sm:px-4 sm:text-sm"
          >
            Log out
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fb] dark:bg-slate-950">
          <div className="w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-5 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ href, label, active }: { href: string; label: string; active: boolean }) {
  const c = `h-5 w-5 shrink-0 ${active ? "text-slate-950" : "text-slate-500 group-hover:text-amber-300"}`;
  const text = `${href} ${label}`.toLowerCase();
  if (text.includes("dashboard")) return <Icon className={c} path="M4 5h7v7H4V5Zm9 0h7v4h-7V5ZM4 14h7v5H4v-5Zm9-3h7v8h-7v-8Z" />;
  if (text.includes("user")) return <Icon className={c} path="M16 11a4 4 0 10-8 0m8 0a4 4 0 01-8 0m8 0c2.5.6 4 2 4 4v2H4v-2c0-2 1.5-3.4 4-4" />;
  if (text.includes("warehouse")) return <Icon className={c} path="M3 21h18M5 21V8l7-4 7 4v13M8 21v-6h8v6M8 11h8" />;
  if (text.includes("vendor")) return <Icon className={c} path="M4 10h16l-1-5H5l-1 5Zm1 0v9h14v-9M8 19v-5h4v5" />;
  if (text.includes("product")) return <Icon className={c} path="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" />;
  if (text.includes("order")) return <Icon className={c} path="M7 4h10l2 4v12H5V8l2-4Zm-2 4h14M9 12h6M9 16h4" />;
  if (text.includes("support")) return <Icon className={c} path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v.01M9.75 9a2.25 2.25 0 1 1 3.6 1.8c-.8.6-1.35 1.1-1.35 2.2" />;
  if (text.includes("analytics")) return <Icon className={c} path="M4 19V5M4 19h16M8 15l3-3 3 2 4-6" />;
  return <Icon className={c} path="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />;
}

function Icon({ className, path }: { className?: string; path: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return <Icon className={className} path="M21 21l-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />;
}

function MenuIcon() {
  return <Icon className="h-5 w-5" path="M4 6h16M4 12h16M4 18h16" />;
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return collapsed ? (
    <Icon className="h-5 w-5" path="M13 5l7 7-7 7M5 5l7 7-7 7" />
  ) : (
    <Icon className="h-5 w-5" path="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  );
}
