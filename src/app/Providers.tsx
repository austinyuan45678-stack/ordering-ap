"use client";

import { SessionProvider } from "next-auth/react";
import React, { createContext, useState, useContext, useEffect } from "react";
import { CartProvider } from "@/components/CartContext";

type Language = "en" | "zh" | "vi";
type Currency = "CNY" | "VND";
type PriceMode = "SINGLE" | "DUAL";

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  priceMode: PriceMode;
  setPriceMode: (mode: PriceMode) => void;
  formatPrice: (priceCny: number) => string;
  exchangeRate: number;
  getProductName: (product: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
  getProductDesc: (product: any) => string; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const translations: Record<Language, Record<string, string>> = {
  zh: {
    "nav.store": "越南特产",
    "nav.home": "首页",
    "nav.products": "商品列表",
    "nav.account": "我的账户",
    "nav.admin": "管理后台",
    "nav.login": "登录",
    "nav.logout": "退出",
    "nav.priceMode.DUAL": "双币显示",
    "nav.priceMode.SINGLE": "单币显示",
    "auth.email": "邮箱",
    "auth.account": "邮箱 / 手机号",
    "auth.password": "密码",
    "auth.name": "姓名",
    "auth.login": "登录",
    "auth.register": "注册",
    "auth.noAccount": "没有账号？",
    "auth.hasAccount": "已有账号？",
    "auth.registering": "注册中...",
    "account.title": "我的账户",
    "account.name": "姓名",
    "account.contact": "邮箱 / 手机号",
    "account.role": "角色权限",
    "account.orders": "我的订单记录",
    "account.password": "修改密码",
    "account.stats": "账单统计",
    "admin.users": "用户管理",
    "admin.staff": "员工后台",
    "cart.title": "购物车",
    "cart.empty": "您的购物车是空的",
    "cart.total": "总计",
    "cart.checkout": "去结算",
    "cart.add": "加入购物车",
    "cart.itemAdd": "已加入购物车",
    "cart.quantity": "数量",
    "account.noOrders": "您还没有任何订单记录。",
    "account.orderedAt": "下单时间",
    "account.notSet": "未设置",
    "admin.dashboard": "管理后台仪表盘",
    "admin.products": "商品管理",
    "admin.orders": "订单管理",
    "admin.addProduct": "添加商品",
    "admin.bulkAdd": "批量添加",
    "admin.bulkAddDesc": "每行一个商品，格式：中文名,中文描述,价格({currency}),图片链接,越南语名,越南语描述",
    "admin.addBtn": "确认添加",
    "admin.status": "状态",
    "admin.edit": "编辑",
    "admin.save": "保存",
    "admin.cancel": "取消",
    "admin.unlist": "下架",
    "admin.relist": "上架",
    "admin.delete": "删除",
    "admin.deleteConfirm": "确定要永久删除此用户吗？（注意：此操作将同时删除该用户的所有历史订单！）",
    "admin.roleUpdated": "角色权限已更新！",
    "admin.table.date": "日期",
    "admin.table.customer": "客户信息",
    "admin.table.product": "商品信息",
    "admin.table.contact": "联系方式",
    "admin.addSuccess": "添加成功！",
    "admin.addError": "添加失败，请重试",
    "admin.bulkSuccess": "批量添加成功！",
    "admin.bulkError": "批量添加失败，请检查格式。",
    "admin.updatePriceError": "更新失败",
    "admin.updateAvailError": "更新上架状态失败",
    "admin.updateStatusError": "更新订单状态失败",
    "product.price": "价格",
    "product.order": "立即下单",
    "product.name": "中文名称",
    "product.nameVi": "越南语名称",
    "product.desc": "中文描述",
    "product.descVi": "越南语描述",
    "product.image": "商品图片",
    "product.noImage": "暂无图片",
    "product.orderTitle": "提交订单",
    "product.submitting": "提交中...",
    "product.orderError": "下单失败，请重试",
    "order.address": "收货地址",
    "order.phone": "手机号码",
    "order.submit": "提交订单",
    "order.success": "下单成功！",
    "order.status.PENDING": "待处理",
    "order.status.PROCESSING": "处理中",
    "order.status.COMPLETED": "已完成",
    "order.status.CANCELLED": "已取消",
    "general.loading": "加载中...",
    "general.noData": "暂无数据",
    "general.user": "用户",
  },
  en: {
    "nav.store": "Viet Specialties",
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.account": "My Account",
    "nav.admin": "Admin",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.priceMode.DUAL": "Dual Price",
    "nav.priceMode.SINGLE": "Single Price",
    "auth.email": "Email",
    "auth.account": "Email / Phone",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.registering": "Registering...",
    "account.title": "My Account",
    "account.name": "Name",
    "account.contact": "Email / Phone",
    "account.role": "Role",
    "account.orders": "Your Orders",
    "account.password": "Change Password",
    "account.stats": "Billing Stats",
    "admin.users": "User Management",
    "admin.staff": "Staff Dashboard",
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.add": "Add to Cart",
    "cart.itemAdd": "Added to Cart",
    "cart.quantity": "Quantity",
    "account.noOrders": "You have no orders yet.",
    "account.orderedAt": "Ordered",
    "account.notSet": "N/A",
    "admin.dashboard": "Admin Dashboard",
    "admin.products": "Manage Products",
    "admin.orders": "View Orders",
    "admin.addProduct": "Add Product",
    "admin.bulkAdd": "Bulk Add",
    "admin.bulkAddDesc": "One product per line: NameZH,DescZH,Price({currency}),ImageUrl,NameVI,DescVI",
    "admin.addBtn": "Add",
    "admin.status": "Status",
    "admin.edit": "Edit",
    "admin.save": "Save",
    "admin.cancel": "Cancel",
    "admin.unlist": "Unlist",
    "admin.relist": "Relist",
    "admin.delete": "Delete",
    "admin.deleteConfirm": "Are you sure you want to permanently delete this user and all their orders?",
    "admin.roleUpdated": "Role updated successfully!",
    "admin.table.date": "Date",
    "admin.table.customer": "Customer",
    "admin.table.product": "Product",
    "admin.table.contact": "Contact",
    "admin.addSuccess": "Added successfully!",
    "admin.addError": "Error adding product",
    "admin.bulkSuccess": "Bulk add successful!",
    "admin.bulkError": "Error in bulk add. Please check format.",
    "admin.updatePriceError": "Error updating",
    "admin.updateAvailError": "Error updating availability",
    "admin.updateStatusError": "Failed to update status",
    "product.price": "Price",
    "product.order": "Order Now",
    "product.name": "Name (ZH)",
    "product.nameVi": "Name (VI)",
    "product.desc": "Desc (ZH)",
    "product.descVi": "Desc (VI)",
    "product.image": "Image",
    "product.noImage": "No Image",
    "product.orderTitle": "Order",
    "product.submitting": "Submitting...",
    "product.orderError": "Error placing order",
    "order.address": "Delivery Address",
    "order.phone": "Phone Number",
    "order.submit": "Submit Order",
    "order.success": "Order placed successfully!",
    "order.status.PENDING": "Pending",
    "order.status.PROCESSING": "Processing",
    "order.status.COMPLETED": "Completed",
    "order.status.CANCELLED": "Cancelled",
    "general.loading": "Loading...",
    "general.noData": "No data available",
    "general.user": "User",
  },
  vi: {
    "nav.store": "Đặc sản Việt Nam",
    "nav.home": "Trang chủ",
    "nav.products": "Sản phẩm",
    "nav.account": "Tài khoản",
    "nav.admin": "Quản trị",
    "nav.login": "Đăng nhập",
    "nav.logout": "Đăng xuất",
    "nav.priceMode.DUAL": "Giá kép",
    "nav.priceMode.SINGLE": "Giá đơn",
    "auth.email": "Email",
    "auth.account": "Email / Số điện thoại",
    "auth.password": "Mật khẩu",
    "auth.name": "Tên",
    "auth.login": "Đăng nhập",
    "auth.register": "Đăng ký",
    "auth.noAccount": "Chưa có tài khoản?",
    "auth.hasAccount": "Đã có tài khoản?",
    "auth.registering": "Đang đăng ký...",
    "account.title": "Tài khoản của tôi",
    "account.name": "Tên",
    "account.contact": "Email / SĐT",
    "account.role": "Vai trò",
    "account.orders": "Lịch sử đơn hàng",
    "account.noOrders": "Bạn chưa có đơn hàng nào.",
    "account.orderedAt": "Ngày đặt",
    "account.notSet": "Chưa thiết lập",
    "account.password": "Đổi mật khẩu",
    "account.stats": "Thống kê",
    "admin.dashboard": "Bảng điều khiển",
    "admin.users": "Quản lý người dùng",
    "admin.staff": "Trang nhân viên",
    "admin.products": "Quản lý sản phẩm",
    "admin.orders": "Quản lý đơn hàng",
    "admin.addProduct": "Thêm sản phẩm",
    "admin.bulkAdd": "Thêm hàng loạt",
    "admin.bulkAddDesc": "Mỗi dòng 1 sp: Tên(Trung),Mô tả(Trung),Giá({currency}),LinkẢnh,Tên(Việt),Mô tả(Việt)",
    "admin.addBtn": "Thêm",
    "admin.status": "Trạng thái",
    "admin.edit": "Sửa",
    "admin.save": "Lưu",
    "admin.cancel": "Hủy",
    "admin.unlist": "Gỡ xuống",
    "admin.relist": "Đăng lên",
    "admin.delete": "Xóa",
    "admin.deleteConfirm": "Bạn có chắc chắn muốn xóa người dùng này và toàn bộ lịch sử đơn hàng của họ không?",
    "admin.roleUpdated": "Vai trò đã được cập nhật thành công!",
    "admin.table.date": "Ngày",
    "admin.table.customer": "Khách hàng",
    "admin.table.product": "Sản phẩm",
    "admin.table.contact": "Liên hệ",
    "admin.addSuccess": "Thêm thành công!",
    "admin.addError": "Lỗi khi thêm sản phẩm",
    "admin.bulkSuccess": "Thêm hàng loạt thành công!",
    "admin.bulkError": "Lỗi thêm hàng loạt. Vui lòng kiểm tra định dạng.",
    "admin.updatePriceError": "Lỗi cập nhật",
    "admin.updateAvailError": "Lỗi cập nhật trạng thái",
    "admin.updateStatusError": "Lỗi cập nhật trạng thái đơn hàng",
    "product.price": "Giá",
    "product.order": "Đặt hàng",
    "product.name": "Tên (Trung)",
    "product.nameVi": "Tên (Việt)",
    "product.desc": "Mô tả (Trung)",
    "product.descVi": "Mô tả (Việt)",
    "product.image": "Ảnh",
    "product.noImage": "Không có ảnh",
    "product.orderTitle": "Đặt hàng",
    "product.submitting": "Đang gửi...",
    "product.orderError": "Lỗi đặt hàng",
    "order.address": "Địa chỉ giao hàng",
    "order.phone": "Số điện thoại",
    "order.submit": "Gửi đơn hàng",
    "order.success": "Đặt hàng thành công!",
    "order.status.PENDING": "Đang chờ",
    "order.status.PROCESSING": "Đang xử lý",
    "order.status.COMPLETED": "Hoàn thành",
    "order.status.CANCELLED": "Đã hủy",
    "general.loading": "Đang tải...",
    "general.noData": "Không có dữ liệu",
    "general.user": "Người dùng",
    "cart.title": "Giỏ hàng",
    "cart.empty": "Giỏ hàng trống",
    "cart.total": "Tổng cộng",
    "cart.checkout": "Thanh toán",
    "cart.add": "Thêm vào giỏ",
    "cart.itemAdd": "Đã thêm",
    "cart.quantity": "Số lượng",
  }
};

const EXCHANGE_RATE = 3500; // 1 CNY = 3500 VND

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within Providers");
  return context;
}

