import { Expense } from "../types";

export function generateCSV(data: Expense[], filename = "chi_tieu.csv") {
  const headers = ["Mô tả", "Danh mục", "Số tiền", "Ngày"];
  const rows = data.map((e) => [
    e.description,
    e.category,
    e.amount.toString(),
    e.date,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
