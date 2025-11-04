import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, LogOut, MessageCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsDialog } from "./SettingsDialog";
import { useAuthStore } from "@/stores/useAuthStore";

export const Navbar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { authUser, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-6 py-3 bg-card/50 backdrop-blur-md shadow-sm border-b border-border"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageCircle className="text-primary-foreground h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-foreground">
              Chat<span className="text-primary">ty</span>
            </h1>
            <p className="text-xs text-muted-foreground">Real-time messaging</p>
          </div>
        </Link>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 px-2 hover:bg-muted">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={authUser?.profilePic} alt={authUser?.fullname} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
                    {authUser?.fullname ? getInitials(authUser.fullname) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground hidden sm:inline max-w-[100px] truncate">
                  {authUser?.fullname?.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-card border-border shadow-lg"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="font-medium text-foreground text-sm">{authUser?.fullname}</p>
                <p className="text-xs text-muted-foreground truncate">{authUser?.email}</p>
              </div>
              
              <Link to="/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              
              <Link to="/themes">
                <DropdownMenuItem className="cursor-pointer">
                  <Palette className="mr-2 h-4 w-4 text-secondary" />
                  <span>Themes</span>
                </DropdownMenuItem>
              </Link>
              
              <DropdownMenuItem 
                onClick={() => setSettingsOpen(true)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};