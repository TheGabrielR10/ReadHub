-- Los buckets son public=true, por lo que el acceso de lectura vía URL pública
-- no pasa por RLS. Estas políticas SELECT amplias solo habilitaban además el
-- listado (enumeración) de todos los objetos del bucket, sin necesidad real.
drop policy if exists "article_documents_select_public" on storage.objects;
drop policy if exists "article_images_select_public" on storage.objects;
