import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const result = settings.reduce((acc: Record<string, string>, s: { key: string, value: string }) => ({ ...acc, [s.key]: s.value }), {});
    return NextResponse.json(result);
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

    const body = await req.json();

    const updatePromises = Object.entries(body).map(([key, value]) => 
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, ...body });
  } catch (error) {
    console.error("SETTING_POST_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
