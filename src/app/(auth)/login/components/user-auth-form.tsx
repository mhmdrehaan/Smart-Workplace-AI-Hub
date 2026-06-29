"use client"

import { HTMLAttributes, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { IconBrandFacebook, IconBrandGithub } from "@tabler/icons-react"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { nofitySubmittedValues } from "@/lib/notify-submitted-values"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/password-input"

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
})

export function UserAuthForm() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("") 

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorMessage("")
    
    // 1. Eksekusi Login Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    
    if (error) {
      setIsLoading(false)
      setErrorMessage(error.message) 
      return
    }
    
    // 2. Jika berhasil, router redirect ke root (dashboard 1)
    router.push("/")
    router.refresh() 
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Enter your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMessage && (
            <div className="text-sm text-red-500 font-medium">
              {errorMessage}
            </div>
          )}
          
          <Button className="w-full mt-2" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
