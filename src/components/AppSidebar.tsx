import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  Film,
  LayoutDashboard,
  Upload,
  FolderOpen,
  Shield,
  Users,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/moderation", label: "Moderation", icon: Shield },
  { to: "/users", label: "Users", icon: Users },
  { to: "/files", label: "All Files", icon: FolderOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

const memberLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/files", label: "My Files", icon: FolderOpen },
];

export default function AppSidebar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const links = isAdmin ? adminLinks : memberLinks;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-3 p-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-border">
          <Film className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">MediaSync Pro</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {isAdmin ? "Admin" : "Team Member"}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground">{isAdmin ? "Admin" : "Member"}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
