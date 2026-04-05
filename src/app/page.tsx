import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
      <ShoppingBag className="h-24 w-24 text-blue-600" />
      <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
        欢迎来到越南特产
      </h1>
      <p className="text-xl text-gray-500 max-w-2xl">
        Discover the best products at amazing prices. Fast delivery and top-notch quality guaranteed.
        <br/>
        发现最棒的越南特产，超值价格、优质品质、快速送达！
      </p>
      <div className="flex gap-4">
        <Link
          href="/products"
          className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition"
        >
          查看特产 (Browse Products)
        </Link>
      </div>
    </div>
  );
}
