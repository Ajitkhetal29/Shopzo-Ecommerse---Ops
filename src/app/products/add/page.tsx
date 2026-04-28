"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { uploadFilesToS3 } from "@/lib/s3Upload";

type Category = { _id: string; name: string };
type Subcategory = { _id: string; name: string };

const MAX_IMAGES = 10;

const AddProductPage = () => {
  const router = useRouter();

  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    slug: "",
  });

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.GET_CATEGORIES, { withCredentials: true })
      .then((res) => setCategories(res.data.categories ?? []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!formData.category) {
      setSubcategories([]);
      setFormData((prev) => ({ ...prev, subcategory: "" }));
      return;
    }
    axios
      .get(`${API_ENDPOINTS.GET_SUBCATEGORIES}?categoryId=${formData.category}`, { withCredentials: true })
      .then((res) => setSubcategories(res.data.subcategories ?? []))
      .catch(() => setSubcategories([]));
    setFormData((prev) => ({ ...prev, subcategory: "" }));
  }, [formData.category]);

  const slugFromName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateUniqueSlug = (name: string) => {
  const base = slugFromName(name);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${random}`;
};

  // Initial image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    let selected = Array.from(e.target.files);

    if (selected.length > MAX_IMAGES) {
      selected = selected.slice(0, MAX_IMAGES);
      toast.error(`You can upload maximum ${MAX_IMAGES} images`);
    }

    setImages([...images, ...selected]);
  };


  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const imageUrls = await uploadFilesToS3(images, "product", {
        productId: "69a0366fc6c74de7d5fc1ec7",
      });

      const response = await axios.post(
        API_ENDPOINTS.CREATE_PRODUCT,
        {
          name: formData.name,
          description: formData.description,
          categoryId: formData.category,
          subcategoryId: formData.subcategory || undefined,
          slug: formData.slug,
          vendorId: "69a0366fc6c74de7d5fc1ec7",
          imageUrls,
        },
        { withCredentials: true },
      );

      if (response.data.success) {
        toast.success("Product created successfully", { autoClose: 3000 });
        router.push("/products");
      } else {
        toast.error(response.data.message || "Failed to create product");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Add Product</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Create a new product with name, description, category and images
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/90">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/60">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Product Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
               onChange={(e) => {
  const name = e.target.value;
  setFormData((prev) => ({
    ...prev,
    name,
    slug: generateUniqueSlug(name),
  }));
}}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Enter product name"
              />
              
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Product description"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategory
              </label>
              <select
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                disabled={!formData.category}
              >
                <option value="">Select subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images
              </label>
              <label className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 py-4">
                  Click to upload or drag and drop (JPEG, PNG, WebP)
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  Up to {MAX_IMAGES} images
                </span>
              </label>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((img, index) => (
                    <div
                      key={img.name + img.size}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Link
                href="/products"
                className="rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                  isSubmitting
                    ? "cursor-not-allowed bg-slate-400 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                }`}
              >
                {isSubmitting ? "Saving..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductPage;