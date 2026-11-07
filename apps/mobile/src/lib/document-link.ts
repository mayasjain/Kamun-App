import documents from '../constants/document-links.json';

export function readableDocumentUrl(source: string, origin = 'https://kamun-2026-app.pages.dev'): string {
 const parsed = new URL(source);
 const file = parsed.pathname.split('/').pop();
 const document = documents.find(item => item.source === source || (
  new URL(item.source).origin === parsed.origin && item.aliases.includes(file ?? '')
  && parsed.pathname.startsWith('/storage/v1/object/public/conference-resources/')
 ));
 return document ? `${origin}/docs/${document.slug}` : source;
}
