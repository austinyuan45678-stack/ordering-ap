"use client";

import { useCart } from "@/components/CartContext";
import { useApp } from "@/app/Providers";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { t, formatPrice, getProductName, getProductUnit } = useApp();
  const { data: session } = useSession();
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState<{phone: string, address: string} | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/users/profile", { cache: "no-store" })
        .then(res => res.json())
        .then(data => {
          if (data.phone || data.address) {
            setSavedProfile({ phone: data.phone || "", address: data.address || "" });
            // Auto-fill initially if empty
            if (!phone && data.phone) setPhone(data.phone);
            if (!address && data.address) setAddress(data.address);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login");
      return;
    }

    if (items.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price
          })),
          address,
          phone,
          totalAmount: totalPrice
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to order");
      }

      clearCart();
      router.push("/account");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(`${t("product.orderError")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <ShoppingCartIcon className="h-16 w-16 mb-4 text-gray-300" />
        <h2 className="text-2xl font-semibold mb-4">{t("cart.empty")}</h2>
        <button onClick={() => router.push("/products")} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
          {t("nav.products")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{t("cart.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
              {item.product.imageUrl ? (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover rounded-md" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                  {t("product.noImage")}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-lg">{getProductName(item.product)}</h3>
                <p className="text-gray-500">{formatPrice(item.product.price)} / {getProductUnit(item.product)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2 hover:bg-gray-100">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-center w-12">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2 hover:bg-gray-100">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="p-2 text-red-500 hover:bg-red-50 hover:rounded-full">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border h-fit">
          <h2 className="text-xl font-bold mb-6">{t("cart.checkout")}</h2>
          <div className="flex justify-between mb-6 font-semibold text-lg border-b pb-4">
            <span>{t("cart.total")}</span>
            <span className="text-blue-600">{formatPrice(totalPrice)}</span>
          </div>

          {savedProfile && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setPhone(savedProfile.phone);
                  setAddress(savedProfile.address);
                }} 
                className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
              >
                {t("cart.useSaved")}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setPhone("");
                  setAddress("");
                }} 
                className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
              >
                {t("cart.manualEntry")}
              </button>
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.address")}</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("order.phone")}</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? t("product.submitting") : t("order.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ShoppingCartIcon(props: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
