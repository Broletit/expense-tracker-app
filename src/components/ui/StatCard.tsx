import { Card, CardHeader, CardTitle, CardContent } from "./card";
export default function StatCard({ label, value }: { label:string; value:string|number }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}
