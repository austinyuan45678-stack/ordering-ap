import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "support_phone" },
    });
    return NextResponse.json({ phone: setting?.value || "" });
  } catch (error) {
    console.error("SETTING_GET_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { phone } = await req.json();

    const setting = await prisma.setting.upsert({
      where: { key: "support_phone" },
      update: { value: phone },
      create: { key: "support_phone", value: phone },
    });

    return NextResponse.json({ success: true, phone: setting.value });
  } catch (error) {
    console.error("SETTING_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
