"use client";

import { useActionState, useState } from "react";
import { updateInvoiceAction } from "@/lib/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type LineRow = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

export function InvoiceEditForm({
  invoiceId,
  lineItems,
}: {
  invoiceId: string;
  lineItems: { description: string; quantity: string; unitPrice: string; taxRate: string }[];
}) {
  const [state, action, pending] = useActionState(updateInvoiceAction, undefined);

  const [lines, setLines] = useState<LineRow[]>(
    lineItems.map((li, i) => ({ key: i, ...li }))
  );
  const [nextKey, setNextKey] = useState(lineItems.length);

  const total = lines.reduce((sum, row) => {
    const q = Number(row.quantity) || 0;
    const p = Number(row.unitPrice) || 0;
    const t = Number(row.taxRate) || 0;
    return sum + q * p * (1 + t / 100);
  }, 0);

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-6">
          <input type="hidden" name="invoiceId" value={invoiceId} />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>بنود الفاتورة</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setLines((rows) => [
                    ...rows,
                    { key: nextKey, description: "", quantity: "1", unitPrice: "", taxRate: "0" },
                  ]);
                  setNextKey((k) => k + 1);
                }}
              >
                <Plus className="size-3.5" />
                إضافة بند
              </Button>
            </div>

            {lines.map((row, idx) => (
              <div key={row.key} className="flex items-center gap-2">
                <Input
                  name="lineDescription"
                  placeholder="الوصف"
                  value={row.description}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((rows) =>
                      rows.map((r, i) => (i === idx ? { ...r, description: v } : r))
                    );
                  }}
                  className="flex-1"
                />
                <Input
                  name="lineQuantity"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="الكمية"
                  value={row.quantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((rows) => rows.map((r, i) => (i === idx ? { ...r, quantity: v } : r)));
                  }}
                  className="ltr-technical w-24"
                />
                <Input
                  name="lineUnitPrice"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="سعر الوحدة"
                  value={row.unitPrice}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((rows) => rows.map((r, i) => (i === idx ? { ...r, unitPrice: v } : r)));
                  }}
                  className="ltr-technical w-28"
                />
                <Input
                  name="lineTaxRate"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  placeholder="ضريبة %"
                  value={row.taxRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((rows) => rows.map((r, i) => (i === idx ? { ...r, taxRate: v } : r)));
                  }}
                  className="ltr-technical w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="حذف البند"
                  onClick={() => setLines((rows) => rows.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="font-medium">الإجمالي</span>
            <span className="ltr-technical text-lg font-bold">{total.toFixed(2)}</span>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
