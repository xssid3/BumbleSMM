import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Zap,
  LayoutDashboard,
  ShoppingCart,
  History,
  Wallet,
  Settings,
  Users,
  LayoutGrid,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path?: string; // Legacy support if needed, preferring href
  href?: string;
  separator?: boolean;
}

const userNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'New Order', href: '/dashboard/new-order' },
  { icon: History, label: 'Order History', href: '/dashboard/orders' },
  { icon: Wallet, label: 'Add Funds', href: '/dashboard/add-funds' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },

  // Admin Links
  { icon: Users, label: 'Admin Users', href: '/admin/users', separator: true },
  { icon: LayoutGrid, label: 'Admin Services', href: '/admin/services' },
  { icon: ShoppingCart, label: 'Admin Orders', href: '/admin/orders' },
];

export default function DashboardLayout({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { isAdmin } = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-card border-r border-border z-40 transition-all duration-300 flex flex-col',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg gradient-text">SMM Panel</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Balance */}
        {/* Balance - Only show for non-admin paths */}
        {!collapsed && !location.pathname.startsWith('/admin') && (
          <div className="p-4 border-b border-border">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-2xl font-bold text-primary">
                ${Number(profile?.balance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {(() => {
            const isAdminPath = location.pathname.startsWith('/admin');

            // Define item sets
            const userItems: NavItem[] = [
              { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
              { icon: History, label: 'Order History', href: '/dashboard/orders' },
              { icon: Wallet, label: 'Add Funds', href: '/dashboard/add-funds' },
              { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
            ];

            const adminItems: NavItem[] = [
              { icon: LayoutGrid, label: 'Services', href: '/admin' },
              { icon: Users, label: 'Users', href: '/admin/users' },
              { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
              { icon: LayoutDashboard, label: 'Back to User Panel', href: '/dashboard', separator: true },
            ];

            // STRICT Separation Logic
            let itemsToShow: NavItem[] = [];

            if (isAdminPath) {
              // We are in /admin, show ONLY admin items
              itemsToShow = adminItems;
            } else {
              // We are in /dashboard (User Panel)
              itemsToShow = userItems;
            }

            return itemsToShow.map((item) => {
              const targetPath = item.href || '#';
              const isActive = location.pathname === targetPath || (targetPath === '/admin' && location.pathname === '/admin/services');

              // Use 'Shield' icon for Admin Panel explicitly if needed, but we define it in the array
              const Icon = item.icon || Zap;

              return (
                <div key={targetPath}>
                  {item.separator && !collapsed && (
                    <div className="h-px bg-border/50 my-2 mx-4" />
                  )}
                  {item.separator && collapsed && (
                    <div className="h-px bg-border/50 my-2 mx-auto w-8" />
                  )}
                  <Link
                    to={targetPath}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </Link>
                </div>
              );
            });
          })()}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              'w-full justify-start text-muted-foreground hover:text-destructive',
              collapsed && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          collapsed ? 'ml-20' : 'ml-64'
        )}
      >
        {children}
      </main>
    </div>
  );
}
