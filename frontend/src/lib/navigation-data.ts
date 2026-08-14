import { 
  LayoutGrid, User, Building2, Handshake, FileText, Package, 
  CheckSquare, StickyNote, Phone, Activity, 
  BarChart3, Headset, ShoppingCart
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
}

export interface NavigationGroup {
  group: string;
  items: NavigationItem[];
  superAdminOnly?: boolean;
}

export const NAVIGATION_DATA: NavigationGroup[] = [
  {
    group: 'Dashboard',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    ]
  },
  {
    group: 'CRM & Sales',
    items: [
      { name: 'Contacts', href: '/contacts', icon: User },
      { name: 'Companies', href: '/companies', icon: Building2 },
      { name: 'Deals', href: '/deals', icon: Handshake },
      { name: 'Documents', href: '/documents', icon: FileText },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Notes', href: '/notes', icon: StickyNote },
    ]
  },
  {
    group: 'Communication',
    items: [
      { name: 'Calls', href: '/calls', icon: Phone },
      { name: 'Activity Feed', href: '/activity-feed', icon: Activity },
    ]
  },
  {
    group: 'Commerce',
    items: [
      { name: 'Orders', href: '/orders', icon: ShoppingCart },
    ]
  },
  {
    group: 'Service',
    items: [
      { name: 'Tickets', href: '/tickets', icon: Headset },
    ]
  },
  {
    group: 'Reporting',
    items: [
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ]
  }
];
