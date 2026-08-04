import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SMS_MESSAGE_FREQUENCY } from "@/lib/smsCompliance";

type SmsConsentFieldProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  messageDescription: string;
  className?: string;
};

export function SmsConsentField({
  id,
  checked,
  onCheckedChange,
  messageDescription,
  className = "",
}: SmsConsentFieldProps) {
  return (
    <div className={`rounded-xl border border-[#e8edf3] bg-white/70 p-4 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <div className="space-y-2">
          <Label htmlFor={id} className="cursor-pointer text-sm font-medium leading-5">
            I agree to receive recurring automated SMS messages from 1031 Exchange Up about {messageDescription}.
          </Label>
          <p className="text-xs leading-5 text-muted-foreground">
            {SMS_MESSAGE_FREQUENCY} Message and data rates may apply. Reply STOP to opt out or HELP for help.
            Consent is optional and is not a condition of purchase or use of the platform. See our{" "}
            <Link to={ROUTES.terms} className="underline underline-offset-2">Terms &amp; Conditions</Link>
            {" "}and{" "}
            <Link to={ROUTES.privacy} className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

