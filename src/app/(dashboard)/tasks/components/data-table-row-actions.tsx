"use client"

import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { Row } from "@tanstack/react-table"
import { Edit2 } from "lucide-react"
import useDialogState from "@/hooks/use-dialog-state"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Task, taskSchema } from "../data/schema"
import { TasksDetailDialog } from "./tasks-detail-dialog"
import { TasksMutateDrawer } from "./tasks-mutate-drawer"

interface Props {
  row: Row<Task>
}

export function DataTableRowActions({ row }: Props) {
  const task = taskSchema.parse(row.original)

  const [open, setOpen] = useDialogState<"edit" | "detail">(null)

  return (
    <>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={() => setOpen("edit")}>
          <Edit2 />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted flex h-8 w-8 p-0"
            >
              <DotsHorizontalIcon className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => setOpen("detail")}>
              View Detail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setOpen("edit")}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TasksMutateDrawer
        key="task-update"
        open={open === "edit"}
        onOpenChange={() => setOpen("edit")}
        currentRow={task}
      />

      <TasksDetailDialog
        key="task-detail"
        open={open === "detail"}
        onOpenChange={() => setOpen("detail")}
        currentRow={task}
      />
    </>
  )
}
