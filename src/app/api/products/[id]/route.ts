import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { price, isAvailable, name, nameVi, description, descriptionVi, imageUrl } = body;

    const updateData: Record<string, number | boolean | string | null> = {};
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable);
    if (name !== undefined) updateData.name = String(name);
    if (nameVi !== undefined) updateData.nameVi = nameVi;
    if (description !== undefined) updateData.description = description;
    if (descriptionVi !== undefined) updateData.descriptionVi = descriptionVi;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PRODUCT_PATCH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
