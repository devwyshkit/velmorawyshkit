import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: string
  status?: "completed" | "current" | "pending"
  icon?: React.ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex items-start group">
          {/* Timeline line */}
          {index !== items.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-full bg-border group-last:hidden" />
          )}
          
          {/* Timeline node */}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
              {
                "border-primary bg-primary text-primary-foreground": item.status === "completed",
                "border-primary bg-background text-primary": item.status === "current",
                "border-muted-foreground bg-background text-muted-foreground": item.status === "pending"
              }
            )}
          >
            {item.icon || (
              <div
                className={cn("h-2 w-2 rounded-full", {
                  "bg-primary-foreground": item.status === "completed",
                  "bg-primary": item.status === "current",
                  "bg-muted-foreground": item.status === "pending"
                })}
              />
            )}
          </div>

          {/* Content */}
          <div className="ml-4 min-h-8 flex flex-col justify-center pb-8 last:pb-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium leading-none">{item.title}</h4>
              <span className="text-xs text-muted-foreground">{item.timestamp}</span>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TimelineVertical({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2",
                {
                  "border-primary bg-primary text-primary-foreground": item.status === "completed",
                  "border-primary bg-background text-primary": item.status === "current",
                  "border-muted-foreground bg-background text-muted-foreground": item.status === "pending"
                }
              )}
            >
              {item.icon || (
                <div
                  className={cn("h-3 w-3 rounded-full", {
                    "bg-primary-foreground": item.status === "completed",
                    "bg-primary": item.status === "current",
                    "bg-muted-foreground": item.status === "pending"
                  })}
                />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{item.title}</h4>
                <span className="text-xs text-muted-foreground">{item.timestamp}</span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </div>
          {index !== items.length - 1 && (
            <div className="ml-5 mt-2 h-6 w-0.5 bg-border" />
          )}
        </div>
      ))}
    </div>
  )
}