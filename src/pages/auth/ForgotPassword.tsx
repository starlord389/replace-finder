import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4F2EE] px-4 py-12">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <Card className="border-[#d7c9b1] bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              {sent ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FADC6A]/25">
                    <Mail className="h-6 w-6 text-[#1d1d1d]" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    We&apos;ve sent a reset link to <span className="font-medium text-foreground">{email}</span>. It may take a minute to arrive — check your spam folder if you don&apos;t see it.
                  </p>
                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="mt-6 w-full border-[#d7c9b1] text-[#1d1d1d] hover:bg-[#f0ebe3] hover:text-[#1d1d1d]"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>
                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="focus-visible:ring-[#39484d]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-[#1d1d1d] text-white hover:bg-[#39484d]"
                      disabled={loading}
                    >
                      {loading ? "Sending…" : "Send Reset Link"}
                    </Button>
                  </form>
                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    <Link to="/login" className="font-medium text-[#1d1d1d] hover:underline">
                      Back to Sign In
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
