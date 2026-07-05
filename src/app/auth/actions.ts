"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

/**
 * Sign up a new user with email and password
 * @param formData - Form data containing email and password
 */
export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // If email confirmation is enabled, user needs to confirm email
  if (data.user && !data.session) {
    return {
      success: true,
      message: "Registration successful! Please check your email to confirm your account.",
    }
  }

  // Auto-sign in if email confirmation is disabled
  revalidatePath("/", "layout")
  redirect("/")
}

/**
 * Sign in with email and password
 * @param formData - Form data containing email and password
 */
export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/login")
}

/**
 * Send password reset email
 * @param formData - Form data containing email
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string

  // Get the current origin to construct the redirect URL
  const headersList = await headers()
  const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: true,
    message: "Password reset email sent! Please check your inbox.",
  }
}

/**
 * Update user password (after reset)
 * @param formData - Form data containing new password
 */
export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get("password") as string

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  redirect("/login")
}
