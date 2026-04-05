import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ORDER_DELETE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new NextResponse("Missing status", { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) return new NextResponse("Order not found", { status: 404 });

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF" && session.user.id !== order.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role === "USER" && status !== "CANCELLED") {
      return new NextResponse("Users can only cancel their own orders", { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("ORDER_PATCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
