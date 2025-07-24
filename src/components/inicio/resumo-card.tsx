import { Card } from "../ui/card";

type CardProps = {
  title: string;
  value: string;
  gradient: string;
};

export default function ResumoCard({ title, value, gradient }: CardProps) {
  return (
    <Card
      className={`text-white p-4 rounded-lg flex flex-col items-center justify-center bg-gradient-to-r ${gradient}`}
    >
      <p className="text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}
