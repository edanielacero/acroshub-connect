import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
}

export function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-bold break-words">{value}</p>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 sm:h-12 sm:w-12">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
