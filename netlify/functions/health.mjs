export default async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const out = {
    SUPABASE_URL: Boolean(url),
    SUPABASE_SECRET_KEY: Boolean(key),
    SUPABASE_PUBLISHABLE_KEY: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
    ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
  };
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/products?select=id`, { headers: { apikey: key } });
      out.supabase_status = r.status;
      if (r.ok) out.productos = (await r.json()).length;
    } catch (e) {
      out.supabase_error = "no se pudo conectar";
    }
  }
  return Response.json(out, { headers: { "cache-control": "no-store" } });
};
