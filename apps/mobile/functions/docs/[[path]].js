import documents from '../../src/constants/document-links.json';

// Only known, already-public conference PDFs can be served through this route.
export async function onRequest({ request }) {
 if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
 const slug = new URL(request.url).pathname.slice('/docs/'.length);
 const doc = documents.find(item => item.slug === slug);
 if (!doc) return new Response('Document not found', { status: 404 });
 const headers = new Headers();
 for (const name of ['range', 'if-range', 'if-none-match', 'if-modified-since']) {
  if (request.headers.has(name)) headers.set(name, request.headers.get(name));
 }
 try {
  const upstream = await fetch(doc.source, { method: request.method, headers, redirect: 'follow' });
  if (![200, 206, 304, 416].includes(upstream.status)) return new Response('Document temporarily unavailable', { status: 502, headers: { 'X-Document-Upstream-Status': String(upstream.status) } });
  const output = new Headers();
  for (const name of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
   if (upstream.headers.has(name)) output.set(name, upstream.headers.get(name));
  }
  output.set('Content-Type', 'application/pdf');
  output.set('Content-Disposition', `inline; filename="${doc.slug}"`);
  output.set('X-Content-Type-Options', 'nosniff');
  output.set('Cache-Control', 'public, max-age=300');
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: output });
 } catch { return new Response('Document temporarily unavailable', { status: 502 }); }
}
