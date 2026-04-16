import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const valid = password.length >= 8 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
    }
  };

  const passwordError = password.length > 0 && password.length < 8 ? "Password must be at least 8 characters" : "";
  const confirmError = confirm.length > 0 && password !== confirm ? "Passwords do not match" : "";

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4F2EE] px-4 py-12">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <Card className="border-[#d7c9b1] bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              {done ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FADC6A]/25">
                    <CheckCircle2 className="h-6 w-6 text-[#1d1d1d]" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Password updated</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your password has been updated.
                  </p>
                  <Link to="/login">
                    <Button className="mt-6 w-full bg-[#1d1d1d] text-white hover:bg-[#39484d]">
                      Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground">Set your new password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Choose a new password for your account.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="focus-visible:ring-[#39484d]"
                      />
                      {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="focus-visible:ring-[#39484d]"
                      />
                      {confirmError && <p className="text-sm text-destructive">{confirmError}</p>}
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#1d1d1d] text-white hover:bg-[#39484d]"
                      disabled={!valid || loading}
                    >
                      {loading ? "Updating…" : "Update Password"}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
