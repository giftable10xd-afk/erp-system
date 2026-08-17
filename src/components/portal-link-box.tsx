"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

// بيعرض المسار النسبي بس (من غير origin) عشان يفضل نفس الحاجة بين
// السيرفر والعميل (SSR/hydration) — الرابط الكامل بيتحسب وقت النسخ بس،
// جوه event handler، مش أثناء الـrender.
export function PortalLinkBox({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Input readOnly value={path} className="ltr-technical flex-1" dir="ltr" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          const url = `${window.location.origin}${path}`;
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "اتنسخ الرابط الكامل" : "نسخ الرابط الكامل"}
      </Button>
    </div>
  );
}
