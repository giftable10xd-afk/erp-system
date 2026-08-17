// كل الأرقام والتواريخ المعروضة في النظام (مش المدخلة في input فورمات) لازم
// تعدي من هنا — بأرقام لاتينية (٠١٢... -> 012...) بناءً على طلب المستخدم،
// بدل الأرقام العربية القديمة. النصوص المحيطة تفضل عربي RTL عادي.
const numberFormatter = new Intl.NumberFormat("ar-EG-u-nu-latn");
const dateFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  dateStyle: "medium",
});
const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(Number(value));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}
