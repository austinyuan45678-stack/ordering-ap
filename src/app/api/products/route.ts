import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";

    const products = await prisma.product.findMany({
      where: isAdmin ? undefined : { isAvailable: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("PRODUCTS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, nameVi, description, descriptionVi, price, imageUrl } = await req.json();

    if (!name || !price) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        nameVi: nameVi || null,
        description,
        descriptionVi: descriptionVi || null,
        price: parseFloat(price),
        imageUrl,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PRODUCTS_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
