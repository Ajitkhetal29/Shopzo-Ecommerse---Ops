"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/lib/api";
import { opsCard, opsInput, opsPageHeader, opsPrimaryBtn, opsSubtitle, opsTitle } from "@/lib/ops-ui";

type QtyTotals = {
  quantity: number;
  available: number;
  reserved: number;
  missingHold: number;
  damagedQty: number;
  extraHold: number;
};

type StockLocation = QtyTotals & {
  inventoryId: string;
  locationType: "warehouse" | "vendor";
  locationId: string | null;
  locationName: string;
  isActive: boolean;
};

type StockVariant = {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  locationCount: number;
  totals: QtyTotals;
  locations: StockLocation[];
};

type StockProduct = {
  productId: string;
  name: string;
  slug: string;
  status?: string;
  catalogVendor?: string | null;
  totals: QtyTotals;
  variants: StockVariant[];
};

const typeBadge = (type: string) =>
  type === "warehouse"
    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300";

function InventoryStockInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const variantId = searchParams.get("variantId") || "";
  const qParam = searchParams.get("q") || "";

  const [query, setQuery] = useState(qParam);
  const [hubFilter, setHubFilter] = useState<"all" | "warehouse" | "vendor">("all");
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchStock = useCallback(async () => {
    const params: Record<string, string> = {};
    if (variantId) params.variantId = variantId;
    else if (productId) params.productId = productId;
    else if (qParam.trim()) params.q = qParam.trim();
    else {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(API_ENDPOINTS.GET_STOCK_MAP, {
        withCredentials: true,
        params,
      });
      if (res.data?.success) {
        setProducts(res.data.products ?? []);
      } else {
        setProducts([]);
        toast.error(res.data?.message ?? "Failed to load stock");
      }
    } catch (err: unknown) {
      setProducts([]);
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : "Failed to load stock",
      );
    } finally {
      setLoading(false);
    }
  }, [productId, variantId, qParam]);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    router.push(next.toString() ? `/inventory?${next.toString()}` : "/inventory");
  };

  const visibleProducts = useMemo(() => {
    if (hubFilter === "all") return products;
    return products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        locations: variant.locations.filter((loc) => loc.locationType === hubFilter),
      })),
    }));
  }, [products, hubFilter]);

  return (
    <div className="space-y-6">
      <div className={opsPageHeader}>
        <div>
          <h1 className={opsTitle}>Inventory</h1>
          <p className={opsSubtitle}>
            See which warehouse or vendor holds how much of each product variant
          </p>
        </div>
      </div>

      <form onSubmit={onSearch} className={`${opsCard} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product name, slug, or SKU"
            className={`${opsInput} w-full sm:max-w-md`}
          />
          <button type="submit" className={opsPrimaryBtn}>
            Search
          </button>
          {(productId || variantId || qParam) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.push("/inventory");
              }}
              className="text-sm font-medium text-shop-muted hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "warehouse", "vendor"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setHubFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                hubFilter === key
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "border border-shop-border text-shop-muted hover:text-foreground"
              }`}
            >
              {key === "all" ? "All hubs" : key}
            </button>
          ))}
        </div>
      </form>

      {loading && <p className="text-sm text-shop-muted">Loading stock...</p>}

      {!loading && !searched && (
        <div className={`${opsCard} p-10 text-center`}>
          <p className="text-sm text-shop-muted">
            Search a product, or open stock from a product page.
          </p>
        </div>
      )}

      {!loading && searched && visibleProducts.length === 0 && (
        <div className={`${opsCard} p-10 text-center`}>
          <p className="text-sm text-shop-muted">No matching products or stock rows.</p>
        </div>
      )}

      {!loading &&
        visibleProducts.map((product) => (
          <section key={product.productId} className={`${opsCard} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-shop-border p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link
                  href={`/products/${product.productId}`}
                  className="text-lg font-semibold text-foreground hover:text-shop-accent"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-shop-muted">
                  /{product.slug}
                  {product.catalogVendor ? ` · catalog vendor: ${product.catalogVendor}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-right text-xs sm:text-sm">
                <div>
                  <p className="text-shop-muted">On hand</p>
                  <p className="font-semibold text-foreground">{product.totals.quantity}</p>
                </div>
                <div>
                  <p className="text-shop-muted">Available</p>
                  <p className="font-semibold text-foreground">{product.totals.available}</p>
                </div>
                <div>
                  <p className="text-shop-muted">Reserved</p>
                  <p className="font-semibold text-foreground">{product.totals.reserved}</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-shop-border">
              {product.variants.map((variant) => (
                <div key={variant.variantId} className="p-5">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {variant.size || "—"} · {variant.color || "—"}
                      </p>
                      <p className="font-mono text-xs text-shop-muted">{variant.sku}</p>
                    </div>
                    <p className="text-xs text-shop-muted">
                      ATP {variant.totals.available} across {variant.locationCount} location
                      {variant.locationCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  {variant.locations.length === 0 ? (
                    <p className="text-sm text-shop-muted">
                      This variant is in the catalog, but no warehouse or vendor has stock yet.
                      Add inventory in the warehouse/vendor panel, or seed it with
                      {" "}
                      <code className="font-mono text-xs">--slug {product.slug}</code>.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-shop-muted">
                            <th className="pb-2 pr-4 font-medium">Location</th>
                            <th className="pb-2 pr-4 font-medium">Type</th>
                            <th className="pb-2 pr-4 font-medium">On hand</th>
                            <th className="pb-2 pr-4 font-medium">Available</th>
                            <th className="pb-2 pr-4 font-medium">Reserved</th>
                            <th className="pb-2 pr-4 font-medium">Damaged</th>
                            <th className="pb-2 font-medium">Missing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variant.locations.map((loc) => (
                            <tr key={loc.inventoryId} className="border-t border-shop-border/70">
                              <td className="py-2 pr-4 font-medium text-foreground">
                                {loc.locationName}
                                {!loc.isActive && (
                                  <span className="ml-2 text-xs font-normal text-rose-500">inactive</span>
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${typeBadge(loc.locationType)}`}>
                                  {loc.locationType}
                                </span>
                              </td>
                              <td className="py-2 pr-4">{loc.quantity}</td>
                              <td className="py-2 pr-4">{loc.available}</td>
                              <td className="py-2 pr-4">{loc.reserved}</td>
                              <td className="py-2 pr-4">{loc.damagedQty}</td>
                              <td className="py-2">{loc.missingHold}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-shop-muted">Loading inventory...</p>}>
      <InventoryStockInner />
    </Suspense>
  );
}
