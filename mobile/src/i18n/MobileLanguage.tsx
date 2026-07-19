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
};
export function tr(value: string, language: Lang) {
  if (language === "en") return value;
  if (ar[value]) return ar[value];
  return value
    .replace(/^WEEK (\d+)$/, "الأسبوع $1")
    .replace(/^Set (\d+) of (\d+)$/, "المجموعة $1 من $2")
    .replace(/^Meal (\d+) of (\d+)$/, "الوجبة $1 من $2");
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
  if (typeof node === "number" || node == null || typeof node === "boolean") return node;
  if (Array.isArray(node)) return node.map((x) => localizeTree(x, language));
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; placeholder?: string };
    const next: Record<string, unknown> = {};
    if (props.children !== undefined) next.children = Children.map(props.children, (x) => localizeTree(x, language));
    if (props.placeholder) next.placeholder = tr(props.placeholder, language);
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
