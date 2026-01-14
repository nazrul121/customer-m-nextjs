import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phone || undefined }
      ]
    }
  });

  return NextResponse.json({
    emailExists: existing?.email === email,
    phoneExists: existing?.phoneNumber === phone
  });
}