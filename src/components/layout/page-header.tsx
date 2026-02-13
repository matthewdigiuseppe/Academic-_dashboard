import { Button } from "@/components/ui/button";
import { LucideIcon, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actionLabel, onAction, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/30">
            <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="md">
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
