"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/Providers";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const router = useRouter();
  const { t, formatPrice, getProductName } = useApp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [supportPhone, setSupportPhone] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetch("/api/orders", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => setOrders(data));
      
      const phone = localStorage.getItem("support_phone");
      if (phone) setSupportPhone(phone);
    }
  }, [session]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setPassLoading(true);

    try {
      const res = await fetch(`/api/users/${session.user.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (res.ok) {
        alert(t("admin.addSuccess") || "Success");
        setOldPassword("");
        setNewPassword("");
      } else {
        const text = await res.text();
        alert(text);
      }
    } catch (err) {
      alert("网络错误，请稍后再试 / Lỗi mạng, vui lòng thử lại sau");
    } finally {
      setPassLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: "CANCELLED" } : o));
      } else {
        alert("Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{t("account.title")}</h1>
          {supportPhone && (
            <a href={`tel:${supportPhone}`} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-md text-sm font-medium flex items-center hover:bg-green-100 transition">
              <span className="mr-1">📞</span> {t("account.contactUs")}
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-600">
              <strong>{t("account.name")}:</strong> {session.user.name || t("account.notSet")}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>{t("account.contact")}:</strong> {session.user.email || session.user.phone || t("account.notSet")}
            </p>
            <p className="text-gray-600 mt-2">
              <strong>{t("account.role")}:</strong> {session.user.role}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">{t("account.password")}</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                placeholder={t("account.oldPassword") || "旧密码 / Mật khẩu cũ"}
                required
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <input
                type="password"
                placeholder={t("account.newPassword") || "新密码 / Mật khẩu mới"}
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <button disabled={passLoading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 w-full disabled:opacity-50">
                {passLoading ? t("general.loading") : t("admin.save")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">{t("account.orders")}</h2>
        {orders.length === 0 ? (
          <p className="text-gray-500">{t("account.noOrders")}</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="space-y-2 mb-3">
                    {order.items.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-bold">{getProductName(item.product)} (x{item.quantity})</span>
                        <span className="text-gray-600">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm font-semibold text-gray-800">{t("cart.total")}: {formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("account.orderedAt")}: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="sm:text-right w-full sm:w-auto flex flex-col justify-between items-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                    order.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    order.status === "COMPLETED" ? "bg-green-100 text-green-800" :
                    order.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {t(`order.status.${order.status}`)}
                  </span>
                  
                  {order.status === "PENDING" && (
                    <button 
                      onClick={() => handleCancelOrder(order.id)}
                      className="mt-3 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-md font-medium transition"
                    >
                      {t("account.cancelOrder")}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
