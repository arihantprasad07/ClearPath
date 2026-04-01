export type IndianLanguage = {
  code: string;
  englishName: string;
  nativeName: string;
  alertDemo: string;
};

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: 'en', englishName: 'English', nativeName: 'English', alertDemo: 'Route 4B blocked. Take alternate 4C immediately.' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिंदी', alertDemo: 'मार्ग 4B अवरुद्ध है। तुरंत वैकल्पिक मार्ग 4C लें।' },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', alertDemo: 'রুট 4B বন্ধ। অবিলম্বে বিকল্প 4C নিন।' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', alertDemo: 'రూట్ 4B మూసివేయబడింది. వెంటనే ప్రత్యామ్నాయ 4C తీసుకోండి.' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', alertDemo: 'मार्ग 4B बंद आहे. लगेच पर्यायी मार्ग 4C घ्या.' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', alertDemo: 'பாதை 4B தடுக்கப்பட்டுள்ளது. உடனே மாற்று 4C எடுக்கவும்.' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', alertDemo: 'રૂટ 4B બંધ છે. તરત વિકલ્પ 4C લો.' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ', alertDemo: 'ಮಾರ್ಗ 4B ತಡೆಗಟ್ಟಲಾಗಿದೆ. ತಕ್ಷಣ ಪರ್ಯಾಯ 4C ತೆಗೆದುಕೊಳ್ಳಿ.' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം', alertDemo: 'റൂട്ട് 4B തടസ്സപ്പെട്ടു. ഉടൻ തന്നെ 4C വഴി പോകുക.' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', alertDemo: 'ਰੂਟ 4B ਬੰਦ ਹੈ। ਤੁਰੰਤ ਵਿਕਲਪ 4C ਲਓ।' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', alertDemo: 'راستہ 4B بند ہے۔ فوراً متبادل 4C اختیار کریں۔' },
  { code: 'or', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ', alertDemo: 'ରୁଟ୍ 4B ବନ୍ଦ ଅଛି। ତୁରନ୍ତ ବିକଳ୍ପ 4C ନିଅନ୍ତୁ।' },
  { code: 'as', englishName: 'Assamese', nativeName: 'অসমীয়া', alertDemo: 'ৰুট 4B বন্ধ। তৎক্ষণাত্ বিকল্প 4C লওক।' },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली', alertDemo: 'मार्ग 4B अवरुद्ध छ। तुरुन्त वैकल्पिक 4C लिनुहोस्।' },
  { code: 'kok', englishName: 'Konkani', nativeName: 'कोंकणी', alertDemo: 'मार्ग 4B आड आयला. लगेच पर्यायी 4C घ्या.' },
  { code: 'sd', englishName: 'Sindhi', nativeName: 'سنڌي', alertDemo: 'رستو 4B بند آهي۔ فوري متبادل 4C وٺو۔' },
  { code: 'doi', englishName: 'Dogri', nativeName: 'डोगरी', alertDemo: 'रूट 4B ब्लॉक ऐ। फौरन विकल्प 4C लेओ।' },
  { code: 'brx', englishName: 'Bodo', nativeName: 'बर’', alertDemo: 'रुट 4B बन्द जायो। दा 4C फिन लांदों।' },
  { code: 'mni', englishName: 'Manipuri', nativeName: 'মৈতৈলোন', alertDemo: 'লম 4B থিঙলরে। মতম খুদিংদা 4C লৌ।' },
  { code: 'sat', englishName: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', alertDemo: 'ᱨᱩᱴ 4B ᱵᱚᱸᱫ ᱦᱚᱭ ᱟᱠᱟᱱᱟ। 4C ᱫᱚ ᱟᱫᱮᱨ ᱭᱟᱱᱟ।' },
  { code: 'ks', englishName: 'Kashmiri', nativeName: 'کٲشُر', alertDemo: 'راستہ 4B بند ہے۔ فوراً 4C اختیار کریں۔' },
  { code: 'sa', englishName: 'Sanskrit', nativeName: 'संस्कृतम्', alertDemo: 'मार्गः 4B अवरुद्धः। तत्क्षणं 4C मार्गं गृह्णन्तु।' },
];

export function getLanguageByCode(code: string): IndianLanguage {
  return INDIAN_LANGUAGES.find((language) => language.code === code) ?? INDIAN_LANGUAGES[0];
}
