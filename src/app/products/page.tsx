"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setProducts } from "@/store/slices/productSlice";
import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/store/types/product";

const LIMIT = 20;

type CategoryOption = { _id: string; name: string };
type SubcategoryOption = { _id: string; name: string };

const ProductPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const vendors = useSelector((state: RootState) => state.vendor.vendors);
  const products = useSelector((state: RootState) => state.product.products);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: LIMIT,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(API_ENDPOINTS.GET_PRODUCTS, {
        withCredentials: true,
        params: {
          page: pagination.page,
          limit: pagination.limit,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          vendorId: vendorId || undefined,
        }
      });
      if (response.data.success) {
        dispatch(setProducts(response.data.products));
        setTotalCount(response.data.totalCount ?? 0);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products. Please try again.");
      toast.error("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const url = categoryId
      ? `${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${categoryId}`
      : API_ENDPOINTS.GET_SUBCATEGORIES;
    axios
      .get(url, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) setSubcategoryId("");
  }, [categoryId]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, categoryId, subcategoryId, vendorId]);

  const totalPages = Math.ceil(totalCount / pagination.limit) || 1;
  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < totalPages;
  const startCount = totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endCount = Math.min(pagination.page * pagination.limit, totalCount);



  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-base font-medium text-slate-600 dark:text-slate-400">Loading products...</div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Products</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage products — click a product to view details
            </p>
          </div>
          <Link
            href="/products/add"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => {
              setSubcategoryId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            disabled={!categoryId}
          >
            <option value="">All subcategories</option>
            {subcategories.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All vendors</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
          {(categoryId || subcategoryId || vendorId) && (
            <button
              type="button"
              onClick={() => {
                setCategoryId("");
                setSubcategoryId("");
                setVendorId("");
                setPagination({ ...pagination, page: 1 });
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8 4-8-4m0 0l8-4 8 4m0 0l-8 4m8-4v12M4 7v12"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No products</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {categoryId || subcategoryId || vendorId ? "Try changing filters." : "Get started by creating a product."}
            </p>
            {!categoryId && !subcategoryId && !vendorId && (
              <div className="mt-6">
                <Link
                  href="/products/add"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Add Product
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product) => (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => router.push(`/products/${product._id}`)}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition-all hover:border-amber-500/35 hover:shadow-md dark:border-slate-700/70 dark:bg-slate-900/90"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">No image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-slate-900 transition group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-200">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {product.category.name}
                      {product.subcategory ? ` · ${product.subcategory.name}` : ""} · {product.vendor.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Showing {startCount} to {endCount} of {totalCount} {totalCount === 1 ? "product" : "products"}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={!hasPrev || loading}
                    onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      !hasPrev || loading
                        ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: 5 }, (_, i) => {
                    const pageNum = pagination.page - 2 + i;
                    if (pageNum <= 0 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                          pagination.page === pageNum
                            ? "bg-amber-600 text-white"
                            : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={!hasNext || loading}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                      !hasNext || loading
                        ? "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                        : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    Next
                  </button>

                  <select
                    value={pagination.limit}
                    onChange={(e) =>
                      setPagination((prev) => ({
                        ...prev,
                        limit: parseInt(e.target.value, 10),
                        page: 1,
                      }))
                    }
                    className="ml-1 h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default ProductPage;
