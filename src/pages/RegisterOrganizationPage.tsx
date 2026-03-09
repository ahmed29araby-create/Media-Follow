import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Zap, ArrowRight, CheckCircle } from "lucide-react";

export default function RegisterOrganizationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    org_name: "",
    org_email: "",
    admin_password: "",
    referral_code: searchParams.get("ref") || "",
    whatsapp_phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.admin_password.length < 12) {
      toast.error("كلمة المرور يجب أن تكون 12 حرف على الأقل");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.functions.invoke("submit-organization-request", {
      body: {
        org_name: form.org_name.trim(),
        org_email: form.org_email.trim().toLowerCase(),
        admin_password: form.admin_password,
        referral_code: form.referral_code.trim() || undefined,
        whatsapp_phone: form.whatsapp_phone.trim() || undefined,
      },
    });

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "حدث خطأ أثناء إرسال الطلب");
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative glass-panel w-full max-w-md p-8 text-center space-y-6 animate-slide-in" dir="rtl">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">تم إرسال طلبك بنجاح!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            طلب إنشاء الشركة قيد المراجعة. سيتم تفعيل حسابك بعد الموافقة من إدارة المنصة.
          </p>
          {form.whatsapp_phone && (
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
              سنتواصل معك عبر WhatsApp على الرقم المُدخل عند تفعيل الشركة.
            </p>
          )}
          <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            العودة لتسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative glass-panel w-full max-w-md p-8 animate-slide-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 glow-border">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Media Follow</h1>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">Production Platform</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-1" dir="rtl">إنشاء شركة جديدة</h2>
        <p className="text-sm text-muted-foreground mb-6" dir="rtl">أدخل بيانات الشركة لتقديم طلب الانضمام</p>

        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          <div className="space-y-2">
            <Label htmlFor="org_name">اسم الشركة</Label>
            <Input
              id="org_name"
              value={form.org_name}
              onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))}
              placeholder="Star Media"
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_email">البريد الإلكتروني</Label>
            <Input
              id="org_email"
              type="email"
              value={form.org_email}
              onChange={e => setForm(f => ({ ...f, org_email: e.target.value }))}
              placeholder="info@company.com"
              required
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_password">كلمة المرور (12 حرف على الأقل)</Label>
            <div className="relative">
              <Input
                id="admin_password"
                type={showPassword ? "text" : "password"}
                value={form.admin_password}
                onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
                placeholder="••••••••••••"
                required
                minLength={12}
                dir="ltr"
                className="text-left pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referral_code">كود الإحالة (اختياري)</Label>
            <Input
              id="referral_code"
              value={form.referral_code}
              onChange={e => setForm(f => ({ ...f, referral_code: e.target.value }))}
              placeholder="كود الإحالة إن وُجد"
              dir="ltr"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp_phone">رقم WhatsApp للتواصل (اختياري)</Label>
            <Input
              id="whatsapp_phone"
              type="tel"
              value={form.whatsapp_phone}
              onChange={e => setForm(f => ({ ...f, whatsapp_phone: e.target.value }))}
              placeholder="+966 5xx xxx xxxx"
              dir="ltr"
              className="text-left"
            />
            <p className="text-xs text-muted-foreground">سنتواصل معك عبر هذا الرقم عند تفعيل الشركة</p>
          </div>

          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            إرسال الطلب
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-primary hover:underline w-full text-center"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}
