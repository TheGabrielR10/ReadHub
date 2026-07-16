-- Buckets requeridos por el MVP para almacenar documentos e imágenes de portada
-- de los artículos (Flujo 6 / 8.3 de la especificación). Públicos: el acceso de
-- lectura ya está gobernado por la RLS de la tabla articles (is_public o autor);
-- el path scoping por auth.uid() controla quién puede escribir.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'article-documents',
    'article-documents',
    true,
    10485760, -- 10 MB
    array['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'article-images',
    'article-images',
    true,
    5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do nothing;

-- Lectura pública (coherente con bucket public = true).
create policy "article_documents_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'article-documents');

create policy "article_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'article-images');

-- Escritura: solo el propio usuario autenticado, y únicamente dentro de una
-- carpeta cuyo primer segmento coincide con su auth.uid().
create policy "article_documents_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'article-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "article_images_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'article-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Actualización/eliminación: solo el propietario del objeto.
create policy "article_documents_update_own"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'article-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'article-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "article_documents_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'article-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "article_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'article-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'article-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "article_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'article-images' and (storage.foldername(name))[1] = auth.uid()::text);
