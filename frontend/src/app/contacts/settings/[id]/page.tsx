import { redirect } from "next/navigation"

export default function ContactsSettingsRedirect({ params }: { params: { id: string } }) {
  redirect(`/contacts/${params.id}/settings`)
}
