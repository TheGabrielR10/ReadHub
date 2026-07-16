# Ejemplos de uso — Asistente del Escritor

Ejemplos reales del flujo, con las Tools del MCP de ReadHub que se usarían.

## Ejemplo 1 — Escribir un artículo desde cero

**Usuario:** «Quiero escribir un artículo sobre técnicas de concentración para estudiar.»

**Asistente:**
1. Aclara audiencia y extensión.
2. `buscar_semantica("técnicas de concentración y estudio")` → ve qué hay.
3. `contexto_investigacion("concentración y hábitos de estudio")` → reúne material.
4. Propone enfoque y esquema (introducción → 3 técnicas → conclusión).
5. Redacta sección por sección.
6. Sugiere 3 títulos, un resumen y 5 palabras clave.
7. `documentos_relacionados` del borrador para evitar solapamientos y citar lo existente.

## Ejemplo 2 — Revisar un artículo antes de publicar

**Usuario:** «Revisa este artículo, ¿está listo para publicar?» (pega el texto)

**Asistente:**
1. Lee el texto y evalúa claridad, estructura, coherencia, ortografía y redundancias.
2. `buscar_semantica` con el tema del artículo para encontrar publicaciones similares.
3. `comparar_articulos` entre el borrador (o artículos similares) para detectar
   contradicciones o repeticiones.
4. Devuelve el informe con el formato: Resumen / Fortalezas / Debilidades /
   Contradicciones / Recomendaciones / Artículos relacionados.

## Ejemplo 3 — Tema aún no cubierto

**Usuario:** «¿Hay algo sobre jardinería urbana en ReadHub? Quiero escribirlo.»

**Asistente:**
1. `buscar_semantica("jardinería urbana")` → sin resultados relevantes.
2. Informa: «No hay artículos sobre eso; serías el primero.»
3. Ofrece planificar el artículo desde cero (esquema + redacción), aprovechando
   que no hay solapamiento con contenido existente.

## Ejemplo 4 — Mejorar la redacción y el título

**Usuario:** «Mejora este párrafo y proponme mejores títulos.»

**Asistente:**
1. Reescribe el párrafo mejorando claridad y eliminando redundancias.
2. Propone 3-5 títulos alternativos con distinto enfoque.
3. Si el tema ya existe en ReadHub, sugiere un ángulo diferenciador con
   `extraer_temas` para no repetir lo ya publicado.
