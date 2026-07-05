"use client"

import { HTMLAttributes, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { resetPassword } from "@/app/auth/actions"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
})

export function ForgotPasswordForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")
    
    const formData = new FormData()
    formData.append("email", data.email)
    
    const result = await resetPassword(formData)
    
    setIsLoading(false)
    
    if (result?.error) {
      setErrorMessage(result.error)
      return
    }
    
    if (result?.success) {
      setSuccessMessage(result.message)
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="mt-2" disabled={isLoading}>
              {isLoading ? "Sending..." : "Continue"}
            </Button>
            {errorMessage && (
              <div className="text-sm text-red-500 font-medium">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="text-sm text-green-500 font-medium">
                {successMessage}
              </div>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
