import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body)) {
      return new NextResponse("Invalid payload format", { status: 400 });
    }

    // createMany handles multiple inserts
    await prisma.product.createMany({
      data: body.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        name: item.name,
        description: item.description || "",
        price: parseFloat(item.price) || 0,
        imageUrl: item.imageUrl || null,
      })),
    });

    return NextResponse.json({ success: true, count: body.length });
  } catch (error) {
    console.error("PRODUCTS_BULK_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
