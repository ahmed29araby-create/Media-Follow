import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle } from "lucide-react";

interface UseCreditsSectionProps {
  planPrice: number;
  onCreditApplied: (creditAmount: number, creditIds: string[]) => void;
  onCreditRemoved: () => void;
  applied: boolean;
}

interface Credit {
  id: string;
  remaining: number;
  expires_at: string;
}

export default function UseCreditsSection({ planPrice, onCreditApplied, onCreditRemoved, applied }: UseCreditsSectionProps) {
  const { organizationId } = useAuth();
  const [credits, setCredits] = useState<Credit[]>([]);
  const [totalAvailable, setTotalAvailable] = useState(0);

  useEffect(() => {
    if (!organizationId) return;
    supabase
      .from("referral_credits")
      .select("id, remaining, expires_at")
      .eq("organization_id", organizationId)
      .gt("remaining", 0)
      .then(({ data }) => {
        const now = new Date();
        const active = (data ?? []).filter(c => new Date(c.expires_at) > now).sort((a, b) => 
          new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
        );
        setCredits(active);
        setTotalAvailable(active.reduce((sum, c) => sum + Number(c.remaining), 0));
      });
  }, [organizationId]);

  if (totalAvailable <= 0) return null;

  const discount = Math.min(totalAvailable, planPrice);

  const handleApply = () => {
    // Calculate which credits to use (FIFO by expiry)
    let remaining = discount;
    const usedIds: string[] = [];
    for (const c of credits) {
      if (remaining <= 0) break;
      usedIds.push(c.id);
      remaining -= Number(c.remaining);
    }
    onCreditApplied(discount, usedIds);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">رصيد الإحالة</span>
        </div>
        <Badge variant="outline" className="text-primary border-primary/30">
          {totalAvailable.toLocaleString()} جنيه متاح
        </Badge>
      </div>

      {applied ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>تم تطبيق خصم {discount.toLocaleString()} جنيه</span>
          </div>
          <Button size="sm" variant="outline" onClick={onCreditRemoved}>
            إلغاء الخصم
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {discount >= planPrice 
              ? "رصيدك يغطي سعر الباقة بالكامل!" 
              : `يمكنك خصم ${discount.toLocaleString()} جنيه — تدفع ${(planPrice - discount).toLocaleString()} جنيه فقط`
            }
          </p>
          <Button size="sm" onClick={handleApply} className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            استخدام الرصيد
          </Button>
        </div>
      )}
    </div>
  );
}
