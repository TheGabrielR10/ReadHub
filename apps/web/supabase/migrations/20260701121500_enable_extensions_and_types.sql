-- Extensión requerida para generar UUID como valor por defecto de las claves primarias.
create extension if not exists pgcrypto;

-- Rol de negocio del usuario dentro de la plataforma.
create type public.user_role as enum ('reader', 'writer', 'admin');
