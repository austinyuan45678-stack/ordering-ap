"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";

export default function StaffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, formatPrice } = useApp();

  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const prevOrderCountRef = useRef(0);

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

  // Voice Notification Polling
  useEffect(() => {
    if (session?.user.role !== "STAFF" && session?.user.role !== "ADMIN") return;
    
    fetch("/api/orders").then(res => res.json()).then(data => {
      prevOrderCountRef.current = data.length;
    });

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        
        if (data.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
          if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance("您有新的订单，请注意查收");
            msg.lang = 'zh-CN';
            window.speechSynthesis.speak(msg);
          }
          setOrders(data);
        }
        prevOrderCountRef.current = data.length;
      } catch (err) {
        console.error(err);
      }
    }, 10000);

    return () => clearInterval(interval);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.product")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("admin.table.contact")}</th>
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
                  <div className="text-sm text-gray-500">{order.user.email || order.user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <ul className="list-disc pl-4">
                    {order.items.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <li key={item.id} className="text-sm text-gray-900 whitespace-normal">
                        {item.product.name} (x{item.quantity})
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm font-bold mt-1 text-blue-600">{t("cart.total")}: {formatPrice(order.totalAmount)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{order.phone}</div>
                  <div className="text-sm text-gray-500 max-w-xs break-words" title={order.address}>{order.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 p-1"
                  >
                    <option value="PENDING">{t("order.status.PENDING")}</option>
                    <option value="PROCESSING">{t("order.status.PROCESSING")}</option>
                    <option value="COMPLETED">{t("order.status.COMPLETED")}</option>
                    <option value="CANCELLED">{t("order.status.CANCELLED")}</option>
                  </select>
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
