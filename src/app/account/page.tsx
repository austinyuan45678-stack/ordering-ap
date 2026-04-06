"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useApp } from "@/app/Providers";
import { useRouter } from "next/navigation";
import Image from "next/image";

function OrderCard({ order, t, formatPrice, getProductName, onCancel, onUpdate, allProducts }: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editAddress, setEditAddress] = useState(order.address);
  const [editPhone, setEditPhone] = useState(order.phone);
  const [editItems, setEditItems] = useState(order.items.map((i: any) => ({ ...i }))); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    
    // Optimistic UI update
    const totalAmount = editItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0); // eslint-disable-line @typescript-eslint/no-explicit-any
    const tempUpdatedOrder = {
      ...order,
      address: editAddress,
      phone: editPhone,
      items: editItems,
      totalAmount
    };
    
    // Call parent handler without blocking the local UI flip
    onUpdate(order.id, editAddress, editPhone, editItems, tempUpdatedOrder);
    
    setIsEditing(false);
    setIsUpdating(false);
  };

  const handleCancelEdit = () => {
    setEditAddress(order.address);
    setEditPhone(order.phone);
    setEditItems(order.items.map((i: any) => ({ ...i }))); // eslint-disable-line @typescript-eslint/no-explicit-any
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:shadow-md">
      <div className="flex-1 w-full">
        {isEditing ? (
          <div className="space-y-3 mb-4 bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <span className="bg-yellow-400 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">🛒</span>
              修改购物车 (Edit Cart)
            </h3>
            {editItems.map((eItem: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={idx} className="flex justify-between items-center text-sm gap-2 bg-white p-2 rounded shadow-sm border border-yellow-100">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {eItem.product?.imageUrl ? (
                    <Image src={eItem.product.imageUrl} alt="img" width={40} height={40} className="object-cover rounded border flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500 flex-shrink-0">No Img</div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate w-24 sm:w-40 font-bold leading-tight text-gray-800">{getProductName(eItem.product)}</span>
                    <span className="text-xs text-blue-600 font-semibold">{formatPrice(eItem.price)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-full border px-1 py-1 flex-shrink-0">
                  <button onClick={() => {
                    const newItems = [...editItems];
                    if (newItems[idx].quantity > 1) {
                      newItems[idx].quantity -= 1;
                      setEditItems(newItems);
                    } else {
                      newItems.splice(idx, 1);
                      setEditItems(newItems);
                    }
                  }} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-700 font-bold transition-transform active:scale-95">-</button>
                  <span className="w-6 text-center font-bold text-gray-800">{eItem.quantity}</span>
                  <button onClick={() => {
                    const newItems = [...editItems];
                    newItems[idx].quantity += 1;
                    setEditItems(newItems);
                  }} className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-700 font-bold transition-transform active:scale-95">+</button>
                </div>
              </div>
            ))}
            <div className="pt-2 relative">
              <button 
                className="w-full text-sm p-2.5 border border-yellow-300 rounded-lg bg-white shadow-sm font-medium text-gray-700 flex justify-between items-center"
                onClick={() => setShowAddMenu(!showAddMenu)}
              >
                <span>+ 添加其他商品 (Add Item)</span>
                <span>▼</span>
              </button>
              {showAddMenu && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-60 overflow-y-auto">
                  {allProducts.length === 0 && <div className="p-4 text-center text-gray-500">Loading products...</div>}
                  {allProducts.map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                    <div 
                      key={p.id} 
                      className={`flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${p.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (p.stock <= 0) return;
                        const existingIdx = editItems.findIndex((i: any) => i.productId === p.id); // eslint-disable-line @typescript-eslint/no-explicit-any
                        if (existingIdx >= 0) {
                          const newItems = [...editItems];
                          newItems[existingIdx].quantity += 1;
                          setEditItems(newItems);
                        } else {
                          setEditItems([...editItems, { productId: p.id, quantity: 1, price: p.price, product: p }]);
                        }
                        setShowAddMenu(false);
                      }}
                    >
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="img" width={40} height={40} className="object-cover rounded border flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500 flex-shrink-0">No Img</div>
                      )}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate text-sm font-bold text-gray-800">{getProductName(p)}</span>
                        <span className="text-xs text-blue-600 font-semibold">{formatPrice(p.price)}</span>
                      </div>
                      {p.stock <= 0 && <span className="text-xs text-red-500 font-bold px-2">Sold Out</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {order.items.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={item.id} className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                {item.product?.imageUrl ? (
                  <Image src={item.product.imageUrl} alt="product" width={56} height={56} className="object-cover rounded-md border shadow-sm flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">No Img</div>
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-bold text-base text-gray-900 leading-tight truncate">{getProductName(item.product)}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-500 text-sm font-medium bg-gray-200/60 px-2 py-0.5 rounded-full">x{item.quantity}</span>
                    <span className="text-blue-600 text-base font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="border-t border-gray-100 pt-3 mt-2 space-y-3">
          {isEditing ? (
            <p className="text-base font-bold text-gray-900 bg-yellow-100/50 p-2 rounded-lg text-right shadow-inner border border-yellow-200">
              {t("cart.total")}: <span className="text-xl text-yellow-700 ml-1">{formatPrice(editItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0))}</span> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          ) : (
            <p className="text-base font-bold text-gray-900 text-right">
              {t("cart.total")}: <span className="text-xl text-blue-600 ml-1">{formatPrice(order.totalAmount)}</span>
            </p>
          )}
          <p className="text-xs text-gray-400 text-right">{t("account.orderedAt")}: {new Date(order.createdAt).toLocaleString()}</p>
          
          {isEditing ? (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg mt-3 border border-blue-100">
              <h4 className="text-sm font-bold text-blue-800">联系信息 (Contact Info)</h4>
              <div>
                <input 
                  type="tel" 
                  value={editPhone} 
                  onChange={e => setEditPhone(e.target.value)} 
                  className="w-full text-sm px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white shadow-sm" 
                  placeholder={t("order.phone")}
                />
              </div>
              <div>
                <textarea 
                  value={editAddress} 
                  onChange={e => setEditAddress(e.target.value)} 
                  className="w-full text-sm px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white shadow-sm resize-none" 
                  rows={2} 
                  placeholder={t("order.address")}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={editItems.length === 0 || isUpdating} className="flex-1 bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:shadow-none active:scale-[0.98]">
                  {isUpdating ? "保存中..." : "保存更改 / Save"}
                </button>
                <button onClick={handleCancelEdit} className="flex-1 bg-white text-gray-700 border border-gray-300 text-sm font-bold py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors active:scale-[0.98]">
                  取消 / Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/80 p-3 rounded-lg text-sm text-gray-700 border border-gray-100 space-y-1">
              <p className="flex items-start gap-2"><span className="font-semibold text-gray-500 flex-shrink-0 w-16">{t("order.phone")}:</span> <span className="font-bold text-gray-900">{order.phone}</span></p>
              <p className="flex items-start gap-2"><span className="font-semibold text-gray-500 flex-shrink-0 w-16">{t("order.address")}:</span> <span className="text-gray-800 break-words">{order.address}</span></p>
            </div>
          )}
        </div>
      </div>
      
      <div className="sm:text-right w-full sm:w-auto flex flex-col justify-start items-end sm:pl-4 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0">
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center justify-center shadow-sm uppercase tracking-wide w-full sm:w-auto ${
          order.status === "PENDING" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" :
          order.status === "COMPLETED" ? "bg-green-100 text-green-800 border border-green-200" :
          order.status.startsWith("CANCELLED") ? "bg-red-100 text-red-800 border border-red-200" :
          "bg-blue-100 text-blue-800 border border-blue-200"
        }`}>
          {t(order.status.startsWith("CANCELLED") ? "order.status.CANCELLED" : `order.status.${order.status}`)}
        </span>
        
        {order.status === "PENDING" && !isEditing && (
          <div className="flex sm:flex-col gap-2 mt-4 w-full">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:w-full text-xs text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-lg font-bold hover:bg-blue-100 transition-colors shadow-sm active:scale-[0.98]"
            >
              编辑信息 / Edit Info
            </button>
            <button 
              onClick={() => onCancel(order.id)}
              disabled={isUpdating}
              className="flex-1 sm:w-full text-xs text-red-600 bg-white border border-red-200 px-4 py-2.5 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {isUpdating ? "..." : t("account.cancelOrder")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [defaultPhone, setDefaultPhone] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");
  const router = useRouter();
  const { t, formatPrice, getProductName } = useApp();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [allProducts, setAllProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      Promise.all([
        fetch("/api/orders", { cache: "no-store" }).then(res => res.json()),
        fetch("/api/products", { cache: "no-store" }).then(res => res.json()),
        fetch("/api/users/profile", { cache: "no-store" }).then(res => res.json())
      ]).then(([ordersData, productsData, profileData]) => {
        setOrders(ordersData);
        setAllProducts(productsData);
        if (profileData) {
          setDefaultPhone(profileData.phone || "");
          setDefaultAddress(profileData.address || "");
        }
        setIsInitialLoading(false);
      });
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

  const handleProfileChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    setProfileLoading(true);

    try {
      const res = await fetch(`/api/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: defaultPhone, address: defaultAddress }),
      });

      if (res.ok) {
        alert(t("admin.addSuccess") || "Success");
      } else {
        const text = await res.text();
        alert(text);
      }
    } catch (err) {
      alert("网络错误，请稍后再试 / Lỗi mạng, vui lòng thử lại sau");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      } else {
        const text = await res.text();
        alert(text || "Failed to cancel order");
        // Revert optimistic or stale UI
        fetch("/api/orders", { cache: "no-store" })
          .then((res) => res.json())
          .then((data) => setOrders(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateOrder = async (orderId: string, address: string, phone: string, items: any[], optimisticOrder?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (optimisticOrder) {
      setOrders(orders.map(o => o.id === orderId ? optimisticOrder : o));
    }
    
    setIsUpdating(true);
    try {
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address, 
          phone,
          items,
          totalAmount 
        }),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      } else {
        const text = await res.text();
        alert(text || "Failed to update order");
        // Revert optimistic or stale UI
        fetch("/api/orders", { cache: "no-store" })
          .then((res) => res.json())
          .then((data) => setOrders(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <h3 className="font-semibold mb-2">{t("account.profile") || "个人信息管理"}</h3>
            <form onSubmit={handleProfileChange} className="space-y-3">
              <input
                type="tel"
                placeholder={t("account.defaultPhone") || "默认收件电话"}
                value={defaultPhone}
                onChange={e => setDefaultPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
              <textarea
                placeholder={t("account.defaultAddress") || "默认配送地址"}
                value={defaultAddress}
                onChange={e => setDefaultAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={2}
              />
              <button disabled={profileLoading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 w-full disabled:opacity-50">
                {profileLoading ? t("general.loading") : t("account.saveProfile") || "保存信息"}
              </button>
            </form>
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
        {isInitialLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">{t("account.noOrders")}</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                t={t} 
                formatPrice={formatPrice} 
                getProductName={getProductName} 
                onCancel={handleCancelOrder} 
                onUpdate={handleUpdateOrder} 
                allProducts={allProducts} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
