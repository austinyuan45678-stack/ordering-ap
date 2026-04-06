"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";
import Image from "next/image";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, formatPrice, currency, exchangeRate, getProductName, getProductUnit } = useApp();

  const [products, setProducts] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [activeTab, setActiveTab] = useState<"products" | "bulkAdd" | "orders" | "users" | "stats">("products");

  // Product form
  const [name, setName] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionVi, setDescriptionVi] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("个/Cái");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Bulk add form
  const [bulkText, setBulkText] = useState("");

  // Edit product
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");
  const [editNameViValue, setEditNameViValue] = useState("");
  const [editDescValue, setEditDescValue] = useState("");
  const [editDescViValue, setEditDescViValue] = useState("");
  const [editStockValue, setEditStockValue] = useState("");
  const [editUnitValue, setEditUnitValue] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrderAddress, setEditOrderAddress] = useState("");
  const [editOrderPhone, setEditOrderPhone] = useState("");
  const [editOrderItems, setEditOrderItems] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const adminUpdateOrderDetails = async (orderId: string) => {
    try {
      const totalAmount = editOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: editOrderAddress,
          phone: editOrderPhone,
          items: editOrderItems,
          totalAmount
        })
      });
      if (res.ok) {
        setEditingOrderId(null);
        fetchData();
        alert(t("admin.addSuccess") || "Updated successfully");
      } else {
        alert("Failed to update order");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session?.user.role === "ADMIN") {
      fetchData();
      fetch("/api/settings").then(res => res.json()).then(data => {
        if (data.support_phone) setSupportPhone(data.support_phone);
      });
    }
  }, [activeTab, session]);

  const handleSaveSupportPhone = async () => {
    try {
      let qrcodeUrl = "";
      if (supportQrcodeFile) {
        const formData = new FormData();
        formData.append("file", supportQrcodeFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          qrcodeUrl = uploadData.url;
        }
      }

      const body: Record<string, string> = { support_phone: supportPhone };
      if (qrcodeUrl) {
        body.support_qrcode = qrcodeUrl;
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        alert(t("admin.addSuccess"));
        setSupportQrcodeFile(null);
      } else {
        alert("Failed to save");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Upload failed: ${errText}`);
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const finalPrice = currency === "VND" ? parseFloat(price) / exchangeRate : parseFloat(price);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nameVi,
          description,
          descriptionVi,
          price: finalPrice,
          stock: stock ? parseInt(stock) : 999,
          unit,
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to add product");

      setName("");
      setNameVi("");
      setDescription("");
      setDescriptionVi("");
      setPrice("");
      setStock("");
      setUnit("个/Cái");
      setFile(null);
      fetchData();
      alert(t("admin.addSuccess"));
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(`${t("admin.addError")}: ${error.message || "Unknown error"}`);
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
        const [pName, pDesc, pPrice, pImg, pNameVi, pDescVi] = line.split(",");
        const parsedPrice = parseFloat(pPrice?.trim() || "0");
        const finalPrice = currency === "VND" ? parsedPrice / exchangeRate : parsedPrice;
        return {
          name: pName?.trim(),
          nameVi: pNameVi?.trim() || "",
          description: pDesc?.trim() || "",
          descriptionVi: pDescVi?.trim() || "",
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
      setLoading(true);
      let imageUrl;

      if (editFile) {
        const formData = new FormData();
        formData.append("file", editFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Upload failed: ${errText}`);
        }
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const parsedPrice = parseFloat(editPriceValue);
      const parsedStock = parseInt(editStockValue) || 0;
      const finalPrice = currency === "VND" ? parsedPrice / exchangeRate : parsedPrice;
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          price: finalPrice, 
          name: editNameValue, 
          nameVi: editNameViValue, 
          description: editDescValue,
          descriptionVi: editDescViValue,
          stock: parsedStock,
          unit: editUnitValue,
          ...(imageUrl && { imageUrl }) 
        }),
      });
      if (!res.ok) throw new Error("Failed to update product");
      
      setEditingProductId(null);
      setEditFile(null);
      fetchData();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(`${t("admin.updatePriceError")}: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
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
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(t("admin.updateAvailError"));
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm(t("admin.deleteProductConfirm"))) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchData();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(error.message);
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

  const adminUpdateOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          address: editOrderAddress,
          phone: editOrderPhone 
        })
      });
      if (res.ok) {
        setEditingOrderId(null);
        fetchData();
        alert(t("admin.addSuccess") || "Updated successfully");
      } else {
        alert("Failed to update order");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const adminDeleteOrder = async (orderId: string) => {
    if (!confirm(t("admin.deleteOrderConfirm"))) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Delete failed");
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      alert(error.message);
    }
  };

  const adminChangePassword = async (userId: string) => {
    const newPassword = prompt(t("admin.promptNewPass") || "请输入该用户的新密码 (至少6位):");
    if (!newPassword || newPassword.length < 6) return alert(t("admin.passTooShort") || "密码太短");

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        alert(t("admin.passSuccess") || "密码修改成功！");
      } else {
        const errText = await res.text();
        alert(errText || "修改失败");
      }
    } catch (error) {
      alert("网络错误，请稍后再试 / Lỗi mạng");
    }
  };

  const adminChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        alert(t("admin.roleUpdated"));
        fetchData();
      } else {
        const errText = await res.text();
        alert(errText || "Error changing role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const adminDeleteUser = async (userId: string) => {
    if (!confirm(t("admin.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        const errText = await res.text();
        alert(errText || "Error deleting user");
      }
    } catch (err) {
      console.error(err);
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
            onClick={() => { setActiveTab("orders"); setFilterStatus(null); }}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.nameVi")}</label>
                <input
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Tên tiếng Việt"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.desc")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.descVi")}</label>
                <textarea
                  value={descriptionVi}
                  onChange={(e) => setDescriptionVi(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="Mô tả tiếng Việt"
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
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.stock")}</label>
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("product.unit")}</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="个/Cái">个/Cái</option>
                    <option value="袋/Túi">袋/Túi</option>
                    <option value="盒/Hộp">盒/Hộp</option>
                    <option value="瓶/Chai">瓶/Chai</option>
                    <option value="罐/Lon">罐/Lon</option>
                    <option value="包/Gói">包/Gói</option>
                  </select>
                </div>
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
                <div key={product.id} className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col sm:flex-row gap-4 ${!product.isAvailable ? 'opacity-70 bg-gray-50' : ''}`}>
                  {product.imageUrl ? (
                    <div className="relative w-full sm:w-24 h-32 sm:h-24 flex-shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover rounded-md"
                      />
                      {editingProductId === product.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                          <label className="text-white text-xs cursor-pointer px-2 py-1 bg-gray-800 rounded">
                            换图
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full sm:w-24 h-32 sm:h-24 bg-gray-200 rounded-md flex flex-col items-center justify-center text-xs text-gray-500 flex-shrink-0 relative">
                      {t("product.noImage")}
                      {editingProductId === product.id && (
                        <label className="text-white text-xs cursor-pointer px-2 py-1 bg-gray-800 rounded mt-2 absolute">
                          加图
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => setEditFile(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  )}
                    <div className="flex flex-col justify-between w-full">
                    <div>
                      <div className="flex flex-col justify-between items-start w-full mb-2">
                        {editingProductId === product.id ? (
                          <div className="flex flex-col space-y-3 w-full bg-blue-50/50 p-4 rounded-lg border border-blue-200 mt-2 shadow-sm relative z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.name")}</label>
                                <input type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" placeholder={t("product.name")} />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.nameVi")}</label>
                                <input type="text" value={editNameViValue} onChange={(e) => setEditNameViValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" placeholder={t("product.nameVi")} />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.desc")}</label>
                                <textarea value={editDescValue} onChange={(e) => setEditDescValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" placeholder={t("product.desc")} rows={2} />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.descVi")}</label>
                                <textarea value={editDescViValue} onChange={(e) => setEditDescViValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" placeholder={t("product.descVi")} rows={2} />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.price")} ({currency})</label>
                                <input type="number" step="0.01" value={editPriceValue} onChange={(e) => setEditPriceValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.stock")}</label>
                                <input type="number" value={editStockValue} onChange={(e) => setEditStockValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">{t("product.unit")}</label>
                                <select value={editUnitValue} onChange={(e) => setEditUnitValue(e.target.value)} className="px-2 py-1.5 border rounded text-sm w-full bg-white">
                                  <option value="个/Cái">个/Cái</option>
                                  <option value="袋/Túi">袋/Túi</option>
                                  <option value="盒/Hộp">盒/Hộp</option>
                                  <option value="瓶/Chai">瓶/Chai</option>
                                  <option value="罐/Lon">罐/Lon</option>
                                  <option value="包/Gói">包/Gói</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex space-x-3 pt-2 justify-end">
                              <button onClick={() => { setEditingProductId(null); setEditFile(null); }} className="text-gray-700 bg-white border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 text-sm font-medium">{t("admin.cancel")}</button>
                              <button onClick={() => updateProductPriceAndName(product.id)} disabled={loading} className="text-white bg-blue-600 px-4 py-1.5 rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50">{loading ? t("general.loading") : t("admin.save")}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between w-full items-start">
                              <h3 className="font-bold text-lg pr-2 leading-tight">
                                {product.name} 
                                {product.nameVi && <span className="text-sm font-normal text-gray-500 block">{product.nameVi}</span>}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap font-bold h-fit ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.isAvailable ? t("admin.statusOn") : t("admin.statusOff")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                            {product.descriptionVi && <p className="text-sm text-gray-500 line-clamp-2">{product.descriptionVi}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t pt-3">
                      {editingProductId === product.id ? null : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2 sm:mb-0">
                            <p className="font-semibold text-blue-600 text-lg">{formatPrice(product.price)}</p>
                            <p className="text-sm text-gray-500">{t("product.stock")}: <span className="font-bold">{product.stock}</span> {getProductUnit(product)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-end">
                            <button
                              onClick={() => {
                                setEditingProductId(product.id);
                                setEditNameValue(product.name);
                                setEditNameViValue(product.nameVi || "");
                                setEditDescValue(product.description || "");
                                setEditDescViValue(product.descriptionVi || "");
                                setEditStockValue(product.stock.toString());
                                setEditUnitValue(product.unit || "个/Cái");
                                const displayPrice = currency === "VND" ? (product.price * exchangeRate) : product.price;
                                setEditPriceValue(displayPrice.toString());
                              }}
                              className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 text-sm font-medium"
                            >
                              {t("admin.edit")}
                            </button>
                            <button
                              onClick={() => toggleProductAvailability(product.id, product.isAvailable)}
                              className={`${product.isAvailable ? "text-orange-600 bg-orange-50 hover:bg-orange-100" : "text-green-600 bg-green-50 hover:bg-green-100"} px-3 py-1.5 rounded text-sm font-medium`}
                            >
                              {product.isAvailable ? t("admin.unlist") : t("admin.relist")}
                            </button>
                            {!product.isAvailable && (
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded text-sm font-medium"
                              >
                                {t("admin.deleteProduct")}
                              </button>
                            )}
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6">{t("admin.contactInfo")}</h2>
            <div className="flex gap-4 max-w-lg items-end">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">联系电话 / WhatsApp</label>
                  <input 
                    type="tel" 
                    value={supportPhone} 
                    onChange={e => setSupportPhone(e.target.value)} 
                    placeholder="Ex: 18529510460"
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">客服微信二维码 (QR Code)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setSupportQrcodeFile(e.target.files?.[0] || null)} 
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  {supportQrcodeFile && <p className="text-xs text-green-600 mt-1">已选择新二维码，点击保存上传</p>}
                </div>
              </div>
              <button onClick={handleSaveSupportPhone} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 h-10 mb-[2px]">
                {t("admin.save")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">此号码将显示在普通用户的账号页面，方便他们联系客服。</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6">{t("account.stats")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className="p-4 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus(null); }}
              >
                <p className="text-sm text-blue-600 font-semibold mb-1">总订单数 (Total Orders)</p>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
              <div 
                className="p-4 bg-green-50 border border-green-100 rounded-lg cursor-pointer hover:bg-green-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus("COMPLETED"); }}
              >
                <p className="text-sm text-green-600 font-semibold mb-1">总收入 ({currency})</p>
                <p className="text-3xl font-bold">{formatPrice(orders.filter(o => o.status === "COMPLETED").reduce((sum, o) => sum + o.totalAmount, 0))}</p>
                <p className="text-xs text-green-700 mt-1">*仅计算已完成的订单</p>
              </div>
              <div 
                className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg cursor-pointer hover:bg-yellow-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus("PENDING"); }}
              >
                <p className="text-sm text-yellow-600 font-semibold mb-1">待处理订单 (Pending)</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === "PENDING").length}</p>
              </div>
              <div 
                className="p-4 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus("PROCESSING"); }}
              >
                <p className="text-sm text-blue-600 font-semibold mb-1">处理中订单 (Processing)</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === "PROCESSING").length}</p>
              </div>
              <div 
                className="p-4 bg-purple-50 border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus("COMPLETED"); }}
              >
                <p className="text-sm text-purple-600 font-semibold mb-1">已完成订单 (Completed)</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status === "COMPLETED").length}</p>
              </div>
              <div 
                className="p-4 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition shadow-sm"
                onClick={() => { setActiveTab("orders"); setFilterStatus("CANCELLED"); }}
              >
                <p className="text-sm text-red-600 font-semibold mb-1">已取消订单 (Cancelled)</p>
                <p className="text-3xl font-bold">{orders.filter(o => o.status.startsWith("CANCELLED")).length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">身份/名字</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式 (Email/Phone)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单总数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{u.name || t("general.user")}</div>
                    <select
                      value={u.role}
                      onChange={(e) => adminChangeRole(u.id, e.target.value)}
                      className="text-xs border-gray-300 rounded shadow-sm bg-gray-50 mt-1 py-1"
                    >
                      <option value="USER">USER (普通用户)</option>
                      <option value="VIP">VIP (贵宾)</option>
                      <option value="STAFF">STAFF (员工)</option>
                      <option value="ADMIN">ADMIN (管理员)</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {u.email || u.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                    {u._count?.orders || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-3">
                    <button 
                      onClick={() => adminChangePassword(u.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t("account.password")}
                    </button>
                    {session.user.id !== u.id && (
                      <button 
                        onClick={() => adminDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        {t("admin.delete")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
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
        <div className="space-y-4">
          {filterStatus && (
            <div className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
              <span className="text-sm text-gray-700 font-medium">
                Current Filter: <span className="text-blue-600 font-bold">{filterStatus}</span>
              </span>
              <button 
                onClick={() => setFilterStatus(null)} 
                className="text-xs text-gray-500 hover:text-gray-800 bg-white px-2 py-1 rounded border shadow-sm"
              >
                Clear Filter
              </button>
            </div>
          )}
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
              {filteredOrders.map((order) => (
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
                    {editingOrderId === order.id ? (
                      <input 
                        type="text" 
                        value={editOrderPhone} 
                        onChange={e => setEditOrderPhone(e.target.value)} 
                        className="px-2 py-1 border rounded w-full text-sm font-bold text-blue-600" 
                      />
                    ) : (
                      <div className="text-sm font-bold text-blue-600">{order.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingOrderId === order.id ? (
                      <textarea 
                        value={editOrderAddress} 
                        onChange={e => setEditOrderAddress(e.target.value)} 
                        className="px-2 py-1 border rounded w-full text-sm" 
                        rows={2} 
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs break-words">{order.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingOrderId === order.id ? (
                      <div className="space-y-2 w-64">
                        {editOrderItems.map((eItem: any, idx: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                          <div key={idx} className="flex justify-between items-center text-sm gap-2 bg-yellow-50 p-1 rounded border border-yellow-100">
                            <span className="truncate w-32 font-bold" title={eItem.product ? getProductName(eItem.product) : "商品"}>
                              {eItem.product ? getProductName(eItem.product) : "商品"}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => {
                                const newItems = [...editOrderItems];
                                if (newItems[idx].quantity > 1) {
                                  newItems[idx].quantity -= 1;
                                  setEditOrderItems(newItems);
                                } else {
                                  newItems.splice(idx, 1);
                                  setEditOrderItems(newItems);
                                }
                              }} className="bg-gray-200 px-2 rounded hover:bg-gray-300">-</button>
                              <span className="w-6 text-center text-xs">{eItem.quantity}</span>
                              <button onClick={() => {
                                const newItems = [...editOrderItems];
                                newItems[idx].quantity += 1;
                                setEditOrderItems(newItems);
                              }} className="bg-gray-200 px-2 rounded hover:bg-gray-300">+</button>
                            </div>
                          </div>
                        ))}
                        <select 
                          className="w-full text-xs p-1 border rounded"
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const prod = products.find((p: any) => p.id === e.target.value); // eslint-disable-line @typescript-eslint/no-explicit-any
                            if (prod) {
                              const existingIdx = editOrderItems.findIndex((i: any) => i.productId === prod.id); // eslint-disable-line @typescript-eslint/no-explicit-any
                              if (existingIdx >= 0) {
                                const newItems = [...editOrderItems];
                                newItems[existingIdx].quantity += 1;
                                setEditOrderItems(newItems);
                              } else {
                                setEditOrderItems([...editOrderItems, { productId: prod.id, quantity: 1, price: prod.price, product: prod }]);
                              }
                            }
                            e.target.value = "";
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>+ 添加商品 (Add Item)</option>
                          {products.map((p: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                            <option key={p.id} value={p.id}>{getProductName(p)}</option>
                          ))}
                        </select>
                        <div className="text-sm font-bold mt-1 text-blue-600">{t("cart.total")}: {formatPrice(editOrderItems.reduce((acc, item) => acc + item.price * item.quantity, 0))}</div>
                      </div>
                    ) : (
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
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2 items-start">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-1 ${order.status.startsWith('CANCELLED') ? 'bg-red-50 text-red-700' : 'bg-gray-50'}`}
                      >
                        <option value="PENDING">{t("order.status.PENDING")}</option>
                        <option value="PROCESSING">{t("order.status.PROCESSING")}</option>
                        <option value="COMPLETED">{t("order.status.COMPLETED")}</option>
                        <option value="CANCELLED_BY_ADMIN">{t("order.status.CANCELLED_BY_ADMIN")}</option>
                        {order.status === "CANCELLED_BY_USER" && <option value="CANCELLED_BY_USER" disabled>{t("order.status.CANCELLED_BY_USER")}</option>}
                      </select>
                      
                      <div className="flex gap-2 mt-2 w-full">
                        {editingOrderId === order.id ? (
                          <>
                            <button onClick={() => adminUpdateOrderDetails(order.id)} className="text-xs text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded flex-1">
                              {t("admin.save")}
                            </button>
                            <button onClick={() => setEditingOrderId(null)} className="text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded flex-1">
                              {t("admin.cancel")}
                            </button>
                          </>
                        ) : (
                          <button onClick={() => {
                            setEditingOrderId(order.id);
                            setEditOrderAddress(order.address);
                            setEditOrderPhone(order.phone);
                          }} className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded flex-1">
                            {t("admin.edit")}
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={() => adminDeleteOrder(order.id)} 
                        className="text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
                      >
                        {t("admin.deleteOrder")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    {t("general.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
