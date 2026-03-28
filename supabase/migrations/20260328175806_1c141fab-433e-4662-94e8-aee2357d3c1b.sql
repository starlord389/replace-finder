UPDATE public.matched_property_access mpa
SET match_result_id = mr.id
FROM public.match_results mr
WHERE mpa.match_result_id IS NULL
  AND mpa.request_id = mr.request_id
  AND mpa.property_id = mr.property_id
  AND mr.status = 'approved';