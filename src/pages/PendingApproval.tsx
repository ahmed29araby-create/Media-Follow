import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

export default function PendingApproval() {
  const { signOut, accountStatus } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-panel max-w-md p-8 text-center animate-slide-in">
        {accountStatus === "rejected" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Clock className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account request has been rejected. Contact your administrator for details.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-7 w-7 text-warning animate-pulse-glow" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Pending Approval</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your account is awaiting admin approval. You'll gain access once approved.
            </p>
          </>
        )}
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
