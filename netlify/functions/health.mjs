export default async () => {
  const raw = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SECRET_KEY || "";
  const base = raw.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
  const out = {
    url_empieza_https: raw.trim().startsWith("https://"),
    url_termina_supabase_co: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(base),
    url_tenia_barra_final_o_ruta: raw.trim() !== base,
    secret_key_empieza: key.slice(0, 10),
    admin_emails: Boolean(process.env.ADMIN_EMAILS),
  };
  try {
    const r = await fetch(`${base}/rest/v1/products?select=id`, { headers: { apikey: key } });
    out.status = r.status;
    const body = await r.json().catch(() => null);
    if (r.ok) out.productos = body.length;
    else out.error = body && { code: body.code, message: body.message };
  } catch (e) {
    out.error = "no se pudo conectar";
  }
  return Response.json(out, { headers: { "cache-control": "no-store" } });
};
