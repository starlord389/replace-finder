
-- property_financials
CREATE POLICY "Agents can manage own property financials"
ON public.property_financials FOR ALL TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()));

CREATE POLICY "Auth users can read active property financials"
ON public.property_financials FOR SELECT TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE status = 'active'));

CREATE POLICY "Admins can manage all financials"
ON public.property_financials FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- property_images
CREATE POLICY "Agents can manage own property images"
ON public.property_images FOR ALL TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()));

CREATE POLICY "Auth users can read active property images"
ON public.property_images FOR SELECT TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE status = 'active'));

CREATE POLICY "Admins can manage all images"
ON public.property_images FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- property_documents
CREATE POLICY "Agents can manage own property documents"
ON public.property_documents FOR ALL TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()))
WITH CHECK (property_id IN (SELECT id FROM public.pledged_properties WHERE agent_id = auth.uid()));

CREATE POLICY "Auth users can read active property documents"
ON public.property_documents FOR SELECT TO authenticated
USING (property_id IN (SELECT id FROM public.pledged_properties WHERE status = 'active'));

CREATE POLICY "Admins can manage all documents"
ON public.property_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
