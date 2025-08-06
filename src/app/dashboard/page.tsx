'use client';

import StatCards from "../../components/ui/StatCards";
import RecentExpenses from "../../components/dashboard/RecentExpenses";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tổng Quan Chi Tiêu</h1>
      <div>
        <StatCards />
      </div>
      <div>
        <RecentExpenses />
      </div>
      <div>
        
      </div>
    </div>
  );
}
