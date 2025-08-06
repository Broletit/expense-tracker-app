import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}
    >
      {children}
    </div>
  );
}
