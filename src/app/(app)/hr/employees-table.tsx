"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

type EmployeeRow = {
  id: string;
  fullNameAr: string;
  position: string;
  hireDateLabel: string;
  baseSalaryLabel: string;
  isActive: boolean;
};

export function EmployeesTable({
  employees,
  canWrite,
}: {
  employees: EmployeeRow[];
  canWrite: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>الوظيفة</TableHead>
            <TableHead>تاريخ التعيين</TableHead>
            <TableHead>المرتب الأساسي</TableHead>
            <TableHead>الحالة</TableHead>
            {canWrite && <TableHead>إجراء</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={canWrite ? 6 : 5} className="text-center text-muted-foreground">
                مفيش موظفين مسجلين لسه
              </TableCell>
            </TableRow>
          )}
          {employees.map((emp, i) => (
            <motion.tr
              key={emp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="border-b transition-colors last:border-0 hover:bg-muted/50"
            >
              <TableCell>{emp.fullNameAr}</TableCell>
              <TableCell>{emp.position}</TableCell>
              <TableCell>{emp.hireDateLabel}</TableCell>
              <TableCell>{emp.baseSalaryLabel}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    emp.isActive
                      ? "bg-status-active-bg text-status-active"
                      : "bg-status-retired-bg text-status-retired"
                  }
                >
                  {emp.isActive ? "نشط" : "معطل"}
                </Badge>
              </TableCell>
              {canWrite && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link href={`/hr/employees/${emp.id}/edit`}>
                        <Pencil className="size-3.5" />
                        تعديل
                      </Link>
                    }
                  />
                </TableCell>
              )}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
