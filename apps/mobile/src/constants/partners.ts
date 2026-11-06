import type { ImageSourcePropType } from 'react-native';

// Names and original embedded logos come from pages 23–24 of the organiser-supplied
// KAMUN 2026 delegate handbook (delegate-handbook-ee04582c2ba8.pdf).
// Preserve its pairings: OpenIT → CyberLab, Ferrero → Ferrero Rocher, and
// “Aurel Steinhart” → the logo reading “Aurel Steinert Stiftung”.
// Foundation spelling verified against https://aurelsteinert-stiftung.de/.
// Logos use circular frames; wide wordmarks can opt into contain to remain readable.
// ZeSIA was added by the organiser; logo sourced from https://www.zesia-ka.de/en.
type Partner = { name: string; detail: string; logo?: ImageSourcePropType; initials?: string; logoFit?: 'contain' | 'cover'; logoBackground?: string };
type PartnerGroup = { title: string; description: string; entries: readonly Partner[] };

export const partnerGroups: readonly PartnerGroup[] = [
  {
    title: 'Institutional partners',
    description: 'The institutions supporting our conference community.',
    entries: [
      { name: 'KIT', detail: 'Karlsruher Institut für Technologie', logo: require('../../assets/partners/kit.png') },
      { name: 'Karlshochschule', detail: 'International University', logo: require('../../assets/partners/karlshochschule.png') },
      { name: 'DGVN', detail: 'Landesverband Berlin-Brandenburg e. V.', logo: require('../../assets/partners/dgvn.png') },
      { name: 'AIESEC', detail: 'Institutional partner of KAMUN 2026.', logo: require('../../assets/partners/aiesec.png'), logoFit: 'contain' },
      { name: 'mymun', detail: 'Institutional partner of KAMUN 2026.', logo: require('../../assets/partners/mymun.png'), logoFit: 'contain' },
    ],
  },
  {
    title: 'Financial sponsors',
    description: 'Supporting the ideas and people behind KAMUN 2026.',
    entries: [
      { name: 'Jugendstiftung Baden Württemberg', detail: 'Foundation supporting youth-led projects and civic engagement across Baden-Württemberg.', logo: require('../../assets/partners/jugendstiftung.png') },
      { name: 'Aurel Steinert Stiftung', detail: 'Foundation advancing international understanding, equality and opportunities for young people.', logo: require('../../assets/partners/aurel-steinhart.png') },
      { name: 'Kulturzentrum KIT', detail: 'Student cultural centre fostering creative projects, educational activities and cultural exchange.', logo: require('../../assets/partners/kulturzentrum-kit.png') },
    ],
  },
  {
    title: 'In-kind sponsors',
    description: 'Contributing resources and support to the KAMUN experience.',
    entries: [
      { name: 'MUN Command', detail: 'In-kind sponsor of KAMUN 2026.', logo: require('../../assets/partners/mun-command.jpg'), logoFit: 'contain' },
      { name: 'Partyfly', detail: 'In-kind sponsor of KAMUN 2026.', logo: require('../../assets/partners/partyfly.png'), logoFit: 'contain', logoBackground: '#073D80' },
      { name: 'BOCK auf Karlsruhe', detail: 'In-kind sponsor of KAMUN 2026.', logo: require('../../assets/partners/bock-auf-karlsruhe.png'), logoFit: 'contain', logoBackground: '#000000' },
      { name: 'ZeSIA Karlsruhe', detail: 'Centre for sexual health, identity and education in Karlsruhe.', logo: require('../../assets/partners/zesia.png'), logoFit: 'contain' },
      { name: 'Münchner Aids-Hilfe e.V.', detail: 'Providing condoms and information booklets on sexually transmitted diseases (STDs).', logo: require('../../assets/partners/muenchner-aidshilfe.png'), logoFit: 'contain' },
      { name: 'OpenIT Karlsruhe', detail: 'Karlsruhe-based accelerator supporting technology startups through mentoring, programmes and networking.', logo: require('../../assets/partners/openit.png') },
      { name: 'The Länd Baden Württemberg', detail: 'Official brand campaign representing Baden-Württemberg and showcasing the state’s profile.', logo: require('../../assets/partners/the-laend.png') },
      { name: 'Sparkasse', detail: 'Regional financial institution providing banking services to individuals and businesses.', logo: require('../../assets/partners/sparkasse.png') },
      { name: 'Ferrero Germany', detail: 'Confectionery company behind well-known brands including Kinder, Nutella and Ferrero Rocher.', logo: require('../../assets/partners/ferrero.png') },
      { name: 'KIT Marketing', detail: 'Communications and marketing unit of Karlsruhe Institute of Technology, promoting its research, innovation and activities.', logo: require('../../assets/partners/kit-marketing.png') },
    ],
  },
  {
    title: 'Partner conferences',
    description: 'Our community of Model United Nations conferences across Europe.',
    entries: [
      { name: 'MDS 2026', detail: 'München', logo: require('../../assets/partners/mds.png') },
      { name: 'LakeMUN 2026', detail: 'Konstanz', logo: require('../../assets/partners/lakemun.png') },
      { name: 'HDMUN 2026', detail: 'Heidelberg', logo: require('../../assets/partners/hdmun.png') },
      { name: 'GoeMUN 2026', detail: 'Göttingen', logo: require('../../assets/partners/goemun.png') },
      { name: 'FreiMUN 2026', detail: 'Freiburg', logo: require('../../assets/partners/freimun.png') },
      { name: 'HamMUN 2026', detail: 'Hamburg', logo: require('../../assets/partners/hammun.png') },
      { name: 'SGMUN 2026', detail: 'St Gallen', logo: require('../../assets/partners/sgmun.png') },
      { name: 'EuroMUN 2027', detail: 'Maastricht', logo: require('../../assets/partners/euromun.png') },
      { name: 'LyonMUN 2027', detail: 'Lyon', logo: require('../../assets/partners/lyonmun.png') },
      { name: 'PIMUN 2027', detail: 'Paris', logo: require('../../assets/partners/pimun.png') },
    ],
  },
];
