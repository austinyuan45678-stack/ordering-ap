import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { account, password, name } = await req.json();

    if (!account || !password) {
      return new NextResponse("请填写完整信息 / Vui lòng điền đầy đủ thông tin", { status: 400 });
    }

    const exist = await prisma.user.findFirst({
      where: {
        OR: [
          { email: account },
          { phone: account },
        ],
      },
    });

    if (exist) {
      return new NextResponse("账号已存在 / Tài khoản đã tồn tại", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isEmail = account.includes("@");

    const user = await prisma.user.create({
      data: {
        email: isEmail ? account : null,
        phone: isEmail ? null : account,
        name,
        password: hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return new NextResponse("系统错误，请重试 / Lỗi hệ thống, vui lòng thử lại", { status: 500 });
  }
}
