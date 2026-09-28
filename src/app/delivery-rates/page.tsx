"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { opsCard, opsInput, opsPrimaryBtn, opsSubtitle, opsTitle } from "@/lib/ops-ui";

type Rule = {
  vehicleType: string;
  ratePerKm: number | string;
  minFare: number | string;
  minBillableKm: number | string;
};

const LABELS: Record<string, string> = {
  bike: "Bike",
  car: "Car",
  truck: "Truck",
  other: "Other",
};

export default function DeliveryRatesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_DELIVERY_PAYOUT_RULES, {
        withCredentials: true,
      });
      if (res.data.success) setRules(res.data.rules || []);
    } catch {
      toast.error("Failed to load payout rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (vehicleType: string, field: keyof Rule, value: string) => {
    setRules((prev) =>
      prev.map((row) =>
        row.vehicleType === vehicleType ? { ...row, [field]: value } : row
      )
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        rules: rules.map((row) => ({
          vehicleType: row.vehicleType,
          ratePerKm: Number(row.ratePerKm),
          minFare: Number(row.minFare),
          minBillableKm: Number(row.minBillableKm),
        })),
      };
      const res = await axios.put(API_ENDPOINTS.UPDATE_DELIVERY_PAYOUT_RULES, payload, {
        withCredentials: true,
      });
      if (res.data.success) {
        setRules(res.data.rules || []);
        toast.success("Rates saved");
      } else toast.error(res.data.message || "Save failed");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error.response?.data?.message || "Save failed" : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={opsTitle}>Delivery rates</h1>
        <p className={opsSubtitle}>
          Payout = max(min fare, ₹/km × max(trip km, min billable km)). One row per vehicle.
        </p>
      </div>

      <div className={`${opsCard} overflow-x-auto p-5`}>
        {loading ? (
          <p className="text-sm text-shop-muted">Loading…</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-shop-border text-shop-muted">
                <th className="py-2 pr-3 font-medium">Vehicle</th>
                <th className="py-2 pr-3 font-medium">₹ / km</th>
                <th className="py-2 pr-3 font-medium">Min billable km</th>
                <th className="py-2 font-medium">Min fare ₹</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((row) => (
                <tr key={row.vehicleType} className="border-b border-shop-border/60">
                  <td className="py-3 pr-3 font-medium">{LABELS[row.vehicleType] || row.vehicleType}</td>
                  <td className="py-3 pr-3">
                    <input
                      className={opsInput}
                      type="number"
                      min={0}
                      step="0.5"
                      value={row.ratePerKm}
                      onChange={(e) => setField(row.vehicleType, "ratePerKm", e.target.value)}
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      className={opsInput}
                      type="number"
                      min={0}
                      step="0.5"
                      value={row.minBillableKm}
                      onChange={(e) => setField(row.vehicleType, "minBillableKm", e.target.value)}
                    />
                  </td>
                  <td className="py-3">
                    <input
                      className={opsInput}
                      type="number"
                      min={0}
                      step="1"
                      value={row.minFare}
                      onChange={(e) => setField(row.vehicleType, "minFare", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-5">
          <button type="button" className={opsPrimaryBtn} disabled={saving || loading} onClick={save}>
            {saving ? "Saving…" : "Save rates"}
          </button>
        </div>
      </div>
    </div>
  );
}
