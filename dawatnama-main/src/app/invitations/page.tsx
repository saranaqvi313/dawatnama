import { redirect } from 'next/navigation'

/** Old address: everything is on "My cards" now. */
export default function Invitations() {
  redirect('/dashboard')
}
