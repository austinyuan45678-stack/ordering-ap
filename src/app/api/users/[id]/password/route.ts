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
      return new NextResponse("新密码至少需要6位 / Mật khẩu mới phải có ít nhất 6 ký tự", { status: 400 });
    }

    // If it's a regular user changing their own password, verify old password
    if (session.user.role !== "ADMIN") {
      if (!oldPassword) return new NextResponse("请输入旧密码 / Vui lòng nhập mật khẩu cũ", { status: 400 });
      
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return new NextResponse("用户不存在 / Không tìm thấy người dùng", { status: 404 });

      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) return new NextResponse("旧密码错误 / Mật khẩu cũ không chính xác", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PASSWORD_UPDATE_ERROR", error);
    return new NextResponse("修改失败，请重试 / Thay đổi thất bại, vui lòng thử lại", { status: 500 });
  }
}
