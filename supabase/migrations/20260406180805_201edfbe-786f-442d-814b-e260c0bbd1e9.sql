
CREATE POLICY "Admins can manage referrals"
ON public.referrals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can read assigned referrals"
ON public.referrals FOR SELECT TO authenticated
USING (assigned_agent_id = auth.uid());

CREATE POLICY "Anyone can create referral"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (true);
