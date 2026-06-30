"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@/store/slices/authSlice";
import ThemeToggle from "@/app/components/ThemeToggle";
import { publicUrl } from "@/lib/basePath";

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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!profileOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [profileOpen]);

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
    <div className="flex h-dvh w-full overflow-hidden bg-shop-surface text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex h-dvh flex-col border-r border-shop-border bg-neutral-950 text-neutral-300 transition-[transform,width] duration-200 ease-out lg:z-30 lg:translate-x-0 dark:bg-neutral-950",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-[4.75rem] lg:w-[4.75rem]" : "w-[17.5rem] lg:w-72",
        ].join(" ")}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
          <Link
            href={brandHref}
            className={`flex min-w-0 flex-1 items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            onClick={() => setMobileNavOpen(false)}
          >
            {collapsed ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-shop-accent text-sm font-bold text-white">
                S
              </span>
            ) : (
              <Image
                src={publicUrl("/shopzo_logo_tp.png")}
                alt="Shopzo"
                width={110}
                height={36}
                className="h-7 w-auto object-contain"
                priority
              />
            )}
          </Link>
        </div>

        {!collapsed ? (
          <p className="px-5 pt-4 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Operations
          </p>
        ) : null}

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const active = linkActive(item.href);
              return (
                <li key={`${item.href}-${item.label}`} className="relative">
                  <Link
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-400 hover:bg-white/[0.07] hover:text-white",
                      collapsed ? "justify-center px-2.5" : "",
                    ].join(" ")}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && !collapsed ? (
                      <span
                        className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-shop-accent"
                        aria-hidden
                      />
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
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Workspace
              </p>
              <p className="mt-1 truncate text-sm font-medium text-neutral-200">
                {deptLabel(user.department) || "Operations"}
              </p>
            </div>
          ) : null}
        </div>
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out ${collapsed ? "lg:ml-[4.75rem]" : "lg:ml-72"}`}
      >
        <header className="sticky top-0 z-20 flex min-h-16 shrink-0 items-center gap-2 border-b border-shop-border bg-shop-surface-raised/90 px-3 py-2 backdrop-blur-md sm:gap-3 sm:px-5">
          <button
            type="button"
            className="rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-shop-muted transition hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>

          <div className="min-w-0 flex-1 pl-0.5">
            <p className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Ops command center
            </p>
            <p className="truncate text-xs text-shop-muted sm:text-sm">
              Catalog, warehouses, vendors and teams
            </p>
          </div>

          <div className="hidden lg:flex lg:w-[19rem]">
            <label className="relative block w-full">
              <span className="sr-only">Search operations</span>
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-shop-muted" />
              <input
                type="search"
                placeholder="Search operations..."
                className="h-10 w-full rounded-full border border-shop-border bg-shop-surface py-2 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-shop-muted focus:border-neutral-400 focus:bg-shop-surface-raised dark:focus:border-neutral-600"
              />
            </label>
          </div>

          <ThemeToggle />

          <div ref={profileRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-shop-border bg-shop-surface-raised p-1.5 shadow-lg">
                <div className="border-b border-shop-border px-3 py-2.5">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-xs text-shop-muted">
                    {deptLabel(user.department)} / {roleLabel(user.role)}
                  </p>
                  {user.email ? (
                    <p className="mt-0.5 truncate text-xs text-shop-muted">{user.email}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    void onLogout();
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void onLogout()}
            className="shrink-0 rounded-full border border-shop-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:px-4 sm:text-sm sm:hidden"
          >
            Log out
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-shop-surface">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ href, label, active }: { href: string; label: string; active: boolean }) {
  const c = `h-5 w-5 shrink-0 ${active ? "text-neutral-900" : "text-neutral-500 group-hover:text-shop-accent"}`;
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
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
