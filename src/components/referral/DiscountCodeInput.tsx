import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag, CheckCircle, Loader2, X } from "lucide-react";

interface DiscountCodeInputProps {
  planPrice: number;
  onDiscountApplied: (discountAmount: number, code: string, codeOrgId: string) => void;
  onDiscountRemoved: () => void;
  applied: boolean;
  appliedCode: string;
  discountAmount: number;
}

export default function DiscountCodeInput({
  planPrice,
  onDiscountApplied,
  onDiscountRemoved,
  applied,
  appliedCode,
  discountAmount,
}: DiscountCodeInputProps) {
  const { organizationId } = useAuth();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("أدخل كود الخصم");
      return;
    }

    setChecking(true);
    try {
      // Look up the code
      const { data: codeData, error } = await supabase
        .from("referral_codes")
        .select("organization_id, code")
        .eq("code", trimmed)
        .maybeSingle();

      if (error || !codeData) {
        toast.error("كود الخصم غير صحيح");
        setChecking(false);
        return;
      }

      // Can't use own org's code
      if (codeData.organization_id === organizationId) {
        toast.error("لا يمكنك استخدام كود الخصم الخاص بشركتك");
        setChecking(false);
        return;
      }

      // Get user discount percentage
      const { data: pctSetting } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "user_discount_percentage")
        .is("organization_id", null)
        .maybeSingle();

      const userDiscountPct = Number(pctSetting?.setting_value ?? 25);
      const discount = Math.round(planPrice * userDiscountPct / 100);

      onDiscountApplied(discount, trimmed, codeData.organization_id);
      toast.success(`تم تطبيق خصم ${discount.toLocaleString()} جنيه!`);
    } catch {
      toast.error("حدث خطأ أثناء التحقق من الكود");
    }
    setChecking(false);
  };

  if (applied) {
    return (
      <div className="bg-success/5 border border-success/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-success text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>كود الخصم <strong className="font-mono">{appliedCode}</strong> — خصم {discountAmount.toLocaleString()} جنيه</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onDiscountRemoved} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">هل لديك كود خصم؟</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="أدخل كود الخصم"
          dir="ltr"
          className="text-center font-mono tracking-widest text-left"
          maxLength={20}
          onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
        />
        <Button size="sm" onClick={handleApply} disabled={checking} className="gap-1.5 shrink-0">
          {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
          تطبيق
        </Button>
      </div>
    </div>
  );
}
