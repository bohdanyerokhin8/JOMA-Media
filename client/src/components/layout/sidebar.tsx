import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  User, 
  DollarSign, 
  Briefcase, 
  Users, 
  FileText,
  Settings, 
  LogOut,
  Menu,
  X,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const isInfluencer = user?.role === 'influencer';
  const isAdmin = user?.role === 'admin';

  const influencerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Profile Settings', icon: User },
    { href: '/payments', label: 'Payment Requests', icon: DollarSign },
    { href: '/jobs', label: 'Job Tracking', icon: Briefcase },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: Shield },
    { href: '/admin/influencers', label: 'Manage Influencers', icon: Users },
    { href: '/admin/payments', label: 'Payment Reviews', icon: FileText },
    { href: '/admin/campaigns', label: 'Campaign Management', icon: Briefcase },
    { href: '/admin/invites', label: 'Admin Invites', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : influencerNavItems;

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
              <Users className="text-white h-4 w-4" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">JOMA Media</h2>
              <p className="text-xs text-gray-600">
                {isAdmin ? 'Admin Panel' : 'Influencer Hub'}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                isActive 
                  ? "bg-primary text-white" 
                  : "hover:bg-gray-100 text-gray-700"
              )}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className={cn(
          "flex items-center space-x-3 mb-4",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || ''} />
            <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {!isCollapsed && (
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          )}
          <Button 
            variant="ghost" 
            className={cn(
              "w-full",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}