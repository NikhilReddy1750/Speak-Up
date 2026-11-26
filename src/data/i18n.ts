import type { LanguageCode } from '../types/complaint';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  speechLocale: string;
  samplePrompt: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    speechLocale: 'en-IN',
    samplePrompt:
      'There is a big pothole on the main road near the bus stop in Kukatpally. It has been there for two weeks.',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    speechLocale: 'hi-IN',
    samplePrompt:
      'कुकटपल्ली बस स्टॉप के पास मुख्य सड़क पर एक बड़ा गड्ढा है। यह दो हफ्ते से ऐसे ही है और पानी भरने से दुर्घटना हो सकती है।',
  },
  {
    code: 'te',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    speechLocale: 'te-IN',
    samplePrompt:
      'కూకట్‌పల్లి బస్ స్టాప్ దగ్గర మెయిన్ రోడ్డు మీద పెద్ద గుంట ఉంది. రెండు వారాలుగా ఎవరూ బాగు చేయలేదు.',
  },
];

export function getLanguageOption(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export interface Translations {
  appName: string;
  tagline: string;
  homeHeading: string;
  tapToSpeak: string;
  orTypeInstead: string;
  typePlaceholder: string;
  analyzeTypedBtn: string;
  latestComplaint: string;
  viewAll: string;
  navHome: string;
  navComplaints: string;
  navSettings: string;
  listeningHeading: string;
  whatWeHeard: string;
  redo: string;
  cancel: string;
  stop: string;
  continueBtn: string;
  editTranscriptHint: string;
  clarifyHeading: string;
  clarifySubheading: string;
  locationHeading: string;
  confirmHeading: string;
  confirmSubmitBtn: string;
  editDetailsBtn: string;
  myComplaintsHeading: string;
  settingsHeading: string;
  demoModeBadge: string;
  speakSampleBtn: string;
  listenAloud: string;
  statusSubmitted: string;
  statusReceived: string;
  statusInProgress: string;
  statusResolved: string;
}

export const UI_COPY: Record<LanguageCode, Translations> = {
  en: {
    appName: 'SpeakUp',
    tagline: 'Voice-first civic reporting',
    homeHeading: 'What would you like to report today?',
    tapToSpeak: 'Tap to speak',
    orTypeInstead: 'or type instead',
    typePlaceholder:
      'Describe the problem in your own words (e.g. "Streetlight broken near Madhapur Metro gate 2")',
    analyzeTypedBtn: 'Continue with text',
    latestComplaint: 'Latest complaint',
    viewAll: 'View all',
    navHome: 'Home',
    navComplaints: 'Complaints',
    navSettings: 'Settings',
    listeningHeading: 'Listening...',
    whatWeHeard: 'WHAT WE HEARD',
    redo: 'Redo',
    cancel: 'Cancel',
    stop: 'Stop',
    continueBtn: 'Continue',
    editTranscriptHint: 'You can edit the text below if anything was misheard.',
    clarifyHeading: 'A quick question',
    clarifySubheading: 'Helping route your complaint to the right team',
    locationHeading: 'Location & evidence',
    confirmHeading: 'Review your complaint',
    confirmSubmitBtn: 'Confirm & Submit',
    editDetailsBtn: 'Edit',
    myComplaintsHeading: 'My Complaints',
    settingsHeading: 'Settings',
    demoModeBadge: 'Demo Mode',
    speakSampleBtn: 'Try sample voice input',
    listenAloud: 'Listen aloud',
    statusSubmitted: 'Submitted',
    statusReceived: 'Received by dept.',
    statusInProgress: 'In progress',
    statusResolved: 'Resolved',
  },
  hi: {
    appName: 'SpeakUp',
    tagline: 'आवाज़ से नागरिक शिकायत दर्ज करें',
    homeHeading: 'आज आप किस समस्या की रिपोर्ट करना चाहेंगे?',
    tapToSpeak: 'बोलने के लिए टैप करें',
    orTypeInstead: 'या लिखकर बताएं',
    typePlaceholder:
      'अपनी भाषा में समस्या बताएं (जैसे: "कुकटपल्ली बस स्टॉप के पास सड़क पर बड़ा गड्ढा है")',
    analyzeTypedBtn: 'आगे बढ़ें',
    latestComplaint: 'ताज़ा शिकायत',
    viewAll: 'सभी देखें',
    navHome: 'होम',
    navComplaints: 'शिकायतें',
    navSettings: 'सेटिंग्स',
    listeningHeading: 'सुन रहे हैं...',
    whatWeHeard: 'हमने यह सुना',
    redo: 'फिर से बोलें',
    cancel: 'रद्द करें',
    stop: 'रोकें',
    continueBtn: 'आगे बढ़ें',
    editTranscriptHint: 'अगर कोई शब्द गलत लिखा हो तो आप नीचे बदल सकते हैं।',
    clarifyHeading: 'एक छोटा सा सवाल',
    clarifySubheading: 'सही विभाग तक शिकायत पहुँचाने के लिए',
    locationHeading: 'स्थान और प्रमाण',
    confirmHeading: 'अपनी शिकायत जांचें',
    confirmSubmitBtn: 'पुष्टि करें और भेजें',
    editDetailsBtn: 'संपादित करें',
    myComplaintsHeading: 'मेरी शिकायतें',
    settingsHeading: 'सेटिंग्स',
    demoModeBadge: 'डेमो मोड',
    speakSampleBtn: 'उदाहरण शिकायत आज़माएं',
    listenAloud: 'सुनें',
    statusSubmitted: 'दर्ज की गई',
    statusReceived: 'विभाग को प्राप्त',
    statusInProgress: 'कार्य प्रगति पर',
    statusResolved: 'समाधान हो गया',
  },
  te: {
    appName: 'SpeakUp',
    tagline: 'మాటతో పౌర సమస్యలను తెలియజేయండి',
    homeHeading: 'ఈరోజు మీరు ఏ సమస్యను తెలియజేయాలనుకుంటున్నారు?',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    orTypeInstead: 'లేదా టైప్ చేయండి',
    typePlaceholder:
      'సమస్యను మీ సొంత మాటల్లో వివరించండి (ఉదా: "కూకట్‌పల్లి బస్ స్టాప్ దగ్గర రోడ్డు మీద పెద్ద గుంట ఉంది")',
    analyzeTypedBtn: 'కొనసాగండి',
    latestComplaint: 'ఇటీవలి ఫిర్యాదు',
    viewAll: 'అన్నీ చూడండి',
    navHome: 'హోమ్',
    navComplaints: 'ఫిర్యాదులు',
    navSettings: 'సెట్టింగ్స్',
    listeningHeading: 'వింటున్నాము...',
    whatWeHeard: 'మేము విన్నది',
    redo: 'మళ్ళీ చెప్పండి',
    cancel: 'రద్దు చేయండి',
    stop: 'ఆపండి',
    continueBtn: 'కొనసాగండి',
    editTranscriptHint: 'తప్పుగా వినిపించినట్లయితే మీరు క్రింద మార్చవచ్చు.',
    clarifyHeading: 'చిన్న ప్రశ్న',
    clarifySubheading: 'సరైన విభాగానికి పంపడానికి సహాయం',
    locationHeading: 'ప్రదేశం మరియు ఆధారాలు',
    confirmHeading: 'మీ ఫిర్యాదును పరిశీలించండి',
    confirmSubmitBtn: 'నిర్ధారించి సమర్పించండి',
    editDetailsBtn: 'మార్చండి',
    myComplaintsHeading: 'నా ఫిర్యాదులు',
    settingsHeading: 'సెట్టింగ్స్',
    demoModeBadge: 'డెమో మోడ్',
    speakSampleBtn: 'నమూనా ఫిర్యాదు ప్రయత్నించండి',
    listenAloud: 'వినండి',
    statusSubmitted: 'నమోదైంది',
    statusReceived: 'విభాగానికి అందింది',
    statusInProgress: 'పురోగతిలో ఉంది',
    statusResolved: 'పరిష్కరించబడింది',
  },
};

export function buildConfirmationSpeech(
  lang: LanguageCode,
  referenceNumber: string,
  title: string,
  isDemo: boolean
): string {
  const spacedRef = referenceNumber.split('').join(' ');
  if (lang === 'hi') {
    return `${isDemo ? 'डेमो मोड में ' : ''}आपकी शिकायत "${title}" दर्ज हो गई है। आपका संदर्भ नंबर ${spacedRef} है।`;
  }
  if (lang === 'te') {
    return `${isDemo ? 'డెమో మోడ్‌లో ' : ''}మీ ఫిర్యాదు "${title}" నమోదు చేయబడింది. మీ రిఫరెన్స్ నంబర్ ${spacedRef}.`;
  }
  return `${isDemo ? 'In demo mode, your' : 'Your'} complaint "${title}" has been submitted. Your reference number is ${spacedRef}.`;
}
