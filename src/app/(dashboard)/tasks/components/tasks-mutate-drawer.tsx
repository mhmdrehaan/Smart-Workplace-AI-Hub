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
  
  // 🟢 FIX: Mengizinkan string kosong "" agar tidak memicu eror UUID saat dikosongkan
  assignee_id: z.string().uuid("Invalid uuid").optional().or(z.literal("")),
  due_date: z.string().optional(),
  workspace_id: z.string().uuid("Invalid uuid").optional().or(z.literal("")),
})


type TasksForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const isUpdate = !!currentRow
  const router = useRouter()
  const supabase = createClient()

 const form = useForm<TasksForm>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    title: currentRow?.title ?? "",
    description: currentRow?.description ?? "",
    status: currentRow?.status ?? "",
    assignee_id: currentRow?.assignee_id ?? "",
    due_date: currentRow?.due_date ?? "",
    workspace_id: currentRow?.workspace_id ?? "",
  },
})

  const onSubmit = async (data: TasksForm) => {
    try {
      if (isUpdate && currentRow) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            title: data.title,
            description: data.description || null,
            status: data.status,
            assignee_id: data.assignee_id || null,
            due_date: data.due_date || null,
            workspace_id: data.workspace_id || null,
          })
          .eq("id", currentRow.id)

        if (error) {
          throw error
        }

      toast({
      title: isUpdate ? "Task updated" : "Task created",
      description: isUpdate 
        ? "Task has been updated successfully." 
        : "New task has been created successfully.",
    })
      } else {
        // Create new task
        const { error } = await supabase.from("tasks").insert({
          title: data.title,
          description: data.description || null,
          status: data.status,
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
          workspace_id: data.workspace_id || null,
        })

        if (error) {
          throw error
        }

        toast({
          title: "Task created",
          description: "New task has been created successfully.",
        })
      }

      onOpenChange(false)
      form.reset()
      router.refresh()
    } catch (error) {
      console.error("Error saving task:", error)
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
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
            className="flex-1 space-y-5"
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
