import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Clock, CheckCircle, XCircle } from "lucide-react";

export default function MemberDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data } = await supabase.from("files").select("status").eq("user_id", user.id);
      setStats({
        pending: data?.filter((f) => f.status === "pending").length ?? 0,
        approved: data?.filter((f) => f.status === "approved").length ?? 0,
        rejected: data?.filter((f) => f.status === "rejected").length ?? 0,
        total: data?.length ?? 0,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { label: "Total Uploads", value: stats.total, icon: Upload, accent: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, accent: "text-warning" },
    { label: "Approved", value: stats.approved, icon: CheckCircle, accent: "text-success" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, accent: "text-destructive" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your upload activity overview</p>
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
