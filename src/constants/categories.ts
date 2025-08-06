export type Category = {
  name: string;
  color: string; 
  icon: string;  
};

export const categories: Category[] = [
  { name: "Ăn uống", color: "red-500", icon: "Utensils" },
  { name: "Di chuyển", color: "yellow-500", icon: "Car" },
  { name: "Giải trí", color: "purple-500", icon: "Gamepad2" },
  { name: "Mua sắm", color: "pink-500", icon: "ShoppingCart" },
  { name: "Hóa đơn", color: "blue-500", icon: "Receipt" },
  { name: "Y tế", color: "green-500", icon: "HeartPulse" },
  { name: "Giáo dục", color: "indigo-500", icon: "BookOpenCheck" },
  { name: "Khác", color: "gray-500", icon: "MoreHorizontal" },
];
