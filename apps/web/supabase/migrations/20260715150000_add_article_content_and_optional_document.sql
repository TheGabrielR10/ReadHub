-- Permite escribir el CONTENIDO del artículo como texto (cuerpo) y hace que el
-- documento adjunto sea OPCIONAL. Antes, el "contenido" era exclusivamente un
-- archivo en Storage; ahora un artículo puede tener texto propio, un documento
-- adjunto, o ambos.
alter table public.articles add column if not exists content text;
alter table public.articles alter column document_path drop not null;
