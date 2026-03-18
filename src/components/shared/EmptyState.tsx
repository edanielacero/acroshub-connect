import { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center animate-fade-in sm:py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        {icon || <PackageOpen className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && actionTo && (
        <Button asChild className="w-full sm:w-auto"><Link to={actionTo}>{actionLabel}</Link></Button>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button onClick={onAction} className="w-full sm:w-auto">{actionLabel}</Button>
      )}
    </div>
  );
}
