import { Linking, Text } from 'react-native';
import { Card, Screen, textStyles } from '../components/Screen';
import { Button } from '../components/Controls';
import { tr, useLanguage } from '../i18n/MobileLanguage';

export const SUPPORT_EMAIL = 'trainova5@gmail.com';
export const PRIVACY_URL = 'https://working-out-rho.vercel.app/privacy';
export const SUPPORT_URL = 'https://working-out-rho.vercel.app/support';
export const COMMUNITY_URL = 'https://working-out-rho.vercel.app/community-standards';
const open = (url: string) => void Linking.openURL(url);

const legalArabic: Record<string,string> = {
  'Trainova Privacy Policy':'سياسة خصوصية ترينوفا','Trainova Terms of Use':'شروط استخدام ترينوفا','Community Standards':'معايير المجتمع','Trainova Support':'دعم ترينوفا','Features & Updates':'الميزات والتحديثات',
  'Information collected':'المعلومات التي نجمعها','How it is used':'كيفية استخدام المعلومات','Limited processor access':'وصول محدود لمقدمي الخدمة','Retention and deletion':'الاحتفاظ والحذف','Your rights':'حقوقك',
  'Accounts and coaching access':'الحسابات وصلاحية التدريب','Your content':'المحتوى الخاص بك','Data processors':'مقدمو معالجة البيانات','Fitness disclaimer':'إخلاء مسؤولية التدريب','Moderation':'إدارة المحتوى',
  'Safe and respectful':'محتوى آمن ومحترم','Ownership and attribution':'الملكية ونسب المصدر','Reports and blocking':'الإبلاغ والحظر','How to contact us':'طريقة التواصل معنا','Coaches':'للمدربين','Players':'للاعبين','Protection':'الحماية',
  'Account and profile details; fitness, nutrition, workout, progress and check-in data; messages and support requests; photos, videos, voice and files; and security, device, platform, app-version, error and network data.':'بيانات الحساب والملف الشخصي؛ وبيانات التدريب والتغذية والتمارين والتقدم والمتابعات؛ والرسائل وطلبات الدعم؛ والصور والفيديو والصوت والملفات؛ وبيانات الأمان والجهاز والمنصة وإصدار التطبيق والأخطاء والشبكة.',
  'To provide coaching, plans, progress, communication and support; protect accounts; prevent abuse; moderate public content; comply with law; and improve reliability. Health information is not used for advertising.':'لتقديم التدريب والخطط وعرض التقدم والتواصل والدعم، وحماية الحسابات ومنع الإساءة وإدارة المحتوى العام والالتزام بالقانون وتحسين الموثوقية. لا نستخدم المعلومات الصحية للإعلانات.',
  'Supabase supports accounts, databases and private storage; Cloudflare/R2 supports delivery, security and private media; Vercel hosts the web app; Expo/EAS builds and updates mobile apps; VirusTotal may scan files where enabled. Authorized coaches and permitted team members can access the players they support.':'تدير Supabase الحسابات وقواعد البيانات والتخزين الخاص؛ وتدعم Cloudflare/R2 التوصيل والأمان والوسائط الخاصة؛ وتستضيف Vercel الموقع؛ وتبني Expo/EAS تطبيقات الهاتف وتحدثها؛ وقد يفحص VirusTotal الملفات عند تفعيله. يمكن للمدربين وأعضاء الفريق المصرح لهم الوصول فقط إلى اللاعبين الذين يدعمونهم.',
  'In-app deletion removes the Auth account and deletes or schedules private files. Minimal pseudonymous legal, security, transaction and moderation records may remain for up to 24 months. Backups expire through normal rotation.':'يحذف الحذف داخل التطبيق حساب الدخول ويحذف الملفات الخاصة أو يجدول حذفها. قد نحتفظ بسجلات قانونية وأمنية وسجلات معاملات وإدارة محتوى محدودة ومجهولة الهوية لمدة تصل إلى 24 شهراً. تنتهي النسخ الاحتياطية وفق دورة الاحتفاظ المعتادة.',
  'You may request access, correction, export, restriction, objection, or deletion where applicable. Device permissions can be withdrawn in system settings. Trainova is not intended for children under 13, subject to higher local age rules.':'يمكنك طلب الوصول أو التصحيح أو التصدير أو التقييد أو الاعتراض أو الحذف حسب القانون. يمكن سحب أذونات الجهاز من إعدادات النظام. ترينوفا غير مخصص لمن هم دون 13 عاماً مع مراعاة الأعمار الأعلى التي يفرضها القانون المحلي.',
};

