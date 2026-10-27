import { redirect } from 'next/navigation'

// Codes are no longer used; old links land on the normal sign-in page.
export default function Verify() {
  redirect('/login')
}
