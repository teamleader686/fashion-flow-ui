import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationBell from '@/components/notifications/NotificationBell';
import StorageHeaderAlert from '@/components/admin/storage/StorageHeaderAlert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Tag,
  Gift,
  Wallet,
  Star,
  TrendingUp,
  Menu,
  Instagram,
  Search,
  Bell,
  ChevronLeft,
  Truck,
  X,
  XCircle,
  FolderTree,
  Database,
  Heart,
  FileText,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type AdminLayoutProps = {
  children: ReactNode;
};

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: FolderTree, label: 'Categories', path: '/admin/categories' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: XCircle, label: 'Cancellations', path: '/admin/cancellation-requests' },
  { icon: Truck, label: 'Shipping', path: '/admin/shipping' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Instagram, label: 'Instagram', path: '/admin/instagram-marketing' },
  { icon: TrendingUp, label: 'Affiliates', path: '/admin/affiliate-marketing' },
  { icon: Tag, label: 'Coupons', path: '/admin/coupons' },
  { icon: Gift, label: 'Offers', path: '/admin/offers' },
  { icon: Star, label: 'Reviews', path: '/admin/reviews' },
  { icon: Wallet, label: 'Wallet & Loyalty', path: '/admin/wallet' },
  { icon: Heart, label: 'Wishlist', path: '/admin/wishlist' },
  { icon: Database, label: 'Store Management', path: '/admin/store' },
  { icon: FileText, label: 'Pages', path: '/admin/content/pages' },
  { icon: HelpCircle, label: 'FAQs', path: '/admin/content/faq' },
  { icon: MessageSquare, label: 'Contact Msgs', path: '/admin/content/contact' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const SidebarNav = ({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const location = useLocation();

  return (
    <nav className="px-3 py-4 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const initials = profile?.full_name
    ? profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'AD';

  // Current page title
  const currentPage =
    menuItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
    )?.label || 'Admin';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ──── DESKTOP / TABLET SIDEBAR ──── */}
      {!isMobile && (
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 flex flex-col',
            sidebarCollapsed ? 'w-[72px]' : 'w-60'
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            {!sidebarCollapsed && (
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">SB</span>
                </div>
                <span className="font-display text-lg font-bold tracking-tight">StyleBazaar</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={sidebarCollapsed} />
          </div>

          {/* Footer */}
          <div className="border-t p-3 shrink-0">
            <Button
              variant="ghost"
              className={cn(
                'w-full text-destructive hover:text-destructive hover:bg-destructive/10',
                sidebarCollapsed ? 'justify-center px-2' : 'justify-start'
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span className="ml-3">Logout</span>}
            </Button>
          </div>
        </aside>
      )}

      {/* ──── MOBILE SIDEBAR (Sheet) ──── */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation menu for mobile devices</SheetDescription>
            </VisuallyHidden>
            <div className="flex h-16 items-center justify-between border-b px-4 shrink-0">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">SB</span>
                </div>
                <span className="font-display text-lg font-bold tracking-tight">StyleBazaar</span>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="border-t p-3 shrink-0">
              <div className="mb-3 px-3">
                <p className="text-sm font-medium">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ──── MAIN AREA ──── */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          !isMobile && (sidebarCollapsed ? 'ml-[72px]' : 'ml-60')
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:px-6">
          {/* Mobile hamburger */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Page title */}
          <h1 className="text-lg font-semibold lg:text-xl">{currentPage}</h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search (desktop) */}
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-9 h-9 bg-muted/50" />
          </div>

          {/* Storage alert (shows only when storage >= 80%) */}
          <StorageHeaderAlert />

          {/* Notification bell */}
          <NotificationBell role="admin" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">
                  {profile?.full_name || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
