import { signOut } from "../actions"

export default async function SignOutPage() {
  await signOut()
}
