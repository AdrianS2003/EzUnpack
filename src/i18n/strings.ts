/**
 * Every user-facing string. The tone rule for this app: no jargon, no file
 * paths, no "extract" / "destination" / "MB" without a plain-word hint. If a
 * sentence would confuse someone who has never opened a zip file, rewrite it.
 */

import type { ArchiveSource } from '@/data/archives';

export type Lang = 'en' | 'ro';

const MB = 1024 * 1024;

/** "4 MB" / "700 KB" — never bytes, never decimals. */
function humanSize(bytes: number): string {
  if (bytes >= MB) return `${Math.round(bytes / MB)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function sized(words: [string, string, string], bytes: number): string {
  const word = bytes < 10 * MB ? words[0] : bytes < 100 * MB ? words[1] : words[2];
  return `${word} - ${humanSize(bytes)}`;
}

/**
 * "30.07.2026". Written out by hand rather than through `Intl`: month names in
 * Romanian depend on locale data the phone may not carry, and this string ends
 * up inside a filename, where being wrong is permanent.
 */
function shortDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export type Strings = {
  search: string;
  quick: string;
  newArchives: string;
  newArchivesSub: string;
  savedFiles: string;
  savedFilesSub: string;
  feed: string;
  feedNew: string;
  feedSaved: string;
  showAll: string;
  unpack: string;
  unpackAgain: string;
  savedTag: string;
  look: string;
  lookSub: string;
  minimal: string;
  brutal: string;
  found: (n: number) => string;
  inside: (n: number) => string;
  hint: string;
  emptySearchTitle: string;
  emptySearchSub: string;
  emptyNewTitle: string;
  emptyNewSub: string;
  emptySavedTitle: string;
  emptySavedSub: string;
  navHome: string;
  navGuide: string;
  navSettings: string;
  emptyFeedTitle: string;
  emptyFeedSub: string;
  sheetSub: string;
  saveAll: string;
  notNow: string;
  /** The "archive as a folder" view. */
  openFolder: string;
  folderSub: (n: number) => string;
  whereGallery: string;
  whereApp: string;
  sendFile: string;
  saveToPhone: string;
  saveToPhoneDone: string;
  folderKeepNote: string;
  /** Why an edit made in another app does not come back here. */
  folderEditNote: string;
  confirmTitle: string;
  confirmBody: (n: number) => string;
  confirmYes: string;
  /** Removing an archive and everything the app kept for it. */
  deleteArchive: string;
  deleteTitle: string;
  deleteBody: (name: string) => string;
  deleteYes: string;
  saving: string;
  doneTitle: string;
  openPhotos: string;
  listening: string;
  cancel: string;
  guideTitle: string;
  guideSub: string;
  guideNotice: string;
  videoSoonTitle: string;
  videoSoonBody: string;
  videoSoonBadge: string;
  /** Stands in for a name when the sender handed over an identifier instead. */
  unnamedArchive: (received: Date) => string;
  settingsTitle: string;
  langRow: string;
  langRowSub: string;
  /** How much room the app takes, and the leftovers it can give back. */
  storageTitle: string;
  storageBody: (bytes: number) => string;
  storageTidy: string;
  storageLeftover: (bytes: number) => string;
  storageClean: (bytes: number) => string;
  storageCleanYes: string;
  storageDone: (bytes: number) => string;
  /** First-run screen, shown before the phone's own permission dialog. */
  primerTitle: string;
  primerBody: string;
  primerButton: string;
  primerSkip: string;
  ok: string;
  source: Record<ArchiveSource, string>;
  sizeLabel: (bytes: number) => string;
  openFile: string;
  openFileSub: string;
  reading: string;
  emptyArchive: string;
  doneWhere: (toGallery: number, toDocuments: number) => string;
  errorTitle: string;
  errorPassword: string;
  extracting: string;
  errorNotArchive: string;
  errorImport: string;
  errorPermission: string;
  errorUnreadable: string;
  errorWrite: string;
  errorDelete: string;
  errorNoVoice: string;
  errorSaveToPhone: string;
  /** The screen shown instead of the app closing on an unexpected error. */
  crashTitle: string;
  crashBody: string;
  crashSend: string;
  crashRetry: string;
  crashMailSubject: string;
  crashMailPrompt: string;
  crashNoMail: string;
  toggles: [string, string][];
  /**
   * Title and one line each. No running times: quoting a length for a video that
   * does not exist is the kind of small lie that costs trust when it is found.
   */
  videos: [string, string][];
};

const en: Strings = {
  search: 'Search files...',
  quick: 'What would you like to do?',
  newArchives: 'New Archives',
  newArchivesSub: 'Not opened yet',
  savedFiles: 'Saved Files',
  savedFilesSub: 'Photos & documents',
  feed: 'Recent Archives Found',
  feedNew: 'Not Opened Yet',
  feedSaved: 'Already Saved',
  showAll: 'Show all archives',
  unpack: 'UNPACK FILE',
  unpackAgain: 'SAVE AGAIN',
  savedTag: 'Saved',
  look: 'Look',
  lookSub: 'Two ways to see the app',
  minimal: 'Minimalist',
  brutal: 'Bold',
  found: (n) => `${n} found`,
  inside: (n) => `${n} files inside`,
  hint: 'Send an archive to EzUnpack from WhatsApp or Email, or open it with the button above. We keep our own copy, so you can always find it again here.',
  emptyFeedTitle: 'Nothing here yet',
  emptyFeedSub:
    'When somebody sends you an archive, choose Share or Open with, and pick EzUnpack. It will appear right here.',
  emptySearchTitle: 'Nothing with that name',
  emptySearchSub: 'Try part of the name, or clear the search box.',
  emptyNewTitle: 'Nothing new right now',
  emptyNewSub: 'You have opened everything we found. We will tell you when something arrives.',
  emptySavedTitle: 'Nothing saved yet',
  emptySavedSub: 'Open an archive and press the green button. What you save shows up here.',
  navHome: 'Home',
  navGuide: 'Video Guide',
  navSettings: 'Settings',
  sheetSub: 'Files will be saved straight into your phone gallery!',
  saveAll: 'Save to Photos & Docs',
  notNow: 'Not now',
  openFolder: 'See the files',
  folderSub: (n) => `${n} files, saved and waiting for you`,
  whereGallery: 'In Photos',
  whereApp: 'Kept here in EzUnpack',
  sendFile: 'Send',
  saveToPhone: 'Save to phone',
  saveToPhoneDone: 'Saved in the folder you chose.',
  folderKeepNote:
    'Your photos and videos are also in Photos, so they stay on the phone even if EzUnpack is removed. The other files live here.',
  folderEditNote:
    'If you open a file here in another app — Word, for example — and save it there, that app keeps your changes and decides where they go. What stays here is always the original from the archive. To put a copy somewhere you can find again, use "Save to phone".',
  confirmTitle: 'Save these files?',
  confirmBody: (n) => `We will put ${n} files into your Photos and Documents.`,
  confirmYes: 'Yes, save them',
  deleteArchive: 'Delete this archive',
  deleteTitle: 'Delete this archive?',
  deleteBody: (name) =>
    `We will remove "${name}" and the files EzUnpack kept for it. Your photos and videos stay in Photos.`,
  deleteYes: 'Yes, delete it',
  saving: 'Saving your files...',
  doneTitle: 'All files saved!',
  openPhotos: 'Open Photos',
  listening: 'Listening... say a file name',
  cancel: 'Cancel',
  guideTitle: 'Watch and learn',
  guideSub: 'Short videos. Big pictures. No hurry.',
  guideNotice:
    'The videos are still being filmed, so none of them play yet. When they are ready they will appear here on their own — there is nothing for you to install or switch on. Below is what is being made.',
  videoSoonTitle: 'Not filmed yet',
  videoSoonBody:
    'This one is still being made. It will appear here by itself when it is ready — you do not have to come back and check.',
  videoSoonBadge: 'Soon',
  unnamedArchive: (received) => `Archive received ${shortDate(received)}`,
  settingsTitle: 'Settings',
  langRow: 'Language',
  langRowSub: 'Follows your phone at first',
  storageTitle: 'Room on the phone',
  storageBody: (bytes) => `EzUnpack is keeping ${humanSize(bytes)} on your phone.`,
  storageTidy: 'All of it belongs to an archive you can see. There is nothing to tidy up.',
  storageLeftover: (bytes) =>
    `${humanSize(bytes)} of it is left over from archives that are gone. Nothing can open those files any more.`,
  storageClean: (bytes) => `Free up ${humanSize(bytes)}`,
  storageCleanYes: 'Yes, free it up',
  storageDone: (bytes) => `${humanSize(bytes)} is free again.`,
  primerTitle: 'One thing before we start',
  primerBody:
    'EzUnpack puts the photos and videos from your archives straight into Photos, where you already look at your pictures.\n\nIn a moment the phone will ask whether you allow this. Press Allow — nothing leaves your phone.',
  primerButton: 'I understand, continue',
  primerSkip: 'Later',
  ok: 'OK',
  source: {
    picked: 'You chose this',
    shared: 'Sent to EzUnpack',
    opened: 'Kept here for you',
  },
  sizeLabel: (bytes) => sized(['Small file', 'Medium file', 'Big file'], bytes),
  openFile: 'Open a file yourself',
  openFileSub: 'Pick an archive from the phone',
  reading: 'Looking inside...',
  emptyArchive: 'There is nothing inside this archive.',
  doneWhere: (gallery, documents) => {
    if (gallery > 0 && documents > 0) {
      return 'Your photos and videos are in Photos. The rest are waiting under "See the files".';
    }
    if (gallery > 0) return 'You can find them in Photos on your phone.';
    return 'They are waiting for you under "See the files".';
  },
  errorTitle: 'That did not work',
  errorPassword:
    'This archive is locked with a password. EzUnpack cannot open it without one.',
  extracting: 'Opening the archive...',
  errorNotArchive:
    'This is not an archive, so there is nothing to unpack. EzUnpack opens ZIP, RAR and 7z files.',
  errorImport: 'EzUnpack could not take a copy of this file. Please try sending it again.',
  errorPermission:
    'EzUnpack was not allowed to put files in Photos. Give it permission and try again.',
  errorUnreadable:
    'This file could not be read. It may be damaged, or it may need a password.',
  errorWrite: 'The files could not be saved. Check that the phone has free space left.',
  errorDelete: 'This archive could not be removed. Please try again.',
  errorNoVoice: 'This phone cannot listen. You can still type the name in the box above.',
  errorSaveToPhone:
    'The file could not be put there. There may already be one with the same name — try another folder.',
  crashTitle: 'Something went wrong',
  crashBody:
    'This is our mistake, not yours. Nothing has been lost — your photos are still in Photos and your files are still here.\n\nIf you tell us what you were doing, we can fix it.',
  crashSend: 'Tell us what happened',
  crashRetry: 'Try again',
  crashMailSubject: 'EzUnpack stopped working',
  crashMailPrompt: 'Please write here what you were doing when this happened:',
  crashNoMail:
    'No email app could be opened on this phone. Try again after closing and reopening EzUnpack.',
  toggles: [
    ['Bigger text', 'Make all writing larger'],
    ['Louder sounds', 'A sound plays when files are saved'],
    ['Ask before saving', 'We check with you every time'],
  ],
  videos: [
    ['How to open an archive', 'Step by step, one tap at a time'],
    ['Where did my photos go?', 'Find saved files in your gallery'],
    ['Is this file safe?', 'How to tell before you open it'],
  ],
};

const ro: Strings = {
  search: 'Caută fișiere...',
  quick: 'Ce dorești să faci?',
  newArchives: 'Arhive Noi',
  newArchivesSub: 'Încă nedeschise',
  savedFiles: 'Fișiere Salvate',
  savedFilesSub: 'Poze și documente',
  feed: 'Arhive Găsite Recent',
  feedNew: 'Încă Nedeschise',
  feedSaved: 'Deja Salvate',
  showAll: 'Arată toate arhivele',
  unpack: 'DESPACHETEAZĂ',
  unpackAgain: 'SALVEAZĂ DIN NOU',
  savedTag: 'Salvat',
  look: 'Aspect',
  lookSub: 'Două feluri de a vedea aplicația',
  minimal: 'Minimalist',
  brutal: 'Îndrăzneț',
  found: (n) => `${n} găsite`,
  inside: (n) => `${n} fișiere înăuntru`,
  hint: 'Trimite o arhivă către EzUnpack din WhatsApp sau Email, ori deschide-o cu butonul de sus. Păstrăm o copie a noastră, ca s-o găsești mereu aici.',
  emptyFeedTitle: 'Încă nu e nimic aici',
  emptyFeedSub:
    'Când îți trimite cineva o arhivă, alege Distribuie sau Deschide cu, și apasă pe EzUnpack. Va apărea chiar aici.',
  emptySearchTitle: 'Nimic cu numele acesta',
  emptySearchSub: 'Încearcă o parte din nume sau șterge ce ai scris în căsuță.',
  emptyNewTitle: 'Nimic nou acum',
  emptyNewSub: 'Ai deschis tot ce am găsit. Te anunțăm noi când mai apare ceva.',
  emptySavedTitle: 'Încă nu ai salvat nimic',
  emptySavedSub: 'Deschide o arhivă și apasă butonul verde. Ce salvezi apare aici.',
  navHome: 'Acasă',
  navGuide: 'Ghid Video',
  navSettings: 'Setări',
  sheetSub: 'Fișierele se salvează direct în galeria telefonului!',
  saveAll: 'Salvează în Poze și Documente',
  notNow: 'Mai târziu',
  openFolder: 'Vezi fișierele',
  folderSub: (n) => `${n} fișiere, salvate și te așteaptă`,
  whereGallery: 'În Poze',
  whereApp: 'Păstrat aici, în EzUnpack',
  sendFile: 'Trimite',
  saveToPhone: 'Salvează pe telefon',
  saveToPhoneDone: 'Salvat în folderul pe care l-ai ales.',
  folderKeepNote:
    'Pozele și filmulețele sunt și în Poze, deci rămân pe telefon chiar dacă ștergi EzUnpack. Celelalte fișiere stau aici.',
  folderEditNote:
    'Dacă deschizi un fișier de aici în altă aplicație — Word, de exemplu — și îl salvezi acolo, modificările rămân la acea aplicație, iar ea hotărăște unde le pune. Aici rămâne mereu originalul din arhivă. Ca să pui o copie într-un loc pe care îl regăsești, folosește „Salvează pe telefon".',
  confirmTitle: 'Salvăm aceste fișiere?',
  confirmBody: (n) => `Punem ${n} fișiere în Poze și în Documente.`,
  confirmYes: 'Da, salvează-le',
  deleteArchive: 'Șterge arhiva',
  deleteTitle: 'Ștergem această arhivă?',
  deleteBody: (name) =>
    `Ștergem „${name}" și fișierele pe care EzUnpack le-a păstrat pentru ea. Pozele și filmulețele rămân în Poze.`,
  deleteYes: 'Da, șterge-o',
  saving: 'Se salvează fișierele...',
  doneTitle: 'Toate fișierele au fost salvate!',
  openPhotos: 'Deschide Poze',
  listening: 'Ascult... spune numele fișierului',
  cancel: 'Renunță',
  guideTitle: 'Uită-te și învață',
  guideSub: 'Filmulețe scurte. Imagini mari. Fără grabă.',
  guideNotice:
    'Filmulețele încă se filmează, deci niciunul nu pornește încă. Când vor fi gata, apar aici de la sine — nu ai nimic de instalat sau de pornit. Mai jos vezi ce se pregătește.',
  videoSoonTitle: 'Încă nu e filmat',
  videoSoonBody:
    'Acesta încă se pregătește. Va apărea aici de la sine când e gata — nu trebuie să revii să verifici.',
  videoSoonBadge: 'Curând',
  unnamedArchive: (received) => `Arhivă primită ${shortDate(received)}`,
  settingsTitle: 'Setări',
  langRow: 'Limbă',
  langRowSub: 'La început urmează telefonul',
  storageTitle: 'Locul de pe telefon',
  storageBody: (bytes) => `EzUnpack ține ${humanSize(bytes)} pe telefonul tău.`,
  storageTidy: 'Tot ce e aici ține de o arhivă pe care o vezi. Nu e nimic de făcut curat.',
  storageLeftover: (bytes) =>
    `${humanSize(bytes)} au rămas de la arhive care nu mai există. Fișierele acelea nu se mai pot deschide de nicăieri.`,
  storageClean: (bytes) => `Eliberează ${humanSize(bytes)}`,
  storageCleanYes: 'Da, eliberează',
  storageDone: (bytes) => `${humanSize(bytes)} sunt liberi din nou.`,
  primerTitle: 'Un lucru înainte să începem',
  primerBody:
    'EzUnpack pune pozele și filmulețele din arhive direct în Poze, acolo unde te uiți deja la imaginile tale.\n\nÎn câteva clipe telefonul o să te întrebe dacă ne dai voie. Apasă Permite — nimic nu pleacă de pe telefonul tău.',
  primerButton: 'Am înțeles, continuă',
  primerSkip: 'Mai târziu',
  ok: 'OK',
  source: {
    picked: 'L-ai ales tu',
    shared: 'Trimis către EzUnpack',
    opened: 'Păstrat aici pentru tine',
  },
  sizeLabel: (bytes) => sized(['Fișier mic', 'Fișier mediu', 'Fișier mare'], bytes),
  openFile: 'Deschide tu un fișier',
  openFileSub: 'Alege o arhivă din telefon',
  reading: 'Se uită înăuntru...',
  emptyArchive: 'Nu este nimic în această arhivă.',
  doneWhere: (gallery, documents) => {
    if (gallery > 0 && documents > 0) {
      return 'Pozele și filmulețele sunt în Poze. Restul te așteaptă la „Vezi fișierele".';
    }
    if (gallery > 0) return 'Le găsești în Poze, pe telefonul tău.';
    return 'Te așteaptă la „Vezi fișierele".';
  },
  errorTitle: 'Nu a mers',
  errorPassword:
    'Această arhivă este încuiată cu o parolă. EzUnpack nu o poate deschide fără ea.',
  extracting: 'Se deschide arhiva...',
  errorNotArchive:
    'Acesta nu este o arhivă, deci nu are ce să despacheteze. EzUnpack deschide fișiere ZIP, RAR și 7z.',
  errorImport: 'EzUnpack nu a putut face o copie a acestui fișier. Încearcă să-l trimiți din nou.',
  errorPermission:
    'EzUnpack nu a primit voie să pună fișiere în Poze. Dă-i permisiunea și încearcă din nou.',
  errorUnreadable:
    'Fișierul nu a putut fi citit. Poate este stricat sau are nevoie de o parolă.',
  errorWrite: 'Fișierele nu au putut fi salvate. Verifică dacă mai ai loc liber pe telefon.',
  errorDelete: 'Arhiva nu a putut fi ștearsă. Mai încearcă o dată.',
  errorNoVoice: 'Telefonul acesta nu poate asculta. Poți scrie numele în căsuța de sus.',
  errorSaveToPhone:
    'Fișierul nu a putut fi pus acolo. Poate există deja unul cu același nume — încearcă alt folder.',
  crashTitle: 'Ceva nu a mers',
  crashBody:
    'Este greșeala noastră, nu a ta. Nu s-a pierdut nimic — pozele sunt tot în Poze, iar fișierele tale sunt tot aici.\n\nDacă ne spui ce făceai, o putem repara.',
  crashSend: 'Spune-ne ce s-a întâmplat',
  crashRetry: 'Încearcă din nou',
  crashMailSubject: 'EzUnpack s-a oprit',
  crashMailPrompt: 'Te rugăm să scrii aici ce făceai când s-a întâmplat:',
  crashNoMail:
    'Nu s-a putut deschide nicio aplicație de e-mail pe acest telefon. Încearcă din nou după ce închizi și redeschizi EzUnpack.',
  toggles: [
    ['Text mai mare', 'Mărește toate scrisurile'],
    ['Sunete mai tari', 'Se aude un sunet la salvare'],
    ['Întreabă înainte de salvare', 'Te consultăm de fiecare dată'],
  ],
  videos: [
    ['Cum deschizi o arhivă', 'Pas cu pas, o apăsare pe rând'],
    ['Unde au ajuns pozele mele?', 'Găsește fișierele în galerie'],
    ['Este sigur acest fișier?', 'Cum verifici înainte să-l deschizi'],
  ],
};

export const STRINGS: Record<Lang, Strings> = { en, ro };
