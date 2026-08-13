import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StoreWithStockStockStatus } from "@workspace/api-client-react";

interface StatusBadgeProps {
  status: StoreWithStockStockStatus | "in_stock" | "low_stock" | "out_of_stock" | "reserved";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "in_stock":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium font-mono text-green-700 bg-green-500/10 border border-green-500/20 dark:text-green-400", className)}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          EN STOCK
        </span>
      );
    case "low_stock":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium font-mono text-amber-700 bg-amber-500/10 border border-amber-500/20 dark:text-amber-400", className)}>
          <AlertCircle className="h-3.5 w-3.5" />
          STOCK FAIBLE
        </span>
      );
    case "out_of_stock":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium font-mono text-muted-foreground bg-muted border border-border", className)}>
          <XCircle className="h-3.5 w-3.5" />
          ÉPUISÉ
        </span>
      );
    case "reserved":
      return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium font-mono text-orange-700 bg-orange-500/10 border border-orange-500/20 dark:text-orange-400", className)}>
          <Clock className="h-3.5 w-3.5" />
          RÉSERVÉ
        </span>
      );
    default:
      return null;
  }
}

export function StatusDot({ status, className }: StatusBadgeProps) {
  switch (status) {
    case "in_stock":
      return <span className={cn("h-2 w-2 rounded-full bg-green-500", className)} />;
    case "low_stock":
      return <span className={cn("h-2 w-2 rounded-full bg-amber-500", className)} />;
    case "out_of_stock":
      return <span className={cn("h-2 w-2 rounded-full bg-muted-foreground", className)} />;
    case "reserved":
      return <span className={cn("h-2 w-2 rounded-full bg-orange-500", className)} />;
    default:
      return null;
  }
}
