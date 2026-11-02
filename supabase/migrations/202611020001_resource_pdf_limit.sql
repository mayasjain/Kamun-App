-- Preserve original conference PDFs, including the 33 MB Delegate Handbook.
update storage.buckets
set file_size_limit = 52428800
where id = 'conference-resources';
