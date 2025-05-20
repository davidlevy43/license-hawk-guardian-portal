
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Database, 
  Settings, 
  Users, 
  BarChart, 
  Calendar, 
  Mail, 
  LogOut, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: BarChart,
      allowedRoles: ["admin", "user"]
    },
    {
      name: "Licenses",
      href: "/licenses",
      icon: Database,
      allowedRoles: ["admin", "user"]
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
      allowedRoles: ["admin", "user"]
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Mail,
      allowedRoles: ["admin"]
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      allowedRoles: ["admin"]
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      allowedRoles: ["admin", "user"]
    }
  ];

  return (
    <div
      className={cn(
        "bg-sidebar text-sidebar-foreground relative flex flex-col h-full transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center", collapsed && "justify-center w-full")}>
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">
            LM
          </div>
          {!collapsed && <span className="ml-2 font-bold text-lg">License Manager</span>}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground p-1 rounded hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex flex-col flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            // Only show items allowed for user's role
            if (isAdmin || item.allowedRoles.includes("user")) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")} size={20} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            }
            return null;
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={logout}
          className={cn(
            "flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className={collapsed ? "mx-auto" : "mr-3"} size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
