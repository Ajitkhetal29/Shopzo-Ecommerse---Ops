"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { opsCard, opsPageHeader, opsPrimaryBtn, opsSubtitle, opsTitle } from "@/lib/ops-ui";
import type { AppDispatch, RootState } from "@/store";
import { setUser, type User } from "@/store/slices/authSlice";

function labelOf(value: User["department"] | User["role"]) {
  if (!value) return "—";
  return typeof value === "object" ? value.name || "—" : String(value);
}

export default function OpsProfilePage() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted || !res.data?.success || !res.data.user) return;
        dispatch(setUser(res.data.user));
      } catch {
        toast.error("Could not load profile");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
          <p className="text-sm font-medium text-shop-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className={`${opsCard} p-6 text-sm text-shop-muted`}>Profile could not be loaded.</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className={`${opsPageHeader}`}>
        <div>
          <h1 className={opsTitle}>My profile</h1>
          <p className={opsSubtitle}>Your ops account details. Department and role are managed by Super Admin.</p>
        </div>
        <Link href="/profile/edit" className={`${opsPrimaryBtn} shrink-0`}>
          Edit profile
        </Link>
      </div>

      <section className={`${opsCard} p-6 sm:p-7`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-lg font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tracking-tight">{user.name}</p>
            <p className="text-sm text-shop-muted">
              {labelOf(user.department)} / {labelOf(user.role)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Email" value={user.email || "—"} />
          <Info label="Phone" value={user.phone || "Not added"} />
          <Info label="Status" value={user.isActive === false ? "Inactive" : "Active"} />
        </dl>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-shop-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
