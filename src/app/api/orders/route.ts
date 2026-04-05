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
    const { items, address, phone, totalAmount } = body;

    if (!items || !items.length || !address || !phone) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    // Verify all products exist and have enough stock
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        return new NextResponse(`Product no longer exists: ${item.name || item.productId}`, { status: 400 });
      }
      if (!product.isAvailable) {
        return new NextResponse(`Product is no longer available: ${product.name}`, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return new NextResponse(`Not enough stock for: ${product.name}. Only ${product.stock} left.`, { status: 400 });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        address,
        phone,
        totalAmount,
        items: {
          create: items.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(order);
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("ORDERS_POST_ERROR", error);
    return new NextResponse(`Internal Error: ${error.message || "Unknown"}`, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    const isStaff = session.user.role === "STAFF";

    let orders;

    if (isAdmin || isStaff) {
      orders = await prisma.order.findMany({
        include: {
          user: true,
          items: {
            include: { product: true }
          },
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
          items: {
            include: { product: true }
          },
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
