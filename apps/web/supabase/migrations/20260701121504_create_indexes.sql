create index idx_articles_author_id on public.articles (author_id);
create index idx_views_article_id on public.views (article_id);
-- likes.article_id ya queda cubierto por el índice del UNIQUE (article_id, user_id).
create index idx_comments_article_id on public.comments (article_id);
create index idx_favorites_article_id on public.favorites (article_id);
