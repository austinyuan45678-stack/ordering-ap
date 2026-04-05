import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { put } from '@vercel/blob';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return new NextResponse("Blob storage not configured", { status: 500 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
