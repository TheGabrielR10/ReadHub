// Disparador de indexación desde el cliente (Sesión 4, Prompt 5).
//
// Mismo patrón cliente/servidor que auth.service.ts (cliente) vs auth.server.ts
// (servidor): la generación del embedding vive en indexing.service.ts (server-only)
// y aquí solo se invoca el Route Handler que la ejecuta. Los hooks consumen esto,
// nunca hacen fetch directo.
//
// Es best-effort: la indexación NO debe bloquear ni romper la publicación. Si
// falla, se registra en consola y el flujo del usuario continúa (el artículo ya
// quedó guardado; el índice puede regenerarse después).

async function post(method: "POST" | "DELETE", articleId: string): Promise<void> {
  try {
    const res = await fetch("/api/v1/rag/index", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    });
    if (!res.ok) {
      console.warn(`[rag] indexación (${method}) devolvió ${res.status} para ${articleId}`);
    }
  } catch (err) {
    console.warn("[rag] no fue posible contactar el servicio de indexación:", err);
  }
}

export const indexingClient = {
  // Se llama tras crear o editar un artículo.
  triggerIndex: (articleId: string) => post("POST", articleId),
  // Se llama tras despublicar (no tras borrar: el CASCADE ya limpia el vector).
  triggerRemove: (articleId: string) => post("DELETE", articleId),
};
