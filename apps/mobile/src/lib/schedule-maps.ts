/** Search links for venues named in the approved programme. Generic committee
 * rooms and TBA locations have no map link until an exact building is known. */
export function scheduleVenueMapUrl(roomName: string | null): string | null {
  if (!roomName) return null;

  const venue = roomName.toLocaleLowerCase('de-DE');
  let query: string | null = null;

  if (venue.includes('karlshochschule')) query = 'Karlshochschule International University Karlsruhe';
  else if (venue.includes('europabad')) query = 'Europabad Karlsruhe';
  else if (venue.includes('mathebau') || venue.includes('20.30 mathematik')) query = 'KIT Gebäude 20.30 Mathematik Karlsruhe';
  else if (venue.includes('begegnungsstätte grötzingen')) query = 'Begegnungsstätte Grötzingen Karlsruhe';
  else if (venue.includes('johann-gottfried-tulla')) query = 'Johann-Gottfried-Tulla-Hörsaal KIT Karlsruhe';

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}
