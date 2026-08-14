import { redirect } from 'next/navigation';

export default function AccountDefaultsRoot() {
  redirect('/settings/account-defaults/general');
}
