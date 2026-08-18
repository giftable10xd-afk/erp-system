import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 متوافق مع S3 API — بنستخدم نفس الـclient بتاع AWS بس مع
// endpoint حساب Cloudflare بدل AWS. الملفات مش عامة (bucket خاص)؛ بتتعرض
// عبر src/app/api/files/[...key]/route.ts اللي بيسحبها من R2 بالسيرفر
// ويعرضها، بدل ما نخلي الـbucket نفسه public.
export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
