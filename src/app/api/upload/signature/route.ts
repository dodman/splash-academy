import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !["INSTRUCTOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary not configured" }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "splash-academy/videos";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, resource_type: "video" },
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}
