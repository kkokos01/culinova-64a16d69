import * as React from "react"
import { cn } from "@/lib/utils"

interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    description?: string
  }>
  size?: "sm" | "md" | "lg"
}

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ className, value, onValueChange, options, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex rounded-lg bg-muted p-1 text-muted-foreground",
          {
            "p-0.5 text-xs": size === "sm",
            "p-1 text-sm": size === "md",
            "p-1.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {options.map((option) => {
          const isActive = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onValueChange(option.value)}
              className={cn(
                "relative inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                  "px-2 py-1": size === "sm",
                  "px-3 py-1.5": size === "md",
                  "px-4 py-2": size === "lg",
                },
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    )
  }
)
SegmentedControl.displayName = "SegmentedControl"

export { SegmentedControl }
