import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    
    // Only Admin can change ANY password. User can change THEIR OWN password.
    if (session.user.role !== "ADMIN" && session.user.id !== id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { newPassword, oldPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return new NextResponse("Password too short", { status: 400 });
    }

    // If it's a regular user changing their own password, verify old password
    if (session.user.role !== "ADMIN") {
      if (!oldPassword) return new NextResponse("Old password required", { status: 400 });
      
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return new NextResponse("User not found", { status: 404 });

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) return new NextResponse("Invalid old password", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PASSWORD_UPDATE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
