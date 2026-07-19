import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme";
type Lang = "en" | "ar";
const C = createContext({ language: "en" as Lang, toggle: () => {} });
const ar: Record<string, string> = {
  Home: "الرئيسية",
  Players: "اللاعبون",
  Plans: "الخطط",
  Messages: "الرسائل",
  More: "المزيد",
  Program: "البرنامج",
  Diet: "النظام الغذائي",
  Progress: "التقدم",
  Coach: "المدرب",
  Overview: "نظرة عامة",
  "Users & Keys": "المستخدمون والمفاتيح",
  Support: "الدعم",
  Account: "الحساب",
  "Sign in": "تسجيل الدخول",
  "Create player account": "إنشاء حساب لاعب",
  "Create coach or team account": "إنشاء حساب مدرب أو فريق",
  "Back to sign in": "العودة لتسجيل الدخول",
  "Features & Updates": "الميزات والتحديثات",
  "Terms of Use": "شروط الاستخدام",
  "My Program": "برنامجي",
  "My Diet": "نظامي الغذائي",
  "Daily Check-ups": "المتابعات اليومية",
  "Build Plans": "إنشاء الخطط",
  Subscriptions: "الاشتراكات",
  Team: "الفريق",
  "Exercise Library": "مكتبة التمارين",
  "Workout Library": "مكتبة الحصص",
  "Diet Library": "مكتبة الأنظمة الغذائية",
  "Program Library": "مكتبة البرامج",
  "Admin Support": "دعم الإدارة",
  "SAVE PROFILE": "حفظ الملف",
  "SIGN OUT": "تسجيل الخروج",
  SAVE: "حفظ",
  DELETE: "حذف",
  EDIT: "تعديل",
  CANCEL: "إلغاء",
  "NEXT →": "التالي ←",
  "← BACK": "العودة →",
  "DONE ✓": "تم ✓",
  SEND: "إرسال",
  APPLY: "تطبيق",
  CLEAR: "مسح",
  REVOKE: "إلغاء الصلاحية",
  "RENEW 1 MONTH": "تجديد شهر",
  "MARK CHECKED": "تحديد كمتابَع",
  "CHECKED ✓": "تمت المتابعة ✓",
  "ADD WORKOUT": "إضافة حصة",
  "SAVE DIET DAY": "حفظ يوم الغذاء",
  "ASSIGN PROGRAM": "تعيين البرنامج",
  "Loading…": "جارٍ التحميل…",
  "No logged sessions yet.": "لا توجد جلسات مسجلة بعد.",
  "No diet check-ins yet.": "لا توجد متابعات غذائية بعد.",
  "No plan for this day.": "لا توجد خطة لهذا اليوم.",
  "COACH PLATFORM": "منصة التدريب",
  "Join coach team": "الانضمام إلى فريق المدرب",
  "Coach signup": "تسجيل مدرب",
  "Player signup": "تسجيل لاعب",
  OWNER: "المالك",
  "TEAM MEMBER": "عضو الفريق",
  "Full name": "الاسم الكامل",
  Email: "البريد الإلكتروني",
  Password: "كلمة المرور",
  "Team invitation key": "مفتاح دعوة الفريق",
  "Coach invitation key": "مفتاح دعوة المدرب",
  "Subscription key": "مفتاح الاشتراك",
  "SIGN IN": "تسجيل الدخول",
  "CREATE ACCOUNT": "إنشاء حساب",
  "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Name and access key are required.": "الاسم ومفتاح الدخول مطلوبان.",
  "Password needs 10 characters with upper/lowercase, a number, and a symbol.":
    "يجب أن تتكون كلمة المرور من 10 أحرف وتحتوي على أحرف كبيرة وصغيرة ورقم ورمز.",
  "That access key is invalid or already used.":
    "مفتاح الدخول غير صالح أو تم استخدامه.",
  "Check your email, then return to sign in.":
    "تحقق من بريدك الإلكتروني ثم عد لتسجيل الدخول.",
  "Create workout": "إنشاء حصة تدريبية",
  "Edit workout": "تعديل الحصة التدريبية",
  "Workout name": "اسم الحصة التدريبية",
  Description: "الوصف",
  Difficulty: "مستوى الصعوبة",
  Notes: "ملاحظات",
  "CREATE WORKOUT": "إنشاء الحصة",
  "SAVE WORKOUT": "حفظ الحصة",
  "ADD EXERCISE": "إضافة تمرين",
  "EDIT WORKOUT": "تعديل الحصة",
  "SAVE EXERCISE": "حفظ التمرين",
  "DELETE PROGRAM": "حذف البرنامج",
  "EDIT PROGRAM": "تعديل البرنامج",
  "ADD SCHEDULE DAY": "إضافة يوم للجدول",
  "SAVE SCHEDULE": "حفظ الجدول",
  "Week number": "رقم الأسبوع",
  "Day 1 to 7": "اليوم من 1 إلى 7",
  "Workout notes": "ملاحظات الحصة",
  "No players match this search.": "لا يوجد لاعبون مطابقون للبحث.",
  "Search players or keys": "ابحث عن لاعب أو مفتاح",
  "This section is available to head coaches only.":
    "هذا القسم متاح للمدرب الرئيسي فقط.",
  Chat: "المحادثة",
  "Type a message": "اكتب رسالة",
  "Subscription Required": "الاشتراك مطلوب",
  ACTIVATE: "تفعيل",
  "CHECKING…": "جارٍ التحقق…",
  "Enter a new subscription key from your coach to continue.":
    "أدخل مفتاح اشتراك جديدًا من مدربك للمتابعة.",
  "Admin Verification": "تحقق الإدارة",
  "Six-digit code": "رمز مكون من ستة أرقام",
  VERIFY: "تحقق",
  "Reps completed (required)": "التكرارات المنجزة (مطلوب)",
  "Weight used (optional)": "الوزن المستخدم (اختياري)",
  "Comment for your coach (optional)": "تعليق للمدرب (اختياري)",
  "Video link (optional)": "رابط الفيديو (اختياري)",
  Filters: "عوامل التصفية",
  "Workout name (optional)": "اسم الحصة (اختياري)",
  "Exercise name (optional)": "اسم التمرين (اختياري)",
  WORKOUT: "التمرين",
  DIET: "الغذاء",
  Adherence: "الالتزام",
  Meals: "الوجبات",
  Days: "الأيام",
  "Your plan, progress, and coach in one place":
    "خطتك وتقدمك ومدربك في مكان واحد",
  "Your training system": "نظام تدريبك",
  "Earn your progress": "اصنع تقدمك",
  "Follow the plan, log the work, and stay connected to your coach.":
    "اتبع الخطة وسجل عملك وابقَ على تواصل مع مدربك.",
  "Personal coaching": "تدريب شخصي",
  "VIP coaching": "تدريب مميز",
  "Date of birth (YYYY-MM-DD)": "تاريخ الميلاد (سنة-شهر-يوم)",
  "Height (example: 175 cm)": "الطول (مثال: 175 سم)",
  Country: "الدولة",
  "Mobile number": "رقم الهاتف",
  Sport: "الرياضة",
  "Position or role": "المركز أو الدور",
  "Finish day": "إنهاء اليوم",
  "MARK MEAL COMPLETED": "تحديد الوجبة كمكتملة",
  "✓ COMPLETED": "✓ مكتملة",
  "Add an optional note for your coach, then tap Done.":
    "أضف ملاحظة اختيارية لمدربك ثم اضغط تم.",
  "Optional note": "ملاحظة اختيارية",
  "SAVING…": "جارٍ الحفظ…",
  Name: "الاسم",
  "Message the admin team": "راسل فريق الإدارة",
  "Exercise name": "اسم التمرين",
  Sets: "المجموعات",
  Reps: "التكرارات",
  Weight: "الوزن",
  "Coach note": "ملاحظة المدرب",
  "Meal label": "اسم الوجبة",
  Food: "الطعام",
  Grams: "الجرامات",
  "Coach comment": "تعليق المدرب",
  "Starting week": "أسبوع البداية",
  "Template name": "اسم القالب",
  "Program name": "اسم البرنامج",
  "Duration in weeks": "المدة بالأسابيع",
  "Your coaching workspace at a glance": "مساحة التدريب الخاصة بك في لمحة",
  "Build stronger athletes": "ابنِ رياضيين أقوى",
  "Programming, accountability, and communication in one focused workspace.":
    "البرمجة والمتابعة والتواصل في مساحة واحدة مركزة.",
  "Profiles, plans, progress, and communication":
    "الملفات والخطط والتقدم والتواصل",
  "Message for this player": "رسالة لهذا اللاعب",
  "Coach notes": "ملاحظات المدرب",
  "Client goals": "أهداف العميل",
  "Limitations and injuries": "القيود والإصابات",
  "Available equipment": "المعدات المتاحة",
  "Coach Settings": "إعدادات المدرب",
  "Generate player key": "إنشاء مفتاح لاعب",
  "Saved workout library": "مكتبة الحصص المحفوظة",
  "No saved workouts yet.": "لا توجد حصص محفوظة بعد.",
  "Open support conversation": "فتح محادثة الدعم",
  "Reply to coach": "الرد على المدرب",
  BACK: "رجوع",
  "Admin Overview": "نظرة عامة للإدارة",
  "Users, access, and support activity": "المستخدمون والدخول ونشاط الدعم",
  "Users & Access": "المستخدمون والدخول",
  "Search coaches": "البحث عن المدربين",
  RESTORE: "استعادة",
  Monday: "الاثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
  Saturday: "السبت",
  Sunday: "الأحد",
  "For Coaches": "للمدربين",
  "For Players": "للاعبين",
  "For Administrators": "للإدارة",
  Protection: "الحماية",
  "Manage players, subscriptions, VIP priority and scheduled check-ups.":
    "إدارة اللاعبين والاشتراكات وأولوية المميزين والمتابعات المجدولة.",
  "Build and reuse workout, diet and program libraries.":
    "إنشاء وإعادة استخدام مكتبات التدريب والغذاء والبرامج.",
  "Review workout and diet progress, notes, goals and submitted videos.":
    "مراجعة تقدم التدريب والغذاء والملاحظات والأهداف والفيديوهات.",
  "Use private player chat and administrator support.":
    "استخدام محادثة اللاعب الخاصة ودعم الإدارة.",
  "Follow guided set-by-set workouts and meal-by-meal diet plans.":
    "اتباع التدريب مجموعة بمجموعة وخطة الغذاء وجبة بوجبة.",
  "Record reps, optional weight, comments and safely scanned videos.":
    "تسجيل التكرارات والوزن الاختياري والتعليقات والفيديوهات المفحوصة.",
  "Filter workout and diet progress and update the full sports profile.":
    "تصفية تقدم التدريب والغذاء وتحديث الملف الرياضي الكامل.",
  "Send text, pictures, videos, audio and voice messages.":
    "إرسال النصوص والصور والفيديو والصوت والرسائل الصوتية.",
  "Manage coaches, invitations, player access, renewals and revocation.":
    "إدارة المدربين والدعوات ودخول اللاعبين والتجديد والإلغاء.",
  "Use extra account verification and answer coach support.":
    "استخدام تحقق إضافي للحساب والرد على دعم المدربين.",
  "Role-based database rules remain the final access boundary.":
    "تظل قواعد قاعدة البيانات حسب الدور هي حد الوصول النهائي.",
  "Uploads are checked for size, type and actual content.":
    "يتم فحص الملفات المرفوعة من حيث الحجم والنوع والمحتوى.",
  "Sessions use protected device storage and expired access is blocked.":
    "تستخدم الجلسات تخزين الجهاز المحمي ويتم منع الدخول المنتهي.",
  "1. Ownership & Copyright": "1. الملكية وحقوق النشر",
  "2. Prohibited Actions": "2. الإجراءات المحظورة",
  "3. User Data": "3. بيانات المستخدم",
  "4. Accounts & Access": "4. الحسابات والدخول",
  "5. Disclaimer": "5. إخلاء المسؤولية",
  "6. Changes": "6. التغييرات",
  "7. Contact": "7. التواصل",
};
export function tr(value: string, language: Lang) {
  if (language === "en") return value;
  if (ar[value]) return ar[value];
  return value
    .replace(/^Welcome, (.+)$/, "مرحبًا، $1")
    .replace(/^Hi, (.+)$/, "مرحبًا، $1")
    .replace(/^WEEK (\d+)$/, "الأسبوع $1")
    .replace(/^Set (\d+) of (\d+)$/, "المجموعة $1 من $2")
    .replace(/^Meal (\d+) of (\d+)$/, "الوجبة $1 من $2")
    .replace(/^(\d+) days\/week$/, "$1 أيام في الأسبوع")
    .replace(/^(\d+) meals followed$/, "تم اتباع $1 وجبات");
}
export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Lang>("en");
  useEffect(() => {
    AsyncStorage.getItem("mobile_language").then(
      (x) => x === "ar" && setLanguage("ar"),
    );
  }, []);
  const toggle = () =>
    setLanguage((x) => {
      const n = x === "en" ? "ar" : "en";
      void AsyncStorage.setItem("mobile_language", n);
      return n;
    });
  return <C.Provider value={{ language, toggle }}>{children}</C.Provider>;
}
export function useLanguage() {
  return useContext(C);
}
export function LanguageButton() {
  const { language, toggle } = useLanguage();
  return (
    <Pressable onPress={toggle} style={styles.button}>
      <Text style={styles.text}>
        {language === "en" ? "العربية" : "English"}
      </Text>
    </Pressable>
  );
}
export function localizeTree(node: ReactNode, language: Lang): ReactNode {
  if (typeof node === "string") return tr(node, language);
  if (typeof node === "number" || node == null || typeof node === "boolean")
    return node;
  if (Array.isArray(node)) return node.map((x) => localizeTree(x, language));
  if (isValidElement(node)) {
    const props = node.props as {
      children?: ReactNode;
      placeholder?: string;
      title?: string;
      subtitle?: string;
      eyebrow?: string;
      text?: string;
      label?: string;
    };
    const next: Record<string, unknown> = {};
    if (props.children !== undefined)
      next.children = Children.map(props.children, (x) =>
        localizeTree(x, language),
      );
    if (props.placeholder) next.placeholder = tr(props.placeholder, language);
    for (const key of [
      "title",
      "subtitle",
      "eyebrow",
      "text",
      "label",
    ] as const)
      if (props[key]) next[key] = tr(props[key]!, language);
    return cloneElement(node, next);
  }
  return node;
}
const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 14,
    top: 8,
    zIndex: 1000,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  text: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
