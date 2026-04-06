"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/Providers";
import Link from "next/link";

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await signIn("credentials", {
        account,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === "ERROR_MISSING_FIELDS") setError(t("auth.err.missing"));
        else if (res.error === "ERROR_USER_NOT_FOUND") setError(t("auth.err.notFound"));
        else if (res.error === "ERROR_INVALID_PASSWORD") setError(t("auth.err.invalid"));
        else setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">{t("auth.login")}</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t("auth.account")}
          </label>
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t("auth.password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          {t("auth.login")}
        </button>
        <p className="mt-4 text-center text-sm">
          {t("auth.noAccount")} <Link href="/register" className="text-blue-500">{t("auth.register")}</Link>
        </p>
      </form>
    </div>
  );
}
