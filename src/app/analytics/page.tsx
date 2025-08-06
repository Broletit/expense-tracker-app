'use client';

import { generateCSV } from "../../utils/generateCSV";
import { useAppSelector } from "../../hooks/reduxHooks";
import { selectAllExpenses } from "../../features/expenses/expensesSelectors";

export default function AnalyticsPage() {
  const expenses = useAppSelector(selectAllExpenses);

  const handleExport = () => {
    generateCSV(expenses, "chi_tieu.csv");
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Phân Tích & Báo Cáo</h1>
      <p className="text-gray-600">Tải xuống dữ liệu chi tiêu dưới dạng CSV để phân tích ngoại tuyến.
          <button
        onClick={handleExport}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Xuất CSV
      </button>
      </p>
      
    </div>
  );
}
