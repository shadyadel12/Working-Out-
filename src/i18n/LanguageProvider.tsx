import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Language = "en" | "ar";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
} | null>(null);

const ar: Record<string, string> = {
  Client: "العميل",
  Dashboard: "لوحة التحكم",
  Library: "المكتبة",
  Exercises: "التمارين",
  Exercise: "تمرين",
  Workouts: "الحصص التدريبية",
  Workout: "حصة تدريبية",
  Programs: "البرامج",
  Program: "البرنامج",
  "Check-ups": "المتابعات",
  Messages: "الرسائل",
  Team: "الفريق",
  Subs: "الاشتراكات",
  Settings: "الإعدادات",
  Support: "الدعم",
  "My Profile": "ملفي الشخصي",
  Diet: "النظام الغذائي",
  Progress: "التقدم",
  "Diet Progress": "تقدم النظام الغذائي",
  Chat: "المحادثة",
  Account: "الحساب",
  "Sign out": "تسجيل الخروج",
  "Coach workspace": "مساحة المدرب",
  Save: "حفظ",
  "Saving…": "جارٍ الحفظ…",
  Cancel: "إلغاء",
  Delete: "حذف",
  Edit: "تعديل",
  Copy: "نسخ",
  "Copied ✓": "تم النسخ ✓",
  Close: "إغلاق",
  Back: "رجوع",
  Next: "التالي",
  Previous: "السابق",
  Apply: "تطبيق",
  Clear: "مسح",
  Search: "بحث",
  Status: "الحالة",
  Active: "نشط",
  Expired: "منتهي",
  Pending: "قيد الانتظار",
  Revoked: "ملغي",
  Yes: "نعم",
  No: "لا",
  Name: "الاسم",
  Email: "البريد الإلكتروني",
  Date: "التاريخ",
  Role: "الدور",
  Duration: "المدة",
  Description: "الوصف",
  Notes: "ملاحظات",
  Goals: "الأهداف",
  Video: "فيديو",
  Weight: "الوزن",
  Reps: "التكرارات",
  Sets: "المجموعات",
  Week: "الأسبوع",
  Today: "اليوم",
  "Loading…": "جارٍ التحميل…",
  Remove: "إزالة",
  Duplicate: "تكرار",
  View: "عرض",
  Hide: "إخفاء",
  Done: "مكتمل",
  Note: "ملاحظة",
  Range: "الفترة",
  "All time": "كل الوقت",
  "This week": "هذا الأسبوع",
  "This month": "هذا الشهر",
  "Today only": "اليوم فقط",
  Clients: "العملاء",
  "Manage your players and open their coaching tools.":
    "إدارة اللاعبين وفتح أدوات التدريب الخاصة بهم.",
  "Renew Date": "تاريخ التجديد",
  "Search clients": "البحث عن العملاء",
  "Needs Programming": "يحتاج برنامجًا",
  "Renew date": "تاريخ التجديد",
  "Open profile": "فتح الملف",
  "Unclaimed key": "مفتاح غير مستخدم",
  "Waiting for player signup": "بانتظار تسجيل اللاعب",
  "No clients match these filters.": "لا يوجد عملاء مطابقون لهذه الفلاتر.",
  "Daily check-ups": "المتابعات اليومية",
  "No players to check in on.": "لا يوجد لاعبون للمتابعة اليوم.",
  Checked: "تمت المتابعة",
  "Mark checked": "تحديد كمتابَع",
  "Generate Player Key": "إنشاء مفتاح لاعب",
  "Generate Key": "إنشاء المفتاح",
  "Generating…": "جارٍ الإنشاء…",
  "VIP Player": "لاعب VIP",
  "VIP players appear in check-ups every day.":
    "يظهر لاعب VIP في المتابعات يوميًا.",
  "Check-ups each week": "مرات المتابعة أسبوعيًا",
  "Days are automatically spaced apart.":
    "يتم توزيع الأيام تلقائيًا دون تتابع.",
  "Pending Keys": "المفاتيح المعلقة",
  "Player Subscriptions": "اشتراكات اللاعبين",
  "No registered players yet.": "لا يوجد لاعبون مسجلون بعد.",
  Renew: "تجديد",
  "Renewing…": "جارٍ التجديد…",
  "Confirm Renewal": "تأكيد التجديد",
  "Daily check-up": "متابعة يومية",
  Standard: "عادي",
  Expires: "ينتهي",
  "Create player subscription keys and renew existing access.":
    "إنشاء مفاتيح اشتراك اللاعبين وتجديد الوصول الحالي.",
  "No player conversations yet.": "لا توجد محادثات مع اللاعبين بعد.",
  "Chat with your coach": "تحدث مع مدربك",
  "Type a message… (Enter to send, Shift+Enter for new line)":
    "اكتب رسالة… (Enter للإرسال وShift+Enter لسطر جديد)",
  Send: "إرسال",
  Attach: "إرفاق",
  Record: "تسجيل",
  Stop: "إيقاف",
  Photo: "صورة",
  Audio: "صوت",
  Image: "صورة",
  Message: "رسالة",
  "Exercise Library": "مكتبة التمارين",
  "Workout Library": "مكتبة الحصص",
  "Program Library": "مكتبة البرامج",
  "Add Workout": "إضافة حصة تدريبية",
  "Create Program": "إنشاء برنامج",
  "Edit Program": "تعديل البرنامج",
  "Program Name": "اسم البرنامج",
  "Workout Name": "اسم الحصة",
  "Exercise Name": "اسم التمرين",
  Equipment: "المعدات",
  Category: "التصنيف",
  "Exercise Instructions": "تعليمات التمرين",
  "Muscle Groups": "المجموعات العضلية",
  "Default Note": "الملاحظة الافتراضية",
  "Movement Pattern": "نمط الحركة",
  "Tracking Fields (Up to 3) *": "حقول التتبع (حتى 3) *",
  "Select Equipment": "اختر المعدات",
  "Select Category": "اختر التصنيف",
  "Select Muscle Groups": "اختر المجموعات العضلية",
  "Select Movement Pattern": "اختر نمط الحركة",
  "Select Tracking Fields": "اختر حقول التتبع",
  "Save Exercise": "حفظ التمرين",
  "No Exercises Found": "لا توجد تمارين",
  "No Workouts Found": "لا توجد حصص تدريبية",
  "No Programs Found": "لا توجد برامج",
  "Use Exercise Library": "استخدام مكتبة التمارين",
  "Choose a saved exercise…": "اختر تمرينًا محفوظًا…",
  "Use a saved workout": "استخدام حصة محفوظة",
  "Create a new workout": "إنشاء حصة جديدة",
  "Save to workout library": "حفظ في مكتبة الحصص",
  "Add exercise": "إضافة تمرين",
  "Add saved workout": "إضافة الحصة المحفوظة",
  "Delete workout": "حذف الحصة",
  "Duplicate Workout": "تكرار الحصة",
  "Delete Workout?": "حذف الحصة؟",
  "Coach notes (optional)": "ملاحظات المدرب (اختياري)",
  "Target sets": "المجموعات المستهدفة",
  "Target reps": "التكرارات المستهدفة",
  "Target weight": "الوزن المستهدف",
  "Difficulty Level": "مستوى الصعوبة",
  Beginner: "مبتدئ",
  Intermediate: "متوسط",
  Advanced: "متقدم",
  "Duration (Weeks)": "المدة (بالأسابيع)",
  "Description (Optional)": "الوصف (اختياري)",
  "Import from Library": "استيراد من المكتبة",
  "Add New Exercise": "إضافة تمرين جديد",
  "Add workout": "إضافة حصة",
  "Save Changes": "حفظ التغييرات",
  "Assign Program": "تعيين برنامج",
  "Saved Program": "برنامج محفوظ",
  "Choose saved program": "اختر برنامجًا محفوظًا",
  "Starting week": "أسبوع البداية",
  "Duplicate week": "تكرار الأسبوع",
  "Duplicate day…": "تكرار اليوم…",
  "Training day": "يوم تدريب",
  "Rest day": "يوم راحة",
  "Save day": "حفظ اليوم",
  "Create day": "إنشاء اليوم",
  "Team Management": "إدارة الفريق",
  "Invite team members, control roles, and assign clients.":
    "دعوة أعضاء الفريق والتحكم في الأدوار وتعيين العملاء.",
  "Total Members": "إجمالي الأعضاء",
  "Pending Invites": "الدعوات المعلقة",
  "Generate Team Key": "إنشاء مفتاح الفريق",
  "Read Only": "قراءة فقط",
  "Chat Support": "دعم المحادثة",
  "Head Coach": "المدرب الرئيسي",
  Sales: "المبيعات",
  "Assign Client": "تعيين عميل",
  "Choose client…": "اختر عميلًا…",
  Revoke: "إلغاء الصلاحية",
  "No Team Members": "لا يوجد أعضاء فريق",
  "Invitation Keys": "مفاتيح الدعوة",
  "Team Member": "عضو فريق",
  "Coach Owner": "مالك الحساب",
  "Team invitation key": "مفتاح دعوة الفريق",
  "My Progress": "تقدمي",
  "Diet plan": "خطة الغذاء",
  "Save today’s progress": "حفظ تقدم اليوم",
  "Optional note for your coach": "ملاحظة اختيارية لمدربك",
  "Complete Your Profile": "أكمل ملفك الشخصي",
  "Your coach uses this information to create a safe, suitable plan.":
    "يستخدم مدربك هذه المعلومات لإنشاء خطة آمنة ومناسبة.",
  "Gender *": "النوع *",
  "Date of Birth *": "تاريخ الميلاد *",
  "Height *": "الطول *",
  "Country *": "الدولة *",
  "Mobile Number *": "رقم الهاتف *",
  "Sport *": "الرياضة *",
  "Position *": "المركز *",
  "Sport Level *": "المستوى الرياضي *",
  "Experience Level *": "مستوى الخبرة *",
  "Select gender": "اختر النوع",
  Male: "ذكر",
  Female: "أنثى",
  Other: "آخر",
  "Prefer not to say": "أفضل عدم الإجابة",
  Recreational: "ترفيهي",
  Amateur: "هاوٍ",
  "Semi-professional": "شبه محترف",
  Professional: "محترف",
  "Save Profile": "حفظ الملف",
  "Subscription expired": "انتهى الاشتراك",
  Unlock: "فتح الوصول",
  Transform: "غيّر",
  "Your Body": "جسمك",
  "Your Life": "حياتك",
  "Personal coaching platform": "منصة تدريب شخصي",
  "Start Training": "ابدأ التدريب",
  "Log in": "تسجيل الدخول",
  "I'm a Player →": "أنا لاعب ←",
  "I'm a Coach": "أنا مدرب",
  Custom: "مخصص",
  Weekly: "أسبوعي",
  Live: "مباشر",
  "Diet Plans": "خطط غذائية",
  "Coach Chat": "محادثة المدرب",
  "Today's Workout": "تمرين اليوم",
  "Warm Up": "الإحماء",
  "Main Workout": "التمرين الرئيسي",
  "Cool Down": "التهدئة",
  "Terms of Use": "شروط الاستخدام",
  "App Features & Updates": "ميزات التطبيق والتحديثات",
  "Latest improvements": "أحدث التحسينات",
  "Coach sign up": "تسجيل مدرب",
  "Player sign up": "تسجيل لاعب",
  "Coach sign in": "دخول المدرب",
  "Player sign in": "دخول اللاعب",
  "Admin sign in": "دخول الإدارة",
  Password: "كلمة المرور",
  "Sign up": "إنشاء حساب",
  "Sign in": "تسجيل الدخول",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Coach key": "مفتاح المدرب",
  "Subscription key": "مفتاح الاشتراك",
  "Player Information": "معلومات اللاعب",
  "Limitations and Injuries": "القيود والإصابات",
  "Available Equipment": "المعدات المتاحة",
  "Coach Notes": "ملاحظات المدرب",
  "Client Goals": "أهداف العميل",
  Communication: "التواصل",
  "Open Chat": "فتح المحادثة",
  "Coach Messages": "رسائل المدرب",
  "Training Plan": "خطة التدريب",
  "Diet Plan": "خطة الغذاء",
  "Workout Completion": "إكمال التمارين",
  "Diet Adherence": "الالتزام بالغذاء",
  "Member since": "عضو منذ",
  "Last workout": "آخر تمرين",
  "Mobile Number": "رقم الهاتف",
  "Date of Birth": "تاريخ الميلاد",
  Height: "الطول",
  Country: "الدولة",
  Sport: "الرياضة",
  Position: "المركز",
  "Sport Level": "المستوى الرياضي",
  "Experience Level": "مستوى الخبرة",
};

