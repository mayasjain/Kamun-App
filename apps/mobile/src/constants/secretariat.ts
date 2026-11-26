// Photos and roles: organiser-supplied delegate handbook, pages 4–6.
// LinkedIn destinations supplied by the organiser; tracking parameters removed.
import type { ImageSourcePropType } from 'react-native';
import { portraitLayout } from './portrait-layout';

let portraits: Partial<Record<keyof typeof portraitLayout, ImageSourcePropType>> = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro handles missing optional assets inside try blocks.
  portraits = require('../../assets/secretariat/portraits');
} catch {
  // A public checkout uses the existing initials fallback for private portraits.
}

export const secretariat = [
 { name: 'Mahima Rajpal', role: 'Secretary General', photo: portraits.mahima, photoLayout: portraitLayout.mahima, linkedin: 'https://www.linkedin.com/in/mahima-rajpal/' },
 { name: 'Venkata Mani Madhava Sai Kondapavuluri', role: 'Secretary General', photo: portraits.mani, photoLayout: portraitLayout.mani, linkedin: 'https://www.linkedin.com/in/venkata-mani-madhava-sai-kondapavuluri-90888a307/' },
 { name: 'Lena Wanner', role: 'Secretary General', photo: portraits.lena, photoLayout: portraitLayout.lena, linkedin: 'https://www.linkedin.com/in/lena-wanner-ab8001408/' },
 { name: 'Hridey Batra', role: 'USG of Academics · Safety and Awareness', photo: portraits.hridey, photoLayout: portraitLayout.hridey, linkedin: 'https://www.linkedin.com/in/hridey-batra-912203141/' },
 { name: 'Ansh Mehta', role: 'USG of Academics', photo: portraits.ansh, photoLayout: portraitLayout.ansh, linkedin: 'https://www.linkedin.com/in/-ansh-mehta/' },
 { name: 'Jacqueline Zweers', role: 'Academic Director · Safety and Awareness', photo: portraits.jacqueline, photoLayout: portraitLayout.jacqueline, linkedin: 'https://www.linkedin.com/in/jacquelinezweers27/' },
 { name: 'Damian Vassilev', role: 'Academic Director', photo: portraits.damian, photoLayout: portraitLayout.damian, linkedin: null },
 { name: 'Katharina Haack', role: 'Academic Director', photo: portraits.katharina, photoLayout: portraitLayout.katharina, linkedin: 'https://www.linkedin.com/in/katharina-haack/' },
 { name: 'Mats Hagedorn', role: 'Academic Director', photo: portraits.mats, photoLayout: portraitLayout.mats, linkedin: 'https://www.linkedin.com/in/mats-hagedorn-8415a229b/' },
 { name: 'Valeria Loera', role: 'Academic Director · Social Media, Marketing and PR', photo: portraits.valeria, photoLayout: portraitLayout.valeria, linkedin: 'https://www.linkedin.com/in/valeria-loera-gomez/' },
 { name: 'Jean Patrick Mathes', role: 'USG of Delegates', photo: portraits.jeanPatrick, photoLayout: portraitLayout.jeanPatrick, linkedin: 'https://www.linkedin.com/in/jean-patrick-mathes-9579a9294/' },
 { name: 'Akshat Bhalekar', role: 'USG of Delegates · Safety and Awareness', photo: portraits.akshat, photoLayout: portraitLayout.akshat, linkedin: 'https://www.linkedin.com/in/akshat-bhalekar-5b9ba9229/' },
 { name: 'Enrico Gerad Uy', role: 'USG of Food and Socials', photo: portraits.enrico, photoLayout: portraitLayout.enrico, linkedin: 'https://www.linkedin.com/in/enrico-uy-2846b3290/' },
 { name: 'Rohil Saraf', role: 'USG Logistics', photo: portraits.rohil, photoLayout: portraitLayout.rohil, linkedin: 'https://www.linkedin.com/in/rohilsaraf/' },
 { name: 'Karan Chodankar', role: 'USG Logistics', photo: portraits.karan, photoLayout: portraitLayout.karan, linkedin: null },
 { name: 'Mayas Jain', role: 'Logistics and Tech', photo: portraits.mayas, photoLayout: portraitLayout.mayas, linkedin: 'https://www.linkedin.com/in/mayas-jain-62127227b/' },
 { name: 'Franziska Heidelberg', role: 'USG Food and Socials', photo: portraits.franziska, photoLayout: portraitLayout.franziska, linkedin: null },
 { name: 'Lara Fabienne Hahne', role: 'USG of Marketing', photo: portraits.lara, photoLayout: portraitLayout.lara, linkedin: 'https://www.linkedin.com/in/lara-fabienne-h-183392380/' },
 { name: 'Tulip Pednekar', role: 'Marketing, Design and Social Media', photo: portraits.tulip, photoLayout: portraitLayout.tulip, linkedin: 'https://www.linkedin.com/in/tulippednekar/' },
 { name: 'Filippa Kuhnert', role: 'Social Media, Marketing and PR', photo: portraits.filippa, photoLayout: portraitLayout.filippa, linkedin: 'https://www.linkedin.com/in/filippa-lilly-kuhnert/' },
 { name: 'Varshitha Ramakumar', role: 'Chief Advisor and Head of Communications', photo: portraits.varshitha, photoLayout: portraitLayout.varshitha, linkedin: 'https://www.linkedin.com/in/varshitha-ramakumar/' },
] as const;
