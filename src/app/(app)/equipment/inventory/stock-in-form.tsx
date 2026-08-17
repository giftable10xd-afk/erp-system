"use client";

import { useActionState } from "react";
import { recordStockInAction } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StockInForm({ inventoryItemId }: { inventoryItemId: string }) {
  const [state, action, pending] = useActionState(recordStockInAction, undefined);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="inventoryItemId" value={inventoryItemId} />
      <Input
        name="quantity"
        type="number"
        step="any"
        min="0"
        placeholder="الكمية"
        required
        className="ltr-technical h-8 w-24"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "..." : "إضافة"}
      </Button>
      {state?.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
