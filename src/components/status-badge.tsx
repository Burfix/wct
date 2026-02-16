import { Badge } from "@/components/ui/badge";
import { ComplianceStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ComplianceStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = {
    GREEN: {
      label: "Compliant",
      variant: "success" as const,
      color: "bg-green-500",
    },
    ORANGE: {
      label: "Expiring Soon",
      variant: "warning" as const,
      color: "bg-orange-500",
    },
    RED: {
      label: "Non-Compliant",
      variant: "error" as const,
      color: "bg-red-500",
    },
    GREY: {
      label: "N/A",
      variant: "secondary" as const,
      color: "bg-gray-400",
    },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

export function StatusDot({ status }: { status: ComplianceStatus }) {
  const colors = {
    GREEN: "bg-green-500",
    ORANGE: "bg-orange-500",
    RED: "bg-red-500",
    GREY: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        colors[status]
      )}
    />
  );
}
