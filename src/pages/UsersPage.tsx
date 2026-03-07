import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Users, Shield, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles(data ?? []);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleApprove = async (profile: ProfileRow) => {
    const { error } = await supabase.from("profiles").update({ account_status: "approved" }).eq("id", profile.id);
    if (error) { toast.error(error.message); return; }

    // Add member role
    await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "member" });
    toast.success(`${profile.display_name} approved`);
    fetchProfiles();
  };

  const handleReject = async (profile: ProfileRow) => {
    const { error } = await supabase.from("profiles").update({ account_status: "rejected" }).eq("id", profile.id);
    if (error) toast.error(error.message);
    else { toast.success(`${profile.display_name} rejected`); fetchProfiles(); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="status-approved">Approved</span>;
      case "rejected": return <span className="status-rejected">Rejected</span>;
      default: return <span className="status-pending">Pending</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">Approve or reject team member access</p>
      </div>

      <div className="space-y-3">
        {profiles.map((profile) => (
          <div key={profile.id} className="glass-panel p-4 flex items-center justify-between animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{profile.display_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {statusBadge(profile.account_status)}
              {profile.account_status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-success hover:bg-success/10" onClick={() => handleApprove(profile)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleReject(profile)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No users yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
