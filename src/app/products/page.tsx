"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";
import { useCart } from "@/components/CartContext";
import Image from "next/image";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const { data: session } = useSession();
  const router = useRouter();
  const { t, formatPrice, getProductName, getProductDesc } = useApp();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchProducts = () => {
    fetch("/api/products", { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  useEffect(() => {
    fetchProducts();
  }, [lang]); // Re-fetch or re-render when language changes if needed

  const handleAddToCart = (product: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!session) {
      router.push("/login");
      return;
    }
    addToCart(product, 1);
    setAddingId(product.id);
    setTimeout(() => setAddingId(null), 1000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("nav.products")}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4 flex flex-col">
            {product.imageUrl ? (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500">
                {t("product.noImage")}
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2">{getProductName(product)}</h3>
            <p className="text-gray-600 text-sm mb-4 flex-1">{getProductDesc(product)}</p>
            <div className="flex items-center justify-between mt-auto flex-wrap gap-2">
              <span className="font-bold text-lg">{formatPrice(product.price)}</span>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={addingId === product.id}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-green-500 whitespace-nowrap flex-1 sm:flex-none text-center"
              >
                {addingId === product.id ? t("cart.itemAdd") : t("cart.add")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
