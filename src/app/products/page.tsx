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
  const { t, formatPrice, getProductName, getProductDesc, getProductUnit, lang } = useApp();
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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
    setTimeout(() => setAddingId(null), 300);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t("nav.products")}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4 flex flex-col">
            {product.imageUrl ? (
              <div 
                className="relative w-full h-48 mb-4 cursor-pointer group"
                onClick={() => setZoomedImage(product.imageUrl)}
              >
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md transition-transform group-hover:opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors rounded-md">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm drop-shadow-md">🔍</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-500">
                {t("product.noImage")}
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2">{getProductName(product)}</h3>
            <p className="text-gray-600 text-sm mb-4 flex-1">{getProductDesc(product)}</p>
            <div className="flex items-center justify-between mt-auto flex-wrap gap-2 pt-2 border-t border-gray-100">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-blue-600">{formatPrice(product.price)} <span className="text-sm text-gray-500 font-normal">/ {getProductUnit(product)}</span></span>
                <span className="text-xs text-gray-500 font-medium">
                  {product.stock > 0 ? `${t("product.stock")}: ${product.stock}` : t("product.outOfStock")}
                </span>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 whitespace-nowrap flex-1 sm:flex-none text-center font-medium shadow-sm active:scale-95"
              >
                {product.stock <= 0 ? t("product.outOfStock") : (addingId === product.id ? t("cart.itemAdd") : t("cart.add"))}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 sm:p-10 cursor-zoom-out backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 text-white bg-white/20 hover:bg-white/40 rounded-full p-2"
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
          >
            ✕
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[80vh]">
            <Image
              src={zoomedImage}
              alt="Enlarged product image"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
