-- Readable PDF copies were uploaded and checksum-verified before updating links.
-- Original objects remain available for older links.
update public.resources r set url = files.url
from (values
  ('d3c2d031-4255-445b-b76a-e50bbe297216'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/Code-of-Conduct.pdf'),
  ('919e41cb-72be-418d-ab83-261b9f1f0ec9'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/Delegate-Handbook.pdf'),
  ('b3e1f1b6-3996-4f5e-b631-177bd4f698cd'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/Rules-of-Procedure.pdf'),
  ('75d36506-33b1-4cd1-b1a6-e9550d0f9e34'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/IPC-Study-Guide.pdf'),
  ('aed21b01-e225-478a-86d4-161288b0b97d'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/COPUOS-Study-Guide.pdf'),
  ('dc379bbd-5b0d-4529-843a-3ebf83656088'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/EP-Study-Guide.pdf'),
  ('4de376cb-92d7-4f61-82e5-9a5a9b892f47'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/IAEA-Study-Guide.pdf'),
  ('b23908b9-66e3-4d6b-9ddb-1d3212ef59bd'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/ILO-Study-Guide.pdf'),
  ('b42a9f7c-b509-416e-9ae4-e834ae291462'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/PIF-Study-Guide.pdf'),
  ('84eeb99e-7542-4c6d-8a24-92f965955e64'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/UNSC-Study-Guide.pdf'),
  ('dca45e8d-280e-4172-8d3b-3955ba5ccfea'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/USCC-Study-Guide.pdf'),
  ('6ee5cbb0-5a72-454c-a8ee-c657052ec3b0'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/WHO-Study-Guide.pdf'),
  ('8c16e069-bc30-4c38-a6f1-0bec0bd2c34a'::uuid, 'https://jkbtxjefzzmplmrvaubc.supabase.co/storage/v1/object/public/conference-resources/10000000-0000-4000-8000-000000000001/documents/DISEC-Study-Guide.pdf')
) as files(id,url)
where r.id=files.id and r.conference_id='10000000-0000-4000-8000-000000000001';
