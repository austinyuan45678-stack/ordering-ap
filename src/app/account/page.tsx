"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/Providers";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const router = useRouter();
  const { t, formatPrice } = useApp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/orders", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => setOrders(data));
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold mb-4">{t("account.title")}</h1>
        <p className="text-gray-600">
          <strong>{t("account.name")}:</strong> {session.user.name || t("account.notSet")}
        </p>
        <p className="text-gray-600">
          <strong>{t("account.contact")}:</strong> {session.user.email || session.user.phone || t("account.notSet")}
        </p>
        <p className="text-gray-600">
          <strong>{t("account.role")}:</strong> {session.user.role}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">{t("account.orders")}</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">{t("account.noOrders")}</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{order.product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{t("product.price")}: {formatPrice(order.product.price)}</p>
                  <p className="text-sm text-gray-600">{t("account.orderedAt")}: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {t(`order.status.${order.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
