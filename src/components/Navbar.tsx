"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useApp } from "@/app/Providers";
import { useCart } from "@/components/CartContext";
import { LogOut, User, Globe, ShoppingBag, Banknote, SplitSquareHorizontal, ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t, currency, setCurrency, priceMode, setPriceMode } = useApp();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center min-w-0 flex-shrink">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-lg sm:text-xl text-blue-600 mr-2 truncate">
              <ShoppingBag className="mr-1 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="truncate max-w-[100px] sm:max-w-none">{t("nav.store")}</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link href="/products" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                {t("nav.products")}
              </Link>
              {session?.user && (
                <Link href="/account" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  {t("nav.account")}
                </Link>
              )}
              {session?.user?.role === "ADMIN" && (
                <Link href="/admin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  {t("nav.admin")}
                </Link>
              )}
              {session?.user?.role === "STAFF" && (
                <Link href="/staff" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  {t("admin.staff")}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link href="/cart" className="relative text-gray-500 hover:text-gray-700 p-2">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setCurrency(currency === "CNY" ? "VND" : "CNY")}
              className="text-gray-500 hover:text-gray-700 flex items-center p-2"
              title="Change Currency"
            >
              <Banknote className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">{currency}</span>
            </button>
            <button
              onClick={() => {
                const nextLang = lang === "zh" ? "en" : lang === "en" ? "vi" : "zh";
                setLang(nextLang);
              }}
              className="text-gray-500 hover:text-gray-700 flex items-center p-2"
              title="Change Language"
            >
              <Globe className="h-5 w-5 sm:mr-1" />
              <span className="hidden sm:inline">{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setPriceMode(priceMode === "DUAL" ? "SINGLE" : "DUAL")}
              className="text-gray-500 hover:text-gray-700 items-center p-2 hidden sm:flex"
              title={priceMode === "DUAL" ? t("nav.priceMode.DUAL") : t("nav.priceMode.SINGLE")}
            >
              <SplitSquareHorizontal className="h-5 w-5 mr-1" />
              {priceMode === "DUAL" ? t("nav.priceMode.DUAL") : t("nav.priceMode.SINGLE")}
            </button>
            {session ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm text-gray-500 hidden md:block">
                  {session.user?.name || session.user?.email || "用户"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-red-600 hover:text-red-800 flex items-center p-2 sm:p-0"
                >
                  <LogOut className="h-5 w-5 sm:mr-1" />
                  <span className="hidden sm:inline">{t("nav.logout")}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 flex items-center text-sm sm:text-base"
              >
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t("nav.login")}</span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-500 hover:text-gray-700 p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
              {t("nav.products")}
            </Link>
            {session?.user && (
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                {t("nav.account")}
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                {t("nav.admin")}
              </Link>
            )}
            {session?.user?.role === "STAFF" && (
              <Link href="/staff" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                {t("admin.staff")}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
