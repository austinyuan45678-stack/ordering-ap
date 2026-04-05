import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { productId, address, phone } = body;

    if (!productId || !address || !phone) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        productId,
        address,
        phone,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("ORDERS_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    let orders;

    if (isAdmin) {
      orders = await prisma.order.findMany({
        include: {
          user: true,
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      orders = await prisma.order.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error("ORDERS_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
