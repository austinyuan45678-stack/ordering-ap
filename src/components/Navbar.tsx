"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useApp } from "@/app/Providers";
import { LogOut, User, Globe, ShoppingBag, Banknote, SplitSquareHorizontal } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang, t, currency, setCurrency, priceMode, setPriceMode } = useApp();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-blue-600">
              <ShoppingBag className="mr-2 h-6 w-6" />
              {t("nav.store")}
            </Link>
            <div className="ml-6 flex space-x-4">
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
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </div>
    </nav>
  );
}
