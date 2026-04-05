import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { account, password, name } = await req.json();

    if (!account || !password) {
      return new NextResponse("Missing fields", { status: 400 });
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
      return new NextResponse("Account already exists", { status: 400 });
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
