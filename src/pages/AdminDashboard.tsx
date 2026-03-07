import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Users, Clock, CheckCircle, Film } from "lucide-react";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ pendingFiles: 0, pendingUsers: 0, totalFiles: 0, approvedFiles: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      const [files, users] = await Promise.all([
        supabase.from("files").select("status"),
        supabase.from("profiles").select("account_status"),
      ]);
      setStats({
        pendingFiles: files.data?.filter((f) => f.status === "pending").length ?? 0,
        totalFiles: files.data?.length ?? 0,
        approvedFiles: files.data?.filter((f) => f.status === "approved").length ?? 0,
        pendingUsers: users.data?.filter((u) => u.account_status === "pending").length ?? 0,
      });
    };
    fetchStats();
  }, [isAdmin]);

  const cards = [
    { label: "Pending Uploads", value: stats.pendingFiles, icon: Clock, accent: "text-warning" },
    { label: "Pending Users", value: stats.pendingUsers, icon: Users, accent: "text-warning" },
    { label: "Total Files", value: stats.totalFiles, icon: Film, accent: "text-primary" },
    { label: "Approved", value: stats.approvedFiles, icon: CheckCircle, accent: "text-success" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your production workflow</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="glass-panel border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.accent}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
