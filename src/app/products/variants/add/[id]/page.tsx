"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { Product } from "@/store/types/product";
import { toast } from "react-toastify";
import { uploadFilesToS3 } from "@/lib/s3Upload";

const MAX_IMAGES = 5;

const AddVariantPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);

  const [variant, setVariant] = useState({
    size: "",
    color: "",
    price: "",
    sku: "",
  });

  const [skuSeed] = useState(() => Math.floor(1000 + Math.random() * 9000));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_ENDPOINTS.GET_PRODUCT_BY_ID}/${id}`, {
          withCredentials: true,
        });

        if (!res.data.success) throw new Error();
        setProduct(res.data.product);
      } catch {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;

    const base = product.name.replace(/\s+/g, "-").toUpperCase();
    const color = variant.color || "X";
    const size = variant.size || "X";

    setVariant((prev) => ({
      ...prev,
      sku: `${base}-${color.toUpperCase()}-${size.toUpperCase()}-${skuSeed}`,
    }));
  }, [variant.color, variant.size, product, skuSeed]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVariant({ ...variant, [e.target.name]: e.target.value });
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    const total = [...images, ...files].slice(0, MAX_IMAGES);

    setImages(total);

    const previews = total.map((file) => URL.createObjectURL(file));
    setPreview(previews);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = preview.filter((_, i) => i !== index);

    setImages(newImages);
    setPreview(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const imageUrls = await uploadFilesToS3(images, "variant", {
        productId: id,
        sku: variant.sku,
      });

      const res = await axios.post(
        API_ENDPOINTS.CREATE_VARIANT,
        {
          productId: id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          sku: variant.sku,
          imageUrls,
        },
        { withCredentials: true },
      );

      if (!res.data.success) throw new Error(res.data.message || "Failed to create variant");

      toast.success("Variant created successfully", { autoClose: 3000 });
      router.push(`/products/${id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "An error occurred",
      );
    }
  };

  if (loading) {
    return (
      <div className="py-10">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }
  if (error && !product) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Link href="/products" className="mb-4 inline-block text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          ← Products
        </Link>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  if (!product) return <p className="p-6">Product not found</p>;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href={`/products/${id}`}
        className="text-sm text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        ← {product.name}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Add variant · {product.name}</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90"
      >
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">SKU</label>
          <input
            value={variant.sku}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Size</label>
          <select
            name="size"
            value={variant.size}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Color</label>
          <input
            name="color"
            value={variant.color}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="e.g. Red"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Price</label>
          <input
            type="number"
            name="price"
            value={variant.price}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-900 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Images</label>

          {images.length < MAX_IMAGES && (
            <input
              type="file"
              multiple
              onChange={handleImages}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {images.length === 0
              ? "Upload up to 5 images"
              : `${images.length} / ${MAX_IMAGES} images selected`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {preview.map((src, index) => (
            <div key={index} className="w-24 relative">
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-black text-white text-xs px-1 z-10 rounded"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Preview" className="w-full h-auto rounded" />
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          disabled={!variant.size || !variant.color || !variant.price}
        >
          Create Variant
        </button>
      </form>
    </div>
  );
};

export default AddVariantPage;
