
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { User, Bell } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const TopBar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { notifications, count } = useNotifications();
  const navigate = useNavigate();
  
  const handleViewAllNotifications = () => {
    navigate("/licenses");
  };

  return (
    <header className="bg-background border-b border-border h-16 flex items-center px-4 md:px-6">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-foreground">License Manager</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0">
                  {count > 99 ? '99+' : count}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {notifications.length === 0 ? (
              <DropdownMenuItem disabled className="text-center py-4">
                <span className="text-muted-foreground">No notifications</span>
              </DropdownMenuItem>
            ) : (
              <>
                {notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="cursor-pointer">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{notification.title}</span>
                        {notification.type === 'error' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                        {notification.type === 'warning' && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {notification.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
                
                {notifications.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-center text-sm text-muted-foreground">
                      +{notifications.length - 5} more notifications
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-center text-primary"
                  onClick={handleViewAllNotifications}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2">
              <span className="hidden md:inline-block">{currentUser?.username}</span>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <User size={18} />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TopBar;
