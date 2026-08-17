export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  generator: "مولد",
  tractor: "تركتور",
  other: "أخرى",
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  active: "نشطة",
  in_maintenance: "تحت الصيانة",
  rented: "مؤجرة",
  retired: "خارج الخدمة",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "إنشاء",
  update: "تعديل",
  delete: "حذف",
};

export const EQUIPMENT_FIELD_LABELS: Record<string, string> = {
  assetTag: "الرقم التعريفي",
  type: "النوع",
  brand: "الماركة",
  model: "الموديل",
  serialNumber: "الرقم المسلسل",
  notes: "ملاحظات",
  status: "الحالة",
};

export const EQUIPMENT_STATUS_CLASSES: Record<string, string> = {
  active: "bg-status-active-bg text-status-active",
  in_maintenance: "bg-status-maintenance-bg text-status-maintenance",
  rented: "bg-status-rented-bg text-status-rented",
  retired: "bg-status-retired-bg text-status-retired",
};

export const COMPONENT_TYPE_LABELS: Record<string, string> = {
  filter: "فلتر",
  oil: "زيت",
  injector: "بخاخ/حاقن",
  other_part: "قطعة غيار أخرى",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  purchase_in: "توريد",
  maintenance_out: "صرف صيانة",
  rental_out: "صرف إيجار",
  adjustment: "تسوية",
  return_in: "إرجاع",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  routine: "دورية",
  repair: "إصلاح",
  emergency: "طارئة",
};

export const COMPONENT_EVENT_TYPE_LABELS: Record<string, string> = {
  changed: "اتغيرت",
  inspected: "اتفحصت",
  replaced: "اتستبدلت",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "حاضر",
  absent: "غايب",
  leave: "إجازة",
  late: "متأخر",
};

export const ATTENDANCE_STATUS_CLASSES: Record<string, string> = {
  present: "bg-status-active-bg text-status-active",
  absent: "bg-destructive/10 text-destructive",
  leave: "bg-status-rented-bg text-status-rented",
  late: "bg-status-maintenance-bg text-status-maintenance",
};

export const PAYROLL_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  finalized: "معتمد",
  paid: "مدفوع",
  void: "ملغى",
};

const MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function monthNameAr(month: number) {
  return MONTH_NAMES_AR[month - 1] ?? String(month);
}

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  active: "قائم",
  completed: "منتهي",
  overdue: "متأخر",
  cancelled: "ملغي",
};

export const RENTAL_STATUS_CLASSES: Record<string, string> = {
  active: "bg-status-rented-bg text-status-rented",
  completed: "bg-status-active-bg text-status-active",
  overdue: "bg-destructive/10 text-destructive",
  cancelled: "bg-status-retired-bg text-status-retired",
};

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  issued: "صادرة",
  paid: "مدفوعة",
  cancelled: "ملغاة",
};

export const INVOICE_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-status-retired-bg text-status-retired",
  issued: "bg-status-rented-bg text-status-rented",
  paid: "bg-status-active-bg text-status-active",
  cancelled: "bg-destructive/10 text-destructive",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  sent: "مرسل",
  accepted: "متقبَّل",
  rejected: "مرفوض",
  expired: "منتهي الصلاحية",
  converted: "تم التحويل لفاتورة",
};

export const QUOTE_STATUS_CLASSES: Record<string, string> = {
  draft: "bg-status-retired-bg text-status-retired",
  sent: "bg-status-rented-bg text-status-rented",
  accepted: "bg-status-active-bg text-status-active",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-destructive/10 text-destructive",
  converted: "bg-status-active-bg text-status-active",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "نقدًا",
  bank_transfer: "تحويل بنكي",
  check: "شيك",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "مفتوح",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلق",
};

export const TICKET_STATUS_CLASSES: Record<string, string> = {
  open: "bg-status-rented-bg text-status-rented",
  in_progress: "bg-status-maintenance-bg text-status-maintenance",
  resolved: "bg-status-active-bg text-status-active",
  closed: "bg-status-retired-bg text-status-retired",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "عالية",
  urgent: "عاجلة",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  fuel: "وقود",
  parts: "قطع غيار",
  salaries: "مرتبات",
  utilities: "مرافق",
  other: "أخرى",
};

export const TICKET_PRIORITY_CLASSES: Record<string, string> = {
  low: "bg-status-retired-bg text-status-retired",
  normal: "bg-status-rented-bg text-status-rented",
  high: "bg-status-maintenance-bg text-status-maintenance",
  urgent: "bg-destructive/10 text-destructive",
};
