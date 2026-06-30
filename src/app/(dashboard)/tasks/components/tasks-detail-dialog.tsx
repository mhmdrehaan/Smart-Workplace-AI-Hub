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
              <span className="text-sm">Due: {currentRow.due_date}</span>
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