// Map old useI18n to useApp to minimize refactoring in some files if needed,
// but we will update them to use useApp.
export const useI18n = useApp;

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("zh");
  const [currency, setCurrency] = useState<Currency>("CNY");
  const [priceMode, setPriceMode] = useState<PriceMode>("DUAL");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedLang = localStorage.getItem("lang") as Language;
    if (savedLang === "en" || savedLang === "zh") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(savedLang);
    }
    const savedCurr = localStorage.getItem("currency") as Currency;
    if (savedCurr === "CNY" || savedCurr === "VND") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrency(savedCurr);
    }
    const savedMode = localStorage.getItem("priceMode") as PriceMode;
    if (savedMode === "SINGLE" || savedMode === "DUAL") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriceMode(savedMode);
    }
  }, []);

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const changeCurrency = (newCurr: Currency) => {
    setCurrency(newCurr);
    localStorage.setItem("currency", newCurr);
  };

  const changePriceMode = (newMode: PriceMode) => {
    setPriceMode(newMode);
    localStorage.setItem("priceMode", newMode);
  };

  const t = (key: string) => translations[lang]?.[key] || key;

  const getProductName = (product: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (lang === "vi" && product.nameVi) return product.nameVi;
    return product.name;
  };

  const getProductDesc = (product: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (lang === "vi" && product.descriptionVi) return product.descriptionVi;
    return product.description || "";
  };

  const formatPrice = (priceCny: number) => {
    const priceVnd = priceCny * EXCHANGE_RATE;
    const strCny = `¥${priceCny.toFixed(2)}`;
    const strVnd = `₫${priceVnd.toLocaleString()}`;

    if (priceMode === "SINGLE") {
      return currency === "CNY" ? strCny : strVnd;
    } else {
      return currency === "CNY" ? `${strCny} / ${strVnd}` : `${strVnd} / ${strCny}`;
    }
  };

  return (
    <SessionProvider>
      <AppContext.Provider value={{ lang, setLang: changeLang, t, currency, setCurrency: changeCurrency, priceMode, setPriceMode: changePriceMode, formatPrice, exchangeRate: EXCHANGE_RATE, getProductName, getProductDesc }}>
        <CartProvider>
          {children}
        </CartProvider>
      </AppContext.Provider>
    </SessionProvider>
  );
}
