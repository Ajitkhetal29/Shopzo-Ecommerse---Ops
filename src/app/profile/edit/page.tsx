"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { opsCard, opsInput, opsPageHeader, opsPrimaryBtn, opsSecondaryBtn, opsSubtitle, opsTitle } from "@/lib/ops-ui";
import type { AppDispatch, RootState } from "@/store";
import { setUser } from "@/store/slices/authSlice";

export default function EditOpsProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (!mounted || !res.data?.success || !res.data.user) return;
        const next = res.data.user;
        dispatch(setUser(next));
        setName(next.name || "");
        setEmail(next.email || "");
        setPhone(next.phone || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.put(
        API_ENDPOINTS.UPDATE_PROFILE,
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        },
        { withCredentials: true },
      );
      if (res.data?.success && res.data.user) {
        dispatch(setUser(res.data.user));
        toast.success("Profile updated");
        router.push("/profile");
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 pb-10">
      <div className={opsPageHeader}>
        <div>
          <h1 className={opsTitle}>Edit profile</h1>
          <p className={opsSubtitle}>Update your name, email, and phone. Role and department stay with Super Admin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`${opsCard} max-w-xl space-y-5 p-6 sm:p-7`}>
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Phone" value={phone} onChange={setPhone} required={false} maxLength={10} />

        <div className="flex justify-end gap-3 border-t border-shop-border pt-6">
          <Link href="/profile" className={opsSecondaryBtn}>
            Cancel
          </Link>
          <button type="submit" disabled={isSubmitting} className={opsPrimaryBtn}>
            {isSubmitting ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        className={`h-11 w-full ${opsInput}`}
      />
    </div>
  );
}
