export function moneyToNumber(str?: string | null): number | undefined {
  if (!str) return undefined;
  const onlyDigits = String(str).replace(/[^\d]/g, "");
  if (!onlyDigits) return undefined;
  const n = parseInt(onlyDigits, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function fmtVND(n?: number) {
  return (n ?? 0).toLocaleString("vi-VN") + " đ";
}
