"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function RecentExpenses() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["expenses",{ page:1,limit:5 }],
    queryFn: () => fetch("/api/expenses?page=1&limit=5&sort=date&order=desc").then(r=>r.json()),
    staleTime: 120_000, gcTime: 300_000,
  });

  const del = useMutation({
    mutationFn: (id:number) => fetch(`/api/expenses/${id}`, { method:"DELETE" }).then(r=>r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:["expenses"] });
      qc.invalidateQueries({ queryKey:["expenses","stats"] });
    }
  });

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader><CardTitle>Chi tiêu gần đây</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? "Đang tải…" : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Ngày</th>
                  <th className="p-3 text-left">Danh mục</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-right">Số tiền</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r:any)=>(
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.date}</td>
                    <td className="p-3">{r.category_name ?? "-"}</td>
                    <td className="p-3">{r.note ?? "-"}</td>
                    <td className="p-3 text-right">{Number(r.amount).toLocaleString("vi-VN")} ₫</td>
                    <td className="p-3 text-center">
                      <button onClick={()=>del.mutate(r.id)} className="text-red-600 hover:underline">Xoá</button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">Chưa có khoản chi</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
