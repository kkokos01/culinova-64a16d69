import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface RecipeStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const RecipeStatusBadge: React.FC<RecipeStatusBadgeProps> = ({ 
  status, 
  size = "md",
  showIcon = true 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending Review",
          variant: "default" as const,
          icon: Clock,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        };
      case "flag":
        return {
          label: "Flagged",
          variant: "destructive" as const,
          icon: AlertTriangle,
          className: "bg-red-100 text-red-800 hover:bg-red-200"
        };
      case "pass":
        return {
          label: "Passed QA",
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 hover:bg-green-200"
        };
      case "approved_public":
        return {
          label: "Public",
          variant: "default" as const,
          icon: CheckCircle,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-200"
        };
      case "rejected_public":
        return {
          label: "Rejected",
          variant: "destructive" as const,
          icon: XCircle,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-200"
        };
      default:
        return {
          label: status,
          variant: "default" as const,
          icon: null,
          className: ""
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClasses[size]} ${config.className} flex items-center gap-1`}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

export default RecipeStatusBadge;
