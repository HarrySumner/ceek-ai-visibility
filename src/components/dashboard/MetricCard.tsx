import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  trend?: string;
  status?: 'default' | 'success' | 'warning';
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend,
  status = 'default' 
}: MetricCardProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-bold mt-2 font-mono",
            status === 'success' && "text-success",
            status === 'warning' && "text-warning"
          )}>
            {value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <div className="inline-flex items-center mt-2 text-xs font-medium text-success">
              {trend}
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          status === 'success' && "bg-success/10",
          status === 'warning' && "bg-warning/10",
          status === 'default' && "bg-secondary"
        )}>
          <div className={cn(
            status === 'success' && "text-success",
            status === 'warning' && "text-warning",
            status === 'default' && "text-muted-foreground"
          )}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}