import { NextRequest } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";

// بروكسي بسيط لملفات R2 — الـbucket خاص، فالملف بيتسحب هنا بالسيرفر (بمفاتيح
// R2 السرية) وبيتعرض للطالب. مفيش تحقق صلاحيات هنا عمدًا: شعار الشركة لازم
// يظهر في صفحات مطبوعة/بوابة عملاء عامة (مفيش جلسة تسجيل دخول)، فهو أصلًا
// مش محتوى حساس.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const object = await r2.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: objectKey })
    );

    const body = await object.Body?.transformToByteArray();
    if (!body) return new Response("غير موجود", { status: 404 });

    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("غير موجود", { status: 404 });
  }
}
