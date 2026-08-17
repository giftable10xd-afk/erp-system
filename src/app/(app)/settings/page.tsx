import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { Settings as SettingsIcon } from "lucide-react";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requirePermission(PERMISSIONS.SETTINGS_READ);
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={SettingsIcon}
        title="إعدادات الشركة"
        description="بيانات الشركة المستخدمة في ترويسة الفواتير وعروض الأسعار المطبوعة"
        color="blue"
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
