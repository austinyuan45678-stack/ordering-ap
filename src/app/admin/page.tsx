"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";
import Image from "next/image";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, formatPrice, currency, exchangeRate } = useApp();

  const [products, setProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [activeTab, setActiveTab] = useState<"products" | "bulkAdd" | "orders" | "users" | "stats">("products");

  // Product form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Bulk add form
  const [bulkText, setBulkText] = useState("");

  // Edit product
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");

  const prevOrderCountRef = useRef(0);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/");
    }
  }, [session, status, router]);

  const fetchData = async () => {
    if (activeTab === "products" || activeTab === "bulkAdd") {
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      setProducts(data);
    } else if (activeTab === "orders" || activeTab === "stats") {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data);
    } else if (activeTab === "users") {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      setUsers(data);
    }
  };

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchData();
    }
  }, [activeTab, session]);

  // Voice Notification Polling
  useEffect(() => {
    if (session?.user.role !== "ADMIN") return;
    
    // Initial fetch to get baseline order count
    fetch("/api/orders").then(res => res.json()).then(data => {
      prevOrderCountRef.current = data.length;
    });

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        
        if (data.length > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
          // Play voice notification
          if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance("您有新的订单，请注意查收");
            msg.lang = 'zh-CN';
            window.speechSynthesis.speak(msg);
          }
          if (activeTab === "orders") {
            setOrders(data);
          }
        }
        prevOrderCountRef.current = data.length;
      } catch (err) {
        console.error(err);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [session, activeTab]);


  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const finalPrice = currency === "VND" ? parseFloat(price) / exchangeRate : parseFloat(price);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: finalPrice,
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to add product");

      setName("");
      setDescription("");
      setPrice("");
      setFile(null);
      fetchData();
      alert(t("admin.addSuccess"));
    } catch (error) {
      alert(t("admin.addError"));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    setLoading(true);

    try {
      const lines = bulkText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const parsedProducts = lines.map(line => {
        const [pName, pDesc, pPrice, pImg] = line.split(",");
        const parsedPrice = parseFloat(pPrice?.trim() || "0");
        const finalPrice = currency === "VND" ? parsedPrice / exchangeRate : parsedPrice;
        return {
          name: pName?.trim(),
          description: pDesc?.trim() || "",
          price: finalPrice,
          imageUrl: pImg?.trim() || "",
        };
      });

      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedProducts),
      });

      if (!res.ok) throw new Error("Bulk add failed");
      
      setBulkText("");
      fetchData();
      alert(t("admin.bulkSuccess"));
      setActiveTab("products");
    } catch (error) {
      alert(t("admin.bulkError"));
    } finally {
      setLoading(false);
    }
  };

  const updateProductPriceAndName = async (productId: string) => {
    try {
      const parsedPrice = parseFloat(editPriceValue);
      const finalPrice = currency === "VND" ? parsedPrice / exchangeRate : parsedPrice;
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: finalPrice, name: editNameValue }),
      });
      if (!res.ok) throw new Error("Failed to update price");
      
      setEditingProductId(null);
      fetchData();
    } catch (error) {
      alert(t("admin.updatePriceError"));
    }
  };

  const toggleProductAvailability = async (productId: string, currentAvailability: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentAvailability }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
      
      fetchData();
    } catch (error) {
      alert(t("admin.updateAvailError"));
    }
  };

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

  const adminChangePassword = async (userId: string) => {
    const newPassword = prompt("请输入该用户的新密码 (至少6位):");
    if (!newPassword || newPassword.length < 6) return alert("密码太短");

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        alert("密码修改成功！");
      } else {
        alert("修改失败");
      }
    } catch (error) {
      alert("Error");
    }
  };

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return <div className="text-center py-20">{t("general.loading")}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
        <div className="flex space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3 py-2 rounded-md font-medium transition ${
              activeTab === "products" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("admin.products")}
          </button>
          <button
            onClick={() => setActiveTab("bulkAdd")}
            className={`px-3 py-2 rounded-md font-medium transition ${
              activeTab === "bulkAdd" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("admin.bulkAdd")}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-2 rounded-md font-medium transition ${
              activeTab === "orders" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("admin.orders")}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-2 rounded-md font-medium transition ${
              activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("admin.users")}
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-2 rounded-md font-medium transition ${
              activeTab === "stats" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {t("account.stats")}
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-sm border h-fit">
            <h2 className="text-xl font-bold mb-4">{t("admin.addProduct")}</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.name")}</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.desc")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.price")} ({currency})</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.image")}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t("general.loading") : t("admin.addBtn")}
              </button>
            </form>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4 flex gap-4">
                  {product.imageUrl ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                      {t("product.noImage")}
                    </div>
                  )}
                  <div className="flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start w-full">
                        {editingProductId === product.id ? (
                            <input
                              type="text"
                              value={editNameValue}
                              onChange={(e) => setEditNameValue(e.target.value)}
                              className="px-2 py-1 border rounded text-sm w-full mr-2"
                              placeholder={t("product.name")}
                            />
                        ) : (
                          <h3 className="font-bold pr-2">{product.name}</h3>
                        )}
                        {!product.isAvailable && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">
                            {t("admin.unlist")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {editingProductId === product.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editPriceValue}
                            onChange={(e) => setEditPriceValue(e.target.value)}
                            className="w-20 px-1 py-0.5 border rounded text-sm"
                          />
                            <button onClick={() => updateProductPriceAndName(product.id)} className="text-green-600 hover:text-green-700 text-sm font-medium">{t("admin.save")}</button>
                          <button onClick={() => setEditingProductId(null)} className="text-gray-500 hover:text-gray-700 text-sm">{t("admin.cancel")}</button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                          <p className="font-semibold text-blue-600">{formatPrice(product.price)}</p>
                          <div className="flex space-x-3 mt-2 sm:mt-0">
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setEditNameValue(product.name);
                                const displayPrice = currency === "VND" ? (product.price * exchangeRate) : product.price;
                                setEditPriceValue(displayPrice.toString());
                              }}
                              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                            >
                              {t("admin.edit")}
                            </button>
                            <button
                              onClick={() => toggleProductAvailability(product.id, product.isAvailable)}
                              className={`${product.isAvailable ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"} text-sm font-medium`}
                            >
                              {product.isAvailable ? t("admin.unlist") : t("admin.relist")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-2 text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed">
                  {t("general.noData")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-6">{t("account.stats")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-600 font-semibold mb-1">总订单数 (Total Orders)</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-sm text-green-600 font-semibold mb-1">总收入 (Total Revenue)</p>
              <p className="text-3xl font-bold">{formatPrice(orders.filter(o => o.status === "COMPLETED").reduce((sum, o) => sum + o.totalAmount, 0))}</p>
              <p className="text-xs text-green-700 mt-1">*仅计算已完成的订单</p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
              <p className="text-sm text-yellow-600 font-semibold mb-1">待处理 (Pending)</p>
              <p className="text-3xl font-bold">{orders.filter(o => o.status === "PENDING").length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "bulkAdd" && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4">{t("admin.bulkAdd")}</h2>
          <p className="text-sm text-gray-600 mb-4">{t("admin.bulkAddDesc").replace("{currency}", currency)}</p>
          <form onSubmit={handleBulkAdd} className="space-y-4">
            <textarea
              required
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono"
              rows={10}
              placeholder={`越南咖啡,正宗G7黑咖啡,${currency === "VND" ? "89000" : "25.5"},https://example.com/img1.jpg\n综合果蔬干,越南进口零食,${currency === "VND" ? "63000" : "18.0"},`}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t("general.loading") : t("admin.addBtn")}
            </button>
          </form>
        </div>
      )}

      {activeTab === "orders" && (
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
      )}
    </div>
  );
}