const textOriginals = new WeakMap<Text, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();

function translateText(value: string): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;
  if (ar[core]) return leading + ar[core] + trailing;
  const patterns: Array<[RegExp, (...parts: string[]) => string]> = [
    [/^Week (\d+)$/, (n) => `الأسبوع ${n}`],
    [/^Day (\d+)$/, (n) => `اليوم ${n}`],
    [/^Page (\d+) of (\d+)$/, (a, b) => `صفحة ${a} من ${b}`],
    [/^(\d+) week$/, (n) => `${n} أسبوع`],
    [/^(\d+) weeks$/, (n) => `${n} أسابيع`],
    [/^(\d+) month$/, (n) => `${n} شهر`],
    [/^(\d+) months$/, (n) => `${n} أشهر`],
    [/^(\d+) days\/week$/, (n) => `${n} أيام/أسبوع`],
    [/^(\d+) check-ups\/week$/, (n) => `${n} متابعات/أسبوع`],
    [/^Exercise (\d+)$/, (n) => `تمرين ${n}`],
    [/^Expires (.+)$/, (d) => `ينتهي ${d}`],
    [/^to (.+)$/, (x) => `إلى ${x}`],
  ];
  for (const [pattern, make] of patterns) {
    const match = core.match(pattern);
    if (match) return leading + make(...match.slice(1)) + trailing;
  }
  return value;
}

