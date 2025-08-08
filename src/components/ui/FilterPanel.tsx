"use client";

import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  setSearch,
  setCategories,
  setMinAmount,
  setMaxAmount,
  setDateRange,
  resetFilters,
  setSortOption,
} from "../../features/filters/filtersSlice";
import { selectFilters } from "../../features/filters/filtersSelectors";
import { categories } from "../../constants/categories";
import * as Icons from "lucide-react";

const sortGroups = {
  date: ["date-desc", "date-asc"],
  amount: ["amount-desc", "amount-asc"],
  description: ["desc-asc", "desc-desc"],
};

export default function FilterPanel() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);

  return (
    <div className="space-y-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
      {/* Input filter */}
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Tìm mô tả</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className="w-full p-2 border rounded bg-white dark:bg-gray-900"
            placeholder="Nhập mô tả..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Khoảng số tiền
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Tối thiểu"
              value={filters.minAmount ?? ""}
              onChange={(e) =>
                dispatch(
                  setMinAmount(
                    e.target.value === "" || isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value)
                  )
                )
              }
              className="w-1/2 p-2 border rounded bg-white dark:bg-gray-900"
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Tối đa"
              value={filters.maxAmount ?? ""}
              onChange={(e) =>
                dispatch(
                  setMaxAmount(
                    e.target.value === "" || isNaN(Number(e.target.value))
                      ? null
                      : Number(e.target.value)
                  )
                )
              }
              className="w-1/2 p-2 border rounded bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Khoảng ngày</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.dateRange?.[0] ?? ""}
              onChange={(e) =>
                dispatch(
                  setDateRange([e.target.value, filters.dateRange?.[1] ?? ""])
                )
              }
              className="w-1/2 p-2 border rounded bg-white dark:bg-gray-900"
            />
            <input
              type="date"
              value={filters.dateRange?.[1] ?? ""}
              onChange={(e) =>
                dispatch(
                  setDateRange([filters.dateRange?.[0] ?? "", e.target.value])
                )
              }
              className="w-1/2 p-2 border rounded bg-white dark:bg-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-2">Danh mục</label>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => {
            const selected = filters.categories.includes(c.name);
            const Icon = Icons[
              c.icon as keyof typeof Icons
            ] as React.ComponentType<{
              size?: number;
              className?: string;
            }>;

            return (
              <button
                key={c.name}
                onClick={() => {
                  const updated = selected
                    ? filters.categories.filter((name) => name !== c.name)
                    : [...filters.categories, c.name];
                  dispatch(setCategories(updated));
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm border transition
                  ${
                    selected
                      ? `bg-${c.color.replace("500", "100")} text-${
                          c.color
                        } border-${c.color}`
                      : `bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600`
                  }
                  hover:scale-105 hover:shadow`}
              >
                {Icon && <Icon size={16} className={`text-${c.color}`} />}
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Arrange and reset */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="space-y-2">
          <label className="block text-sm font-medium mb-2">Sắp xếp theo</label>
          <div className="flex flex-wrap gap-4">
            {Object.entries(sortGroups).map(([group, options]) => (
              <div key={group} className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {group === "date"
                    ? "Ngày:"
                    : group === "amount"
                    ? "Số tiền:"
                    : "Mô tả:"}
                </span>
                {options.map((value) => (
                  <button
                    key={value}
                    onClick={() => dispatch(setSortOption(value))}
                    className={`px-3 py-1 text-sm rounded-sm border transition ${
                      filters.sortOption === value
                        ? "bg-pink-100 text-pink-600 border-pink-400"
                        : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {value === "date-desc"
                      ? "Mới nhất"
                      : value === "date-asc"
                      ? "Cũ nhất"
                      : value === "amount-desc"
                      ? "Giảm dần"
                      : value === "amount-asc"
                      ? "Tăng dần"
                      : value === "desc-asc"
                      ? "A → Z"
                      : "Z → A"}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="self-end md:self-start pt-2 md:pt-6">
          <button
            onClick={() => dispatch(resetFilters())}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded shadow"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}
