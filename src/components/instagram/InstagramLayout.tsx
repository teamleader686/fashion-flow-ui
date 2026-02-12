import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileImage,
  Award,
  History,
  User,
  LogOut,
  Menu,
  Instagram,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { InstagramUser } from '@/lib/supabase';

type InstagramLayoutProps = {
  children: ReactNode;
  user: InstagramUser;
};

const InstagramLayout = ({ children, user }: InstagramLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/instagram-login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/instagram-dashboard' },
    { icon: FileImage, label: 'Active Stories', path: '/instagram-dashboard#stories' },
    { icon: Award, label: 'My Coins', path: '/instagram-dashboard#coins' },
    { icon: History, label: 'History', path: '/instagram-dashboard#history' },
    { icon: User, label: 'Profile', path: '/instagram-dashboard#profile' },
  ];

  const closeMobileSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Instagram className="w-6 h-6 text-pink-600" />
              <h1 className="text-lg font-bold">Instagram</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 z-40 h-screen transition-transform bg-white border-r border-gray-200 shadow-lg',
          isMobile ? 'top-0' : 'top-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarOpen && !isMobile ? 'w-64' : 'w-64',
          !sidebarOpen && !isMobile && 'w-20 translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-purple-600">
            {(sidebarOpen || isMobile) && (
              <div className="flex items-center gap-2">
                <Instagram className="w-6 h-6 text-white" />
                <h1 className="text-lg font-bold text-white">
                  Instagram
                </h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/20"
            >
              {isMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* User Info */}
          {(sidebarOpen || isMobile) && (
            <div className="p-4 border-b bg-gradient-to-br from-pink-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.instagram_username}</p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-yellow-800">Total Coins</span>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-600">{user.total_coins}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                              (item.path.includes('#') && location.hash === item.path.split('#')[1]);
              return (
                <Link key={item.path} to={item.path} onClick={closeMobileSidebar}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      !sidebarOpen && !isMobile && 'justify-center px-2',
                      isActive && 'bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {(sidebarOpen || isMobile) && <span className="ml-3">{item.label}</span>}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {(sidebarOpen || isMobile) && <span className="ml-3">Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'transition-all min-h-screen',
          isMobile ? 'pt-16' : '',
          !isMobile && sidebarOpen ? 'ml-64' : '',
          !isMobile && !sidebarOpen ? 'ml-20' : ''
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default InstagramLayout;