function translateNode(root: Node, language: Language) {
  const texts: Text[] = [];
  if (root.nodeType === Node.TEXT_NODE) texts.push(root as Text);
  else {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) texts.push(node as Text);
  }
  for (const text of texts) {
    const parent = text.parentElement;
    if (
      !parent ||
      parent.closest("[data-no-translate]") ||
      ["SCRIPT", "STYLE", "CODE"].includes(parent.tagName)
    )
      continue;
    if (!textOriginals.has(text)) textOriginals.set(text, text.nodeValue ?? "");
    const original = textOriginals.get(text)!;
    text.nodeValue = language === "ar" ? translateText(original) : original;
  }
  const elements =
    root.nodeType === Node.ELEMENT_NODE
      ? [root as Element, ...(root as Element).querySelectorAll("*")]
      : [];
  for (const element of elements)
    for (const attr of ["placeholder", "title", "aria-label"]) {
      const current = element.getAttribute(attr);
      if (!current) continue;
      let map = attributeOriginals.get(element);
      if (!map) {
        map = new Map();
        attributeOriginals.set(element, map);
      }
      if (!map.has(attr)) map.set(attr, current);
      const original = map.get(attr)!;
      element.setAttribute(
        attr,
        language === "ar" ? translateText(original) : original,
      );
    }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    localStorage.getItem("app_language") === "ar" ? "ar" : "en",
  );
  const busy = useRef(false);
  const setLanguage = (next: Language) => {
    localStorage.setItem("app_language", next);
    setLanguageState(next);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("rtl", language === "ar");
    busy.current = true;
    translateNode(document.body, language);
    busy.current = false;
    const observer = new MutationObserver((mutations) => {
      if (busy.current) return;
      busy.current = true;
      for (const mutation of mutations)
        for (const node of mutation.addedNodes) translateNode(node, language);
      busy.current = false;
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
      <button
        type="button"
        className="language-toggle"
        data-no-translate
        onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      >
        {language === "en" ? "العربية" : "English"}
      </button>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider missing");
  return value;
}
