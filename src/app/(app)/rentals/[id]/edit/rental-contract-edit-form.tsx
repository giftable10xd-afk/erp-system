"use client";

import { useActionState } from "react";
import { updateRentalContractAction } from "@/lib/actions/rental-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RentalContractEditForm({
  contract,
}: {
  contract: { id: string; expectedReturnDate: string; rateAmount: string };
}) {
  const [state, action, pending] = useActionState(updateRentalContractAction, undefined);

  return (
    <Card className="max-w-xl shadow-sm">
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="contractId" value={contract.id} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="expectedReturnDate">التسليم المتوقع</Label>
            <Input
              id="expectedReturnDate"
              name="expectedReturnDate"
              type="date"
              defaultValue={contract.expectedReturnDate}
              className="ltr-technical"
              dir="ltr"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rateAmount">قيمة الإيجار</Label>
            <Input
              id="rateAmount"
              name="rateAmount"
              type="number"
              step="any"
              min="0"
              defaultValue={contract.rateAmount}
              className="ltr-technical"
              dir="ltr"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-fit">
            {pending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
