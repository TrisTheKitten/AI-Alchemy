import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "spotify"
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showPercentage = false, size = "md", variant = "default", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  }

  const variantClasses = {
    default: {
      root: "bg-secondary",
      indicator: "bg-primary"
    },
    spotify: {
      root: "bg-gradient-to-r from-[#1DB95420] via-[#1ED76020] to-[#1DB95420]",
      indicator: "bg-gradient-to-r from-[#1DB954] via-[#1ED760] to-[#1DB954] shadow-lg shadow-[#1DB954]/30"
    }
  }

  const currentVariant = variantClasses[variant]
  const progressValue = value || 0

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full transition-all duration-300",
          sizeClasses[size],
          currentVariant.root,
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-700 ease-out relative",
            currentVariant.indicator,
            variant === "spotify" && "animate-pulse"
          )}
          style={{ transform: `translateX(-${100 - progressValue}%)` }}
        >
          {variant === "spotify" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </ProgressPrimitive.Indicator>
      </ProgressPrimitive.Root>
      
      {showPercentage && (
        <div className="flex justify-center mt-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {Math.round(progressValue)}%
          </span>
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
