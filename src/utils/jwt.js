export function getUserIdFromToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null; // JWT değil

  try {
    // base64url decode
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(padded);
    const data = JSON.parse(json);

    // En yaygın alanlar:
    const raw =
      data.userId ??
      data.uid ??
      data.id ??
      data.sub ?? // çoğu sistemde userId burada
      null;

    if (raw == null) return null;

    // sub string olabilir → sayıya çevirmeyi dene ama string de dönebilir
    const n = Number(raw);
    return Number.isNaN(n) ? String(raw) : n;
  } catch {
    return null;
  }
}
