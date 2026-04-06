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
    const { status, address, phone, items, totalAmount } = body;

    const order = await prisma.order.findUnique({ 
      where: { id },
      include: { items: true } 
    });

    if (!order) return new NextResponse("Order not found", { status: 404 });

    if (session.user.role !== "ADMIN" && session.user.role !== "STAFF" && session.user.id !== order.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role === "USER" && order.status !== "PENDING") {
      return new NextResponse("此订单已被管理员处理，无法再修改或取消 / Đơn hàng đã được xử lý, không thể sửa đổi", { status: 403 });
    }

    // Only Admin or User (if order is PENDING) can edit address/phone/items
    const canEditDetails = session.user.role === "ADMIN" || (session.user.id === order.userId && order.status === "PENDING");

    let finalStatus = status || order.status;

    if (session.user.role === "USER" && status === "CANCELLED") {
      finalStatus = "CANCELLED_BY_USER";
    } else if (status === "CANCELLED") {
      finalStatus = "CANCELLED_BY_ADMIN";
    }

    // Check if moving to PROCESSING or COMPLETED from PENDING
    if ((finalStatus === "PROCESSING" || finalStatus === "COMPLETED") && order.status === "PENDING") {
      // Deduct stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
    }

    const updateData: Record<string, unknown> = { status: finalStatus };

    if (canEditDetails) {
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (totalAmount !== undefined) updateData.totalAmount = totalAmount;

      if (items && Array.isArray(items)) {
        await prisma.orderItem.deleteMany({ where: { orderId: id } });
        updateData.items = {
          create: items.map((item: { productId: string, quantity: number, price: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        };
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        items: { include: { product: true } }
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("ORDER_PATCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
