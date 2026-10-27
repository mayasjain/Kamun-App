function internationalPhone(phone: string | null): string | null {
  if (!phone) return null;
  const international = phone.trim().replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(international)) return null;
  return international;
}

/** WhatsApp click-to-chat links require an international number without punctuation. */
export function whatsappChatUrl(phone: string | null): string | null {
  const international = internationalPhone(phone);
  if (!international) return null;
  return `https://wa.me/${international.slice(1)}`;
}

export function phoneCallUrl(phone: string | null): string | null {
  const international = internationalPhone(phone);
  return international ? `tel:${international}` : null;
}
