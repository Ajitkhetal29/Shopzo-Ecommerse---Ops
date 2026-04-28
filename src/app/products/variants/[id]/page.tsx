"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { ProductVariant } from "@/store/types/product";
import { toast } from "react-toastify";

export default function ProductVariantsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [productName, setProductName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const prodRes = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${productId}`, {
        withCredentials: true,
      });
      if (!prodRes.data?.success || !prodRes.data?.product) {
        setError("Product not found");
        setVariants([]);
        return;
      }
      setProductName(prodRes.data.product.name ?? "");

      const vRes = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_VARIANTS}/${productId}`, {
        withCredentials: true,
      });
      if (vRes.data?.success) {
        setVariants(vRes.data.variants ?? []);
      } else {
        setError(vRes.data?.message ?? "Failed to load variants");
      }
    } catch {
      setError("Failed to load variants");
      toast.error("Failed to load variants");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteVariant = async (variantId: string) => {
    try {
      const res = await axios.delete(`${API_ENDPOINTS.DELETE_VARIANT}/${variantId}`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        toast.success("Variant deleted");
        load();
      } else {
        toast.error(res.data?.message ?? "Delete failed");
      }
    } catch {
      toast.error("Failed to delete variant");
    }
  };

  if (loading) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/products"
            className="mb-4 inline-block text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to products
          </Link>
          <div className="rounded-xl border border-red-200/80 bg-red-50/90 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href={`/products/${productId}`}
              className="mb-2 inline-flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              ← {productName || "Product"}
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Variants</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/products/variants/add/${productId}`)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Add variant
          </button>
        </div>

        {variants.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
            <p className="mb-4 text-slate-600 dark:text-slate-400">No variants yet.</p>
            <button
              type="button"
              onClick={() => router.push(`/products/variants/add/${productId}`)}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Add variant
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {variants.map((v) => (
              <li
                key={v._id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:flex-row sm:items-start"
              >
                <div className="flex gap-2 flex-wrap">
                  {(v.images ?? []).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${v._id}-${i}`}
                      src={img.url}
                      alt=""
                      className="h-20 w-20 rounded-lg bg-slate-100 object-cover dark:bg-slate-800"
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-sm">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {v.size} · {v.color} · ${v.price}
                  </p>
                  <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">SKU: {v.sku}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/products/variants/edit/${v._id}`)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVariantToDelete(v._id);
                      setDeleteOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setDeleteOpen(false);
            setVariantToDelete(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete variant?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
                onClick={() => {
                  setDeleteOpen(false);
                  setVariantToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (variantToDelete) deleteVariant(variantToDelete);
                  setDeleteOpen(false);
                  setVariantToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
