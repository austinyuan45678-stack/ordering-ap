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
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
              <ShoppingBag className="mr-2 h-6 w-6" />
              {t("nav.store")}
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
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/cart" className="relative text-gray-500 hover:text-gray-700 p-2">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setPriceMode(priceMode === "DUAL" ? "SINGLE" : "DUAL")}
              className="text-gray-500 hover:text-gray-700 flex items-center p-2 hidden sm:flex"
              title={priceMode === "DUAL" ? t("nav.priceMode.DUAL") : t("nav.priceMode.SINGLE")}
            >
              <SplitSquareHorizontal className="h-5 w-5 mr-1" />
              {priceMode === "DUAL" ? t("nav.priceMode.DUAL") : t("nav.priceMode.SINGLE")}
            </button>
            <button
              onClick={() => setCurrency(currency === "CNY" ? "VND" : "CNY")}
              className="text-gray-500 hover:text-gray-700 flex items-center p-2"
              title="Change Currency"
            >
              <Banknote className="h-5 w-5 mr-1" />
              {currency}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="text-gray-500 hover:text-gray-700 flex items-center p-2"
              title="Change Language"
            >
              <Globe className="h-5 w-5 mr-1" />
              {lang.toUpperCase()}
            </button>
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 hidden sm:block">
                  {session.user?.name || session.user?.email || "用户"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-red-600 hover:text-red-800 flex items-center"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <User className="h-4 w-4 mr-2" />
                {t("nav.login")}
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
