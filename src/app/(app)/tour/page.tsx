import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Clapperboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function TourPage() {
  await requireSession();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Clapperboard}
        title="جولة تعريفية بالنظام"
        description="فيديو شرح مختصر لكل موديولات النظام بصوت عربي"
        color="violet"
      />

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <video
            controls
            preload="metadata"
            className="w-full bg-black"
            poster="/icon.svg"
          >
            <source src="/videos/tour.mp4" type="video/mp4" />
            متصفحك مش بيدعم تشغيل الفيديو مباشرة.
          </video>
        </CardContent>
      </Card>
    </div>
  );
}