function Legal({ title, back, sections }: { title: string; back: () => void; sections: Array<[string, string]> }) {
  const { language }=useLanguage(); const tx=(value:string)=>language==='ar'?(legalArabic[value]??tr(value,language)):value;
  return <Screen title={tx(title)} subtitle={language==='ar'?'آخر تحديث: 24 يوليو 2026':'Last updated 24 July 2026'}>
    <Button secondary onPress={back}>{language==='ar'?'العودة →':'← BACK'}</Button>
    {sections.map(([heading, body]) => <Card key={heading}><Text style={textStyles.heading}>{tx(heading)}</Text><Text style={textStyles.body}>{tx(body)}</Text></Card>)}
    <Card><Text style={textStyles.body}>{language==='ar'?'التواصل':'Contact'}: {SUPPORT_EMAIL}</Text><Text selectable style={textStyles.muted}>{PRIVACY_URL}{'\n'}{SUPPORT_URL}</Text><Button secondary onPress={() => open(`mailto:${SUPPORT_EMAIL}`)}>{language==='ar'?'مراسلة الدعم':'EMAIL SUPPORT'}</Button><Button secondary onPress={() => open(SUPPORT_URL)}>{language==='ar'?'فتح موقع الدعم':'OPEN SUPPORT WEBSITE'}</Button></Card>
  </Screen>;
}

export function TermsScreen({ back }: { back: () => void }) {
  return <Legal title="Trainova Terms of Use" back={back} sections={[
    ['Accounts and coaching access', 'Use your own account and keep coaching access keys private. Coaching access is not described as an App Store subscription.'],
    ['Your content', 'You retain rights in content you create. Public publishers must confirm ownership or permission, preserve attribution, and follow the Community Standards.'],
    ['Data processors', 'Trainova does not sell personal data. Supabase, Cloudflare/R2, Vercel, Expo/EAS, and VirusTotal where applicable process limited data to operate and secure Trainova.'],
    ['Fitness disclaimer', 'Trainova supports coaching and information, not medical diagnosis or emergency care. Seek qualified medical advice before beginning a program.'],
    ['Moderation', 'Trainova may filter, quarantine, hide, remove, restore, or investigate content and accounts to protect users and rights holders.'],
  ]} />;
}

export function PrivacyScreen({ back }: { back: () => void }) {
  return <Legal title="Trainova Privacy Policy" back={back} sections={[
    ['Information collected', 'Account and profile details; fitness, nutrition, workout, progress and check-in data; messages and support requests; photos, videos, voice and files; and security, device, platform, app-version, error and network data.'],
    ['How it is used', 'To provide coaching, plans, progress, communication and support; protect accounts; prevent abuse; moderate public content; comply with law; and improve reliability. Health information is not used for advertising.'],
    ['Limited processor access', 'Supabase supports accounts, databases and private storage; Cloudflare/R2 supports delivery, security and private media; Vercel hosts the web app; Expo/EAS builds and updates mobile apps; VirusTotal may scan files where enabled. Authorized coaches and permitted team members can access the players they support.'],
    ['Retention and deletion', 'In-app deletion removes the Auth account and deletes or schedules private files. Minimal pseudonymous legal, security, transaction and moderation records may remain for up to 24 months. Backups expire through normal rotation.'],
    ['Your rights', 'You may request access, correction, export, restriction, objection, or deletion where applicable. Device permissions can be withdrawn in system settings. Trainova is not intended for children under 13, subject to higher local age rules.'],
  ]} />;
}

export function CommunityStandardsScreen({ back }: { back: () => void }) {
  return <Legal title="Community Standards" back={back} sections={[
    ['Safe and respectful', 'No harassment, hate, sexual content, graphic violence, threats, spam, scams, malicious links, illegal material, privacy violations, or dangerous fitness and nutrition instructions.'],
    ['Ownership and attribution', 'Publish only original, licensed, or lawfully linked content. Give the source, license and attribution for third-party material. Copyright notices can be sent to the support email.'],
    ['Reports and blocking', 'Users can report content and block public creators. Urgent safety reports target review within 24 hours and normal reports within 72 hours. Contact emergency services for immediate danger.'],
  ]} />;
}

export function SupportScreen({ back }: { back: () => void }) {
  return <Legal title="Trainova Support" back={back} sections={[
    ['How to contact us', `Email ${SUPPORT_EMAIL} for account, privacy, safety, copyright, coaching-access, or technical help. Include your role and a short description without exposing another person's private data.`],
  ]} />;
}

export function UpdatesScreen({ back }: { back: () => void }) {
  return <Legal title="Features & Updates" back={back} sections={[
    ['Coaches', 'Manage players, coaching access, workouts, nutrition, assignments, progress, private/public libraries, and communication.'],
    ['Players', 'Follow plans, record results and progress, complete assignments, and communicate with a coach.'],
    ['Protection', 'Role-based access, private media, reporting, blocking, moderation, and account deletion protect user data and community content.'],
  ]} />;
}
