import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// جرس الإشعارات بيقرأ من هنا (SSE) — تحديث العداد كل شوية بدل الاعتماد على
// polling كامل من العميل. مفيش تخزين مؤقت هنا عمدًا (بيانات لحظية لكل مستخدم).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const count = await prisma.notification.count({
            where: { recipientUserId: session.id, isRead: false },
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
        } catch {
          // الاتصال اتقفل أو حصل خطأ مؤقت — هيتاخد try تاني في الدورة الجاية
        }
      };

      await send();
      interval = setInterval(send, 10000);
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
