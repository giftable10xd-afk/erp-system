"use client";

import { useActionState, useState } from "react";
import { createQuoteAction } from "@/lib/actions/quote-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

type RentalContractOption = {
  id: string;
  label: string;
  customerId: string;
  rateAmount: string;
};

type LineRow = {
  key: number;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
};

export function QuoteForm({
  customers,
  rentalContracts,
}: {
  customers: { id: string; nameAr: string }[];
  rentalContracts: RentalContractOption[];
}) {
  const [state, action, pending] = useActionState(createQuoteAction, undefined);

  const [customerId, setCustomerId] = useState("");
  const [rentalContractId, setRentalContractId] = useState("");
  const [lines, setLines] = useState<LineRow[]>([
    { key: 0, description: "", quantity: "1", unitPrice: "", taxRate: "0" },
  ]);
  const [nextKey, setNextKey] = useState(1);

  function applyContract(contractId: string) {
    setRentalContractId(contractId);
    const contract = rentalContracts.find((c) => c.id === contractId);
    if (!contract) return;
    setCustomerId(contract.customerId);
    setLines((rows) => {
      if (rows.length === 1 && !rows[0].description) {
        return [
          {
            key: rows[0].key,
            description: `إيجار معدة — ${contract.label}`,
            quantity: "1",
            unitPrice: contract.rateAmount,
            taxRate: "0",
          },
        ];
      }
      return rows;
    });
  }

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
          {rentalContracts.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="rentalContractId">ربط بعقد إيجار (اختياري)</Label>
              <select
                id="rentalContractId"
                name="rentalContractId"
                value={rentalContractId}
                onChange={(e) => applyContract(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">بدون ربط</option>
                {rentalContracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="customerId">العميل</Label>
            <select
              id="customerId"
              name="customerId"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="" disabled>
                اختر العميل
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expiryDate">تاريخ انتهاء الصلاحية (اختياري)</Label>
            <Input id="expiryDate" name="expiryDate" type="date" className="ltr-technical w-48" />
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>بنود العرض</Label>
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
            {pending ? "جارٍ الحفظ..." : "حفظ عرض السعر (مسودة)"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
