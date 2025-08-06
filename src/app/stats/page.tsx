'use client';

import StatCards from "../../components/ui/StatCards";
import CategoryChart from "../../components/charts/CategoryChart";
import TrendChart from "../../components/charts/TrendChart";
import MonthlyCompareChart from "../../components/charts/MonthlyCompareChart";

export default function StatsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Phân Tích & Thống Kê</h1>
      
      <StatCards />

      <div className="grid md:grid-cols-2 gap-4">
        <MonthlyCompareChart />
        <CategoryChart />
      </div>

      <TrendChart />
    </div>
  );
}
