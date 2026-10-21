insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'conference-resources',
  'conference-resources',
  true,
  15728640,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read conference resources"
on storage.objects for select to anon, authenticated
using (bucket_id = 'conference-resources');

create policy "admins upload conference resources"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'conference-resources'
  and public.is_kamun_admin()
);

create policy "admins update conference resources"
on storage.objects for update to authenticated
using (
  bucket_id = 'conference-resources'
  and public.is_kamun_admin()
)
with check (
  bucket_id = 'conference-resources'
  and public.is_kamun_admin()
);

create policy "admins delete conference resources"
on storage.objects for delete to authenticated
using (
  bucket_id = 'conference-resources'
  and public.is_kamun_admin()
);

comment on table public.resources is
  'Published PDF metadata. Upload files to conference-resources before publishing the matching resource row.';
