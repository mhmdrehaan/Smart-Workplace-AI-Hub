"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import SelectDropdown from "@/components/select-dropdown"
import { Task } from "../data/schema"
import { createClient } from "@/lib/supabase"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  status: z.string().min(1, "Please select a status."),

  // 🟢 FIX: Allow empty string "" so UUID validation isn't triggered when empty
  assignee_id: z.string().uuid("Invalid uuid").optional().or(z.literal("")),
  due_date: z.string().optional(),
  workspace_id: z.string().uuid("Invalid uuid").optional().or(z.literal("")),

  // WhatsApp notification fields — optional, used only on task creation
  assignee_name: z.string().optional(),
  assignee_phone: z
    .string()
    .regex(/^\d*$/, "Phone must contain digits only (e.g. 6283804064832)")
    .optional()
    .or(z.literal("")),
})

type TasksForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const isUpdate = !!currentRow
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<TasksForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title:          currentRow?.title          ?? "",
      description:    currentRow?.description    ?? "",
      status:         currentRow?.status         ?? "",
      assignee_id:    currentRow?.assignee_id    ?? "",
      due_date:       currentRow?.due_date       ?? "",
      workspace_id:   currentRow?.workspace_id   ?? "",
      assignee_name:  "",
      assignee_phone: "",
    },
  })

  const onSubmit = async (data: TasksForm) => {
    try {
      if (isUpdate && currentRow) {
        // ── Update existing task (direct Supabase, no WA notification) ──────
        const { error } = await supabase
          .from("tasks")
          .update({
            title:        data.title,
            description:  data.description  || null,
            status:       data.status,
            assignee_id:  data.assignee_id  || null,
            due_date:     data.due_date     || null,
            workspace_id: data.workspace_id || null,
          })
          .eq("id", currentRow.id)

        if (error) throw error

        toast({
          title: "Task updated",
          description: "Task has been updated successfully.",
        })
      } else {
        // ── Create new task via API route (triggers WhatsApp notification) ──
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:          data.title,
            description:    data.description     || null,
            status:         data.status,
            assignee_id:    data.assignee_id     || null,
            due_date:       data.due_date        || null,
            workspace_id:   data.workspace_id    || null,
            // WhatsApp fields — server ignores them if blank
            assignee_name:  data.assignee_name   || null,
            assignee_phone: data.assignee_phone  || null,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result?.error ?? "Failed to create task.")
        }

        // Show different toast depending on whether WA was triggered
        const waTriggered = !!data.assignee_phone
        toast({
          title: "Task created",
          description: waTriggered
            ? "New task created. WhatsApp notification sent to assignee."
            : "New task has been created successfully.",
        })
      }

      onOpenChange(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save task. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{isUpdate ? "Update" : "Create"} Task</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? "Update the task by providing necessary info."
              : "Add a new task by providing necessary info."}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id="tasks-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 space-y-5 overflow-y-auto pr-1"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Status</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select dropdown"
                    items={[
                      { label: "Backlog", value: "Backlog" },
                      { label: "Todo", value: "Todo" },
                      { label: "In Progress", value: "In Progress" },
                      { label: "Done", value: "Done" },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter a description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignee_id"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Assignee ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter assignee ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workspace_id"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Workspace ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter workspace ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ── WhatsApp Notification Section (create only) ── */}
            {!isUpdate && (
              <>
                <div className="relative my-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      WhatsApp Notification (optional)
                    </span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="assignee_name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Assignee Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Rehaan" />
                      </FormControl>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Name shown in the WhatsApp message greeting.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignee_phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>WhatsApp Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 6283804064832" />
                      </FormControl>
                      <p className="text-[0.75rem] text-muted-foreground">
                        Digits only, country code included. Leave blank to skip.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </form>

        </Form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button form="tasks-form" type="submit">
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
