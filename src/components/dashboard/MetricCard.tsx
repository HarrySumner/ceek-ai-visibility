import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: MetricCardProps) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-bold mt-2 font-mono",
            variant === 'primary' && "text-gradient",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center mt-2 text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">vs last run</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          variant === 'primary' && "bg-primary/20",
          variant === 'success' && "bg-success/20",
          variant === 'warning' && "bg-warning/20",
          variant === 'default' && "bg-secondary"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            variant === 'primary' && "text-primary",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning",
            variant === 'default' && "text-muted-foreground"
          )} />
        </div>
      </div>
    </div>
  );
}
