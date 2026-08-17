// مفاتيح الصلاحيات بصيغة "module:action" — تُستخدم بدل التحقق المباشر من الدور
// (role) في أي مكان بالكود، عشان نظام الأدوار يفضل قابل للتوسع من غير كود جديد.

export const PERMISSIONS = {
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",
  MAINTENANCE_READ: "maintenance:read",
  MAINTENANCE_CREATE: "maintenance:create",
  HR_READ: "hr:read",
  HR_WRITE: "hr:write",
  ACCOUNTING_READ: "accounting:read",
  ACCOUNTING_WRITE: "accounting:write",
  QUOTE_READ: "quote:read",
  QUOTE_WRITE: "quote:write",
  SUPPORT_READ: "support:read",
  SUPPORT_WRITE: "support:write",
  RENTALS_READ: "rentals:read",
  RENTALS_WRITE: "rentals:write",
  DASHBOARD_VIEW_ALL: "dashboard:view_all",
  ALERTS_READ: "alerts:read",
  USERS_MANAGE: "users:manage",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_SEEDS: {
  key: string;
  nameAr: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
  {
    key: "owner",
    nameAr: "المالك",
    description: "صلاحية كاملة على كل الموديولات",
    permissions: Object.values(PERMISSIONS),
  },
  {
    key: "engineer",
    nameAr: "مهندس",
    description: "تسجيل الصيانة والاطلاع على المخزون والتنبيهات",
    permissions: [
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.MAINTENANCE_CREATE,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.ALERTS_READ,
    ],
  },
  {
    key: "accountant",
    nameAr: "محاسب",
    description: "إدارة الفواتير والمحاسبة",
    permissions: [
      PERMISSIONS.ACCOUNTING_READ,
      PERMISSIONS.ACCOUNTING_WRITE,
      PERMISSIONS.QUOTE_READ,
      PERMISSIONS.QUOTE_WRITE,
    ],
  },
  {
    key: "warehouse_keeper",
    nameAr: "أمين مخزن",
    description: "إدارة المخزون ومتابعة حركاته",
    permissions: [
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_WRITE,
      PERMISSIONS.MAINTENANCE_READ,
      PERMISSIONS.ALERTS_READ,
    ],
  },
  {
    key: "rental_manager",
    nameAr: "مسؤول الإيجارات",
    description: "إدارة عقود الإيجار والعملاء",
    permissions: [
      PERMISSIONS.RENTALS_READ,
      PERMISSIONS.RENTALS_WRITE,
      PERMISSIONS.ACCOUNTING_READ,
      PERMISSIONS.QUOTE_READ,
      PERMISSIONS.QUOTE_WRITE,
      PERMISSIONS.INVENTORY_READ,
    ],
  },
  {
    key: "support_agent",
    nameAr: "موظف الدعم الفني",
    description: "متابعة طلبات الدعم الفني",
    permissions: [PERMISSIONS.SUPPORT_READ, PERMISSIONS.SUPPORT_WRITE],
  },
];
