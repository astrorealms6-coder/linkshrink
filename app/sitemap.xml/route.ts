export async function GET() {
  const base = "https://linkshrink-six.vercel.app";
  const urls = ["/", "/dashboard", "/privacy", "/terms"].map(
    (p) => `<url><loc>${base}${p}</loc></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}