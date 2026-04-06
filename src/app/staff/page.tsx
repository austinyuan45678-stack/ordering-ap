"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";
import Image from "next/image";

export default function StaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, formatPrice, getProductName } = useApp();

  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (status === "loading") return;
    if (!session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchData = async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => {
    if (session?.user.role === "STAFF" || session?.user.role === "ADMIN") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData();
    }
  }, [session]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      } else {
        alert(t("admin.updateStatusError"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || !session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return <div className="text-center py-20">{t("general.loading")}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("admin.staff")}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.date")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.customer")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.account")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.contact")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.address")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.product")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.status")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.user.name || t("general.user")}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{order.user.email || order.user.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-blue-600">{order.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs break-words">{order.address}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2 min-w-[200px]">
                    {order.items.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <div key={item.id} className="flex items-center gap-2">
                        {item.product.imageUrl ? (
                          <Image src={item.product.imageUrl} alt="product" width={40} height={40} className="object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500 flex-shrink-0">No Img</div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 font-medium leading-tight">
                            {getProductName(item.product)} <span className="font-bold text-blue-600">(x{item.quantity})</span>
                          </span>
                          <span className="text-[10px] text-gray-400">ID: {item.productId.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                    <div className="text-sm font-bold mt-2 pt-2 border-t text-blue-600">{t("cart.total")}: {formatPrice(order.totalAmount)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.status.startsWith('CANCELLED') ? (
                    <span className="px-2 py-1 text-xs rounded-full whitespace-nowrap font-bold bg-red-100 text-red-800">
                      {t(`order.status.${order.status}`)}
                    </span>
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 p-1"
                    >
                      <option value="PENDING">{t("order.status.PENDING")}</option>
                      <option value="PROCESSING">{t("order.status.PROCESSING")}</option>
                      <option value="COMPLETED">{t("order.status.COMPLETED")}</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  {t("general.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
