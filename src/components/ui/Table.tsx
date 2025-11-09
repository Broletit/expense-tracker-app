import React from "react";

export function Th({ children, className = "" }: any) {
  return (
    <th
      className={`px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
    </th>
  );
}
export function Td({ children, className = "", colSpan }: any) {
  return (
    <td colSpan={colSpan} className={`px-3 py-2 text-gray-800 dark:text-gray-200 ${className}`}>
      {children}
    </td>
  );
}
