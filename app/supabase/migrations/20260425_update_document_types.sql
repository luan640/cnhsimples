alter table public.instructor_documents
  drop constraint if exists instructor_documents_type_check;

update public.instructor_documents set type = 'cnh_front' where type = 'cnh';
update public.instructor_documents set type = 'cnh_back'  where type = 'detran_credential';

alter table public.instructor_documents
  add constraint instructor_documents_type_check
  check (type in ('cnh_front', 'cnh_back'));
