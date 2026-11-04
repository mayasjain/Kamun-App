import type { ImageSourcePropType } from 'react-native';

// Names and original embedded logos come from pages 23–24 of the organiser-supplied
// KAMUN 2026 delegate handbook (delegate-handbook-ee04582c2ba8.pdf).
// Preserve its pairings: OpenIT → CyberLab, Ferrero → Ferrero Rocher, and
// “Aurel Steinhart” → the logo reading “Aurel Steinert Stiftung”.
// The portrait AIESEC image is centred inside the circular logo frame.
type Partner = { name: string; detail: string; logo: ImageSourcePropType };
type PartnerGroup = { title: string; description: string; entries: readonly Partner[] };

export const partnerGroups: readonly PartnerGroup[] = [
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
  {
    title: 'Institutional partners',
    description: 'The institutions supporting our conference community.',
    entries: [
      { name: 'KIT', detail: 'Karlsruher Institut für Technologie', logo: require('../../assets/partners/kit.png') },
      { name: 'Karlshochschule', detail: 'International University', logo: require('../../assets/partners/karlshochschule.png') },
      { name: 'AIESEC', detail: 'Member', logo: require('../../assets/partners/aiesec.png') },
      { name: 'DGVN', detail: 'Landesverband Berlin-Brandenburg e. V.', logo: require('../../assets/partners/dgvn.png') },
    ],
  },
  {
    title: 'Financial sponsors',
    description: 'Supporting the ideas and people behind KAMUN 2026.',
    entries: [
      { name: 'Jugendstiftung Baden Württemberg', detail: 'Foundation supporting youth-led projects and civic engagement across Baden-Württemberg.', logo: require('../../assets/partners/jugendstiftung.png') },
      { name: 'Aurel Steinhart Stiftung', detail: 'Foundation advancing international understanding, equality and opportunities for young people.', logo: require('../../assets/partners/aurel-steinhart.png') },
      { name: 'Kulturzentrum KIT', detail: 'Student cultural centre fostering creative projects, educational activities and cultural exchange.', logo: require('../../assets/partners/kulturzentrum-kit.png') },
    ],
  },
  {
    title: 'In-kind sponsors',
    description: 'Contributing resources and support to the KAMUN experience.',
    entries: [
      { name: 'OpenIT Karlsruhe', detail: 'Karlsruhe-based accelerator supporting technology startups through mentoring, programmes and networking.', logo: require('../../assets/partners/openit.png') },
      { name: 'The Länd Baden Württemberg', detail: 'Official brand campaign representing Baden-Württemberg and showcasing the state’s profile.', logo: require('../../assets/partners/the-laend.png') },
      { name: 'Sparkasse', detail: 'Regional financial institution providing banking services to individuals and businesses.', logo: require('../../assets/partners/sparkasse.png') },
      { name: 'Ferrero Germany', detail: 'Confectionery company behind well-known brands including Kinder, Nutella and Ferrero Rocher.', logo: require('../../assets/partners/ferrero.png') },
      { name: 'KIT Marketing', detail: 'Communications and marketing unit of Karlsruhe Institute of Technology, promoting its research, innovation and activities.', logo: require('../../assets/partners/kit-marketing.png') },
    ],
  },
];
