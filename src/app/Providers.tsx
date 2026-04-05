"use client";

import { SessionProvider } from "next-auth/react";
import React, { createContext, useState, useContext, useEffect } from "react";
import { CartProvider } from "@/components/CartContext";

type Language = "en" | "zh";
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
    "admin.bulkAddDesc": "每行一个商品，格式：名称,描述,价格({currency}),图片链接",
    "admin.addBtn": "确认添加",
    "admin.status": "状态",
    "admin.edit": "编辑",
    "admin.save": "保存",
    "admin.cancel": "取消",
    "admin.unlist": "下架",
    "admin.relist": "上架",
    "admin.table.date": "日期",
    "admin.table.customer": "客户信息",
    "admin.table.product": "商品信息",
    "admin.table.contact": "联系方式",
    "admin.addSuccess": "添加成功！",
    "admin.addError": "添加失败，请重试",
    "admin.bulkSuccess": "批量添加成功！",
    "admin.bulkError": "批量添加失败，请检查格式。",
    "admin.updatePriceError": "更新价格失败",
    "admin.updateAvailError": "更新上架状态失败",
    "admin.updateStatusError": "更新订单状态失败",
    "product.price": "价格",
    "product.order": "立即下单",
    "product.name": "商品名称",
    "product.desc": "商品描述",
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
    "admin.bulkAddDesc": "One product per line: Name,Description,Price({currency}),ImageUrl",
    "admin.addBtn": "Add",
    "admin.status": "Status",
    "admin.edit": "Edit",
    "admin.save": "Save",
    "admin.cancel": "Cancel",
    "admin.unlist": "Unlist",
    "admin.relist": "Relist",
    "admin.table.date": "Date",
    "admin.table.customer": "Customer",
    "admin.table.product": "Product",
    "admin.table.contact": "Contact",
    "admin.addSuccess": "Added successfully!",
    "admin.addError": "Error adding product",
    "admin.bulkSuccess": "Bulk add successful!",
    "admin.bulkError": "Error in bulk add. Please check format.",
    "admin.updatePriceError": "Error updating price",
    "admin.updateAvailError": "Error updating availability",
    "admin.updateStatusError": "Failed to update status",
    "product.price": "Price",
    "product.order": "Order Now",
    "product.name": "Product Name",
    "product.desc": "Description",
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
      <AppContext.Provider value={{ lang, setLang: changeLang, t, currency, setCurrency: changeCurrency, priceMode, setPriceMode: changePriceMode, formatPrice, exchangeRate: EXCHANGE_RATE }}>
        <CartProvider>
          {children}
        </CartProvider>
      </AppContext.Provider>
    </SessionProvider>
  );
}
