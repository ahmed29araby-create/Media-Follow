import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Percent, Clock, Gift } from "lucide-react";

export default function ReferralSettings() {
  const [percentage, setPercentage] = useState("50");
  const [expiryMonths, setExpiryMonths] = useState("6");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("admin_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["referral_percentage", "credit_expiry_months"])
      .is("organization_id", null)
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            if (row.setting_key === "referral_percentage") setPercentage(row.setting_value);
            if (row.setting_key === "credit_expiry_months") setExpiryMonths(row.setting_value);
          }
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    const pct = Number(percentage);
    const months = Number(expiryMonths);
    if (isNaN(pct) || pct < 1 || pct > 100) { toast.error("النسبة يجب أن تكون بين 1 و 100"); return; }
    if (isNaN(months) || months < 1) { toast.error("مدة الصلاحية يجب أن تكون شهر واحد على الأقل"); return; }

    setSaving(true);
    const results = await Promise.all([
      supabase.from("admin_settings").upsert(
        { setting_key: "referral_percentage", setting_value: String(pct), organization_id: null },
        { onConflict: "setting_key" }
      ),
      supabase.from("admin_settings").upsert(
        { setting_key: "credit_expiry_months", setting_value: String(months), organization_id: null },
        { onConflict: "setting_key" }
      ),
    ]);

    if (results.some(r => r.error)) toast.error("حدث خطأ أثناء الحفظ");
    else toast.success("تم حفظ إعدادات الإحالة");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Gift className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">إعدادات نظام الإحالة</h2>
          <p className="text-xs text-muted-foreground">التحكم في نسبة الخصم ومدة صلاحية الرصيد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            نسبة الخصم للمُحيل (%)
          </Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={percentage}
            onChange={e => setPercentage(e.target.value)}
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">النسبة من قيمة اشتراك الشخص المُحال</p>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            مدة صلاحية الرصيد (شهور)
          </Label>
          <Input
            type="number"
            min={1}
            value={expiryMonths}
            onChange={e => setExpiryMonths(e.target.value)}
            dir="ltr"
            className="text-left"
          />
          <p className="text-xs text-muted-foreground">بعد هذه المدة ينتهي الرصيد غير المُستخدم</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        حفظ الإعدادات
      </Button>
    </div>
  );
}
