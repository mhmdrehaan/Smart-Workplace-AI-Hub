"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { statuses } from "../data/data"
import { Task } from "../data/schema"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Task
}

/**
 * Formats a raw database date string (e.g. "2026-07-15T00:00:00+00:00")
 * into a readable calendar day like "Wednesday, July 15, 2026".
 *
 * Strategy: slice the first 10 chars to get "YYYY-MM-DD", then parse that
 * clean string so `new Date()` never shifts the day due to UTC offset.
 * Falls back to the raw string if the input can't be parsed.
 */
function formatDueDate(raw: string): string {
  // Extract the date-only portion to avoid timezone shifting
  const dateOnly = raw.trim().slice(0, 10)

  // Basic sanity check: must look like YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return raw

  // Append T12:00:00 (local noon) so Date() never wraps to the previous day
  // regardless of the user's local timezone
  const d = new Date(`${dateOnly}T12:00:00`)
  if (isNaN(d.getTime())) return raw

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function TasksDetailDialog({ open, onOpenChange, currentRow }: Props) {
  const status = statuses.find((status) => status.value === currentRow.status)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-96">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            {currentRow.id}
          </DialogTitle>
          <DialogDescription>{currentRow.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {status && status.icon && (
            <div className="text-muted-foreground flex items-center gap-0.5">
              <status.icon className="mr-2 size-6" />
              <span className="text-sm font-semibold">{status?.label}</span>
            </div>
          )}
          {currentRow.description && (
            <div className="text-muted-foreground">
              <span className="text-sm">{currentRow.description}</span>
            </div>
          )}
          {currentRow.due_date && (
            <div className="text-muted-foreground">
              <span className="text-sm">
                Due: {formatDueDate(currentRow.due_date)}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
