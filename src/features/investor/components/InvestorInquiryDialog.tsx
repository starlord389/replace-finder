import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useInvestorInquiries } from "@/features/investor/hooks/useInvestorInquiries";
import type { InvestorProperty } from "@/features/investor/types";
import { investorErrorMessage } from "@/features/investor/errorMessage";

export function InvestorInquiryDialog({ property, triggerClassName }: { property: InvestorProperty; triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { create } = useInvestorInquiries();

  useEffect(() => {
    if (open && !message) {
      setMessage(`I'm interested in learning more about ${property.name}. Please send me the available details and next steps.`);
    }
  }, [open, message, property.name]);

  const submit = async () => {
    if (!message.trim()) return;
    try {
      await create.mutateAsync({ propertyId: property.id, listingAgentId: property.agentId, message });
      toast.success("Inquiry sent to the listing agent.");
      setOpen(false);
      setMessage("");
    } catch (error: unknown) {
      toast.error(investorErrorMessage(error, "Could not send your inquiry."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}><MessageCircle className="mr-2 h-4 w-4" />Contact listing agent</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ask about {property.name}</DialogTitle>
          <DialogDescription>Your message goes directly to the agent representing this property.</DialogDescription>
        </DialogHeader>
        <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={7} maxLength={2000} aria-label="Message to listing agent" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!message.trim() || create.isPending}>{create.isPending ? "Sending…" : "Send inquiry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
