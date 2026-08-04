import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SmsConsentField } from "@/components/compliance/SmsConsentField";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type SmsPreferencesCardProps = {
  phone: string;
  messageDescription: string;
};

export function SmsPreferencesCard({ phone, messageDescription }: SmsPreferencesCardProps) {
  const { user } = useAuth();
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("sms_subscriptions")
      .select("consented")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.warn("SMS preference load failed", error.message);
        setConsented(data?.consented ?? false);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function changeConsent(next: boolean) {
    if (saving || loading) return;
    if (!phone.trim()) {
      toast.error("Add and save a mobile phone number before enabling text messages.");
      return;
    }

    const previous = consented;
    setConsented(next);
    setSaving(true);
    const { error } = await supabase.rpc("set_my_sms_consent", {
      p_consented: next,
      p_phone: phone.trim(),
    });
    setSaving(false);

    if (error) {
      setConsented(previous);
      toast.error("We couldn't update your text-message preference.");
      return;
    }

    toast.success(next ? "Text messages enabled." : "Text messages disabled.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="h-4 w-4" /> Text Messages
        </CardTitle>
        <CardDescription>
          Control optional SMS messages separately from your account phone number.
        </CardDescription>
      </CardHeader>
      <CardContent className={saving || loading ? "pointer-events-none opacity-60" : ""}>
        <SmsConsentField
          id="accountSmsConsent"
          checked={consented}
          onCheckedChange={changeConsent}
          messageDescription={messageDescription}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Current mobile number: {phone.trim() || "No mobile number saved"}
        </p>
      </CardContent>
    </Card>
  );
}
