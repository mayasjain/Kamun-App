import type { ImageSourcePropType } from 'react-native';

// Names and original embedded logos come from pages 23–24 of the organiser-supplied
// KAMUN 2026 delegate handbook (delegate-handbook-ee04582c2ba8.pdf).
// Preserve its pairings: OpenIT → CyberLab, Ferrero → Ferrero Rocher, and
// “Aurel Steinhart” → the logo reading “Aurel Steinert Stiftung”.
// Foundation spelling verified against https://aurelsteinert-stiftung.de/.
// Logos use circular frames; wide wordmarks can opt into contain to remain readable.
// ZeSIA was added by the organiser; logo sourced from https://www.zesia-ka.de/en.
type Partner = { url: `https://${string}`; name: string; detail: string; logo?: ImageSourcePropType; initials?: string; logoFit?: 'contain' | 'cover'; logoBackground?: string };
type PartnerGroup = { title: string; description: string; entries: readonly Partner[] };

export const partnerGroups: readonly PartnerGroup[] = [
  {
    title: 'Institutional partners',
    description: 'The institutions supporting our conference community.',
    entries: [
      { url: 'https://www.kit.edu/', name: 'KIT', detail: 'Karlsruher Institut für Technologie', logo: require('../../assets/partners/kit.png') },
      { url: 'https://karlshochschule.de/', name: 'Karlshochschule', detail: 'International University', logo: require('../../assets/partners/karlshochschule.png') },
      { url: 'https://dgvn.berlin/', name: 'DGVN', detail: 'Landesverband Berlin-Brandenburg e. V.', logo: require('../../assets/partners/dgvn.png') },
      { url: 'https://aiesec.org/', name: 'AIESEC', detail: "World's largest youth-run and youth-led non-governmental, non-profit organization", logo: require('../../assets/partners/aiesec.png'), logoFit: 'contain' },
      { url: 'https://mymun.com/', name: 'mymun', detail: "Leading global conference database, registration system, and community platform for MUN", logo: require('../../assets/partners/mymun.png'), logoFit: 'contain' },
    ],
  },
  {
    title: 'Financial sponsors',
    description: 'Supporting the ideas and people behind KAMUN 2026.',
    entries: [
      { url: 'https://www.jugendstiftung.de/', name: 'Jugendstiftung Baden Württemberg', detail: 'Foundation supporting youth-led projects and civic engagement across Baden-Württemberg.', logo: require('../../assets/partners/jugendstiftung.png') },
      { url: 'https://aurelsteinert-stiftung.de/', name: 'Aurel Steinert Stiftung', detail: 'Foundation advancing international understanding, equality and opportunities for young people.', logo: require('../../assets/partners/aurel-steinhart.png') },
      { url: 'https://skuz-kit.de/', name: 'Kulturzentrum KIT', detail: 'Student cultural centre fostering creative projects, educational activities and cultural exchange.', logo: require('../../assets/partners/kulturzentrum-kit.png') },
    ],
  },
  {
    title: 'In-kind sponsors',
    description: 'Contributing resources and support to the KAMUN experience.',
    entries: [
      { url: 'https://mymun.com/mun-command', name: 'MUN Command', detail: "All-in-one digital platform and app designed to run, manage, and participate in MUNs", logo: require('../../assets/partners/mun-command.jpg'), logoFit: 'contain' },
      { url: 'https://www.sparkasse-karlsruhe.de/', name: 'Sparkasse', detail: 'Regional financial institution providing banking services to individuals and businesses.', logo: require('../../assets/partners/sparkasse.png') },
      { url: 'https://www.cyberlab-karlsruhe.de/', name: 'OpenIT Karlsruhe', detail: 'Karlsruhe-based accelerator supporting technology startups through mentoring, programmes and networking.', logo: require('../../assets/partners/openit.png') },
      { url: 'https://www.bockaufkarlsruhe.de/', name: 'BOCK auf Karlsruhe', detail: "Youth- and student-focused local media and recommendation platform in Karlsruhe, Germany", logo: require('../../assets/partners/bock-auf-karlsruhe.png'), logoFit: 'contain', logoBackground: '#000000' },
      { url: 'https://www.thelaend.de/', name: 'The Länd Baden Württemberg', detail: 'Official brand campaign representing Baden-Württemberg and showcasing the state’s profile.', logo: require('../../assets/partners/the-laend.png') },
      { url: 'https://www.ferrero.com/de/de/', name: 'Ferrero Germany', detail: 'Confectionery company behind well-known brands including Kinder, Nutella and Ferrero Rocher.', logo: require('../../assets/partners/ferrero.png') },
      { url: 'https://www.partyfly.de/', name: 'Partyfly', detail: "German effervescent supplement that replenishes fluids and electrolytes after partying or festivals.", logo: require('../../assets/partners/partyfly.png'), logoFit: 'contain', logoBackground: '#073D80' },
      { url: 'https://www.kit.edu/', name: 'KIT Marketing', detail: 'Communications and marketing unit of Karlsruhe Institute of Technology, promoting its research, innovation and activities.', logo: require('../../assets/partners/kit-marketing.png') },
      { url: 'https://www.zesia-ka.de/', name: 'ZeSIA Karlsruhe', detail: 'Centre for sexual health, identity and education in Karlsruhe.', logo: require('../../assets/partners/zesia.png'), logoFit: 'contain' },
      { url: 'https://www.muenchner-aidshilfe.de/', name: 'Münchner Aids-Hilfe e.V.', detail: 'Providing condoms and information booklets on sexually transmitted diseases (STDs).', logo: require('../../assets/partners/muenchner-aidshilfe.png'), logoFit: 'contain' },
    ],
  },
  {
    title: 'Partner conferences',
    description: 'Our community of Model United Nations conferences across Europe.',
    entries: [
      { url: 'https://muntum.org/', name: 'MDS 2026', detail: 'München', logo: require('../../assets/partners/mds.png') },
      { url: 'https://www.lakemunconference.com/', name: 'LakeMUN 2026', detail: 'Konstanz', logo: require('../../assets/partners/lakemun.png') },
      { url: 'https://hd-mun.org/', name: 'HDMUN 2026', detail: 'Heidelberg', logo: require('../../assets/partners/hdmun.png') },
      { url: 'https://munsg.de/', name: 'GoeMUN 2026', detail: 'Göttingen', logo: require('../../assets/partners/goemun.png') },
      { url: 'https://freimun.com/', name: 'FreiMUN 2026', detail: 'Freiburg', logo: require('../../assets/partners/freimun.png') },
      { url: 'https://hanseatic-mun.de/hammun/', name: 'HamMUN 2026', detail: 'Hamburg', logo: require('../../assets/partners/hammun.png') },
      { url: 'https://www.stgallenmun.com/', name: 'SGMUN 2026', detail: 'St Gallen', logo: require('../../assets/partners/sgmun.png') },
      { url: 'https://www.unsamaastricht.org/euromun/', name: 'EuroMUN 2027', detail: 'Maastricht', logo: require('../../assets/partners/euromun.png') },
      { url: 'https://lyonmun.com/', name: 'LyonMUN 2027', detail: 'Lyon', logo: require('../../assets/partners/lyonmun.png') },
      { url: 'https://www.cinup.fr/pimun', name: 'PIMUN 2027', detail: 'Paris', logo: require('../../assets/partners/pimun.png') },
    ],
  },
];
