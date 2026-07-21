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
import { Alert, I18nManager, Pressable, StyleSheet, Text } from "react-native";
import { useMobileTheme } from "../theme/MobileTheme";
type Lang = "en" | "ar";
const C = createContext({ language: "en" as Lang, toggle: () => {} });
const ar: Record<string, string> = {
  Home: "الرئيسية",
  Players: "اللاعبون",
  Analysis: "التحليل",
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
  "RENEW PLAYER": "تجديد اللاعب",
  "MARK CHECKED": "تحديد كمتابَع",
  "CHECKED ✓": "تمت المتابعة ✓",
  "ADD WORKOUT": "إضافة حصة",
  "SAVE DIET DAY": "حفظ يوم الغذاء",
  "SAVE DIET": "حفظ الغذاء",
  "ADD MEAL": "إضافة وجبة",
  "New meal": "وجبة جديدة",
  "Saved diets": "الأنظمة الغذائية المحفوظة",
  "No saved diets yet.": "لا توجد أنظمة غذائية محفوظة بعد.",
  "Diet schedule": "جدول الغذاء",
  "No diet for this day": "لا يوجد غذاء لهذا اليوم",
  "No diet for this day.": "لا يوجد غذاء لهذا اليوم.",
  "DELETE DIET DAY": "حذف يوم الغذاء",
  "MARK AS REST DAY": "تحديد كيوم راحة",
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
Object.assign(ar, {
  Action: "إجراء", tab: "علامة تبويب", "Client programming": "برمجة العميل", "Diet templates": "قوالب الأنظمة الغذائية",
  Appearance: "المظهر", "Command center": "مركز القيادة", "Coach team": "فريق المدرب",
  "Admin support": "دعم الإدارة", "Coach tools": "أدوات المدرب", Workouts: "الحصص", Programs: "البرامج",
  People: "اللاعبون", Build: "الإنشاء", Alerts: "التنبيهات", Settings: "الإعدادات",
  "Could not load": "تعذر التحميل", "Could not create": "تعذر الإنشاء", "Could not revoke": "تعذر الإلغاء",
  "Could not update": "تعذر التحديث", "Could not send": "تعذر الإرسال", "Could not save": "تعذر الحفظ",
  "Could not delete": "تعذر الحذف", "Could not add": "تعذرت الإضافة", "Could not renew": "تعذر التجديد",
  "Could not invite": "تعذرت الدعوة", "Could not assign": "تعذر التعيين", "Could not open": "تعذر الفتح",
  "Could not load players": "تعذر تحميل اللاعبين", "Could not load progress": "تعذر تحميل التقدم",
  "Could not load users": "تعذر تحميل المستخدمين", "Could not load log": "تعذر تحميل السجل",
  "Could not load diet": "تعذر تحميل النظام الغذائي", "Could not create key": "تعذر إنشاء المفتاح",
  "Coach key": "مفتاح المدرب", "Player key": "مفتاح اللاعب", "Coach keys": "مفاتيح المدربين",
  "Coach key created": "تم إنشاء مفتاح المدرب", "Player key created": "تم إنشاء مفتاح اللاعب",
  "Platform operations": "عمليات المنصة", "Control the ecosystem": "إدارة المنظومة",
  "Organized oversight for coaches, players, access, and support.": "إشراف منظم على المدربين واللاعبين والوصول والدعم.",
  Coaches: "المدربون", "Active access": "وصول نشط", "Coach conversations": "محادثات المدربين",
  "Use Support to review and answer coaching-team requests.": "استخدم الدعم لمراجعة طلبات فريق التدريب والرد عليها.",
  "Choose one theme for every page. The app refreshes once to apply it everywhere.": "اختر مظهرًا واحدًا لكل الصفحات. سيُعاد تحميل التطبيق مرة لتطبيقه في كل مكان.",
  Selected: "محدد", "Create reusable coaching content and deliver it to clients": "أنشئ محتوى تدريبيًا قابلًا لإعادة الاستخدام وقدمه للعملاء",
  "The player updates that need your attention.": "تحديثات اللاعبين التي تحتاج إلى انتباهك.",
  "Loading alerts": "جارٍ تحميل التنبيهات", "Alerts couldn't load": "تعذر تحميل التنبيهات",
  "You're all caught up": "أنت على اطلاع بكل شيء", Date: "التاريخ",
  "VIP players appear every day. Other players appear only on their scheduled days.": "يظهر لاعبو VIP يوميًا، ويظهر الآخرون في أيامهم المجدولة فقط.",
  "No players scheduled for this day.": "لا يوجد لاعبون مجدولون لهذا اليوم.",
  "Your priority coaching queue": "قائمة أولويات التدريب", "Coach command center": "مركز قيادة المدرب",
  "Focus where it matters.": "ركز حيث يهم.", "Messages, check-ups, programming gaps, and low activity in one clear view.": "الرسائل والمتابعات ونواقص البرامج وضعف النشاط في عرض واضح واحد.",
  "Open analysis": "فتح التحليل", Inbox: "الوارد", "Need attention": "يحتاج متابعة", Unread: "غير مقروء",
  "Check-ups due": "متابعات مستحقة", "Inactive 7+ days": "غير نشط منذ 7 أيام أو أكثر", "Priority queue": "قائمة الأولوية",
  "Players needing attention": "لاعبون يحتاجون متابعة", "You’re caught up": "أنت على اطلاع بكل شيء",
  "No urgent coaching signals right now.": "لا توجد إشارات تدريب عاجلة حاليًا.", "Check-up": "متابعة", "Low activity": "نشاط منخفض",
  "Quick actions": "إجراءات سريعة", "Build a program": "إنشاء برنامج", "Use your programming library": "استخدم مكتبة البرامج",
  "Review the roster": "مراجعة قائمة اللاعبين", "Open player profiles and progress": "فتح ملفات اللاعبين وتقدمهم",
  "Check-ups and settings": "المتابعات والإعدادات", "Continue your daily workflow": "تابع سير عملك اليومي",
  "Missing information": "معلومات ناقصة", "Exercise name and category are required.": "اسم التمرين والتصنيف مطلوبان.",
  "Edit exercise": "تعديل التمرين", "Add exercise": "إضافة تمرين", "SAVE CHANGES": "حفظ التغييرات",
  "Edit exercise in": "تعديل التمرين في", "Add exercise to": "إضافة تمرين إلى", Custom: "مخصص",
  "Template name and food are required.": "اسم القالب والطعام مطلوبان.", "Create diet template": "إنشاء قالب غذائي",
  "SAVE DIET TEMPLATE": "حفظ قالب الغذاء", "No note": "لا توجد ملاحظة", "Create program": "إنشاء برنامج",
  "CREATE PROGRAM": "إنشاء برنامج", weeks: "أسابيع", "No description": "لا يوجد وصف", Renewed: "تم التجديد",
  "Copy key": "نسخ المفتاح", "Expiry YYYY-MM-DD": "الانتهاء سنة-شهر-يوم", "VIP PLAYER ✓": "لاعب VIP ✓",
  "STANDARD PLAYER": "لاعب عادي", day: "يوم", "GENERATE KEY": "إنشاء مفتاح", "Unclaimed key": "مفتاح غير مستخدم",
  daily: "يومي", "RENEW FOR": "تجديد لمدة", "Choose player": "اختر لاعبًا", "Select a player first.": "اختر لاعبًا أولًا.",
  "Import complete": "اكتمل الاستيراد", "Import failed": "فشل الاستيراد", "Blank templates": "قوالب فارغة",
  "Share a blank Excel workbook to email, Drive, or another phone app.": "شارك ملف Excel فارغًا عبر البريد أو Drive أو تطبيق آخر.",
  "SHARE PROGRAM TEMPLATE": "مشاركة قالب البرنامج", "SHARE DIET TEMPLATE": "مشاركة قالب الغذاء", "Import for player": "استيراد للاعب",
  "Importing replaces the selected player’s complete existing plan only after the workbook is validated.": "يستبدل الاستيراد خطة اللاعب المحدد كاملة بعد التحقق من الملف.",
  "IMPORT PROGRAM EXCEL": "استيراد برنامج Excel", "IMPORT DIET EXCEL": "استيراد غذاء Excel",
  "Player access was renewed.": "تم تجديد وصول اللاعب.", "Team key": "مفتاح الفريق", "Generate team key": "إنشاء مفتاح فريق",
  "GENERATE TEAM KEY": "إنشاء مفتاح فريق", Members: "الأعضاء", "Invitation keys": "مفاتيح الدعوة", "Add new": "إضافة جديد",
  "ADD TO LIBRARY": "إضافة إلى المكتبة", "Saved for later use": "تم الحفظ للاستخدام لاحقًا", Duplicated: "تم النسخ",
  "The workout schedule was copied.": "تم نسخ جدول التدريب.", "Could not duplicate": "تعذر النسخ",
  "The diet schedule was copied.": "تم نسخ جدول الغذاء.", "Choose a player to open their workout and diet plans": "اختر لاعبًا لفتح خطط تدريبه وغذائه",
  "COACHING PLANS": "خطط التدريب", "Build the week with purpose.": "ابنِ الأسبوع بهدف واضح.",
  "Select an athlete, then shape training and nutrition one day at a time.": "اختر رياضيًا ثم صمم التدريب والتغذية يومًا بيوم.",
  "No active players available.": "لا يوجد لاعبون نشطون.", "ACTIVE · OPEN PLAN": "نشط · فتح الخطة",
  "Weekly training, diet, and saved programs": "التدريب الأسبوعي والغذاء والبرامج المحفوظة", "← ALL PLAYERS": "كل اللاعبين →",
  "Player plans": "خطط اللاعب", WEEK: "الأسبوع", "You can still duplicate the full week.": "لا يزال بإمكانك نسخ الأسبوع كاملًا.",
  "Rest day": "يوم راحة", "Training day": "يوم تدريب", "Saved workout": "حصة محفوظة", "Saved exercise": "تمرين محفوظ",
  "DELETE DAY": "حذف اليوم", DUPLICATE: "نسخ", "Exercise required": "التمرين مطلوب",
  "Enter an exercise name first.": "أدخل اسم التمرين أولًا.", "Workout required": "الحصة مطلوبة",
  "Enter a workout name and add at least one exercise.": "أدخل اسم الحصة وأضف تمرينًا واحدًا على الأقل.",
  "New workout": "حصة جديدة", Exercise: "تمرين", reps: "تكرارات", REMOVE: "إزالة", "New exercise": "تمرين جديد",
  "Saved workouts": "الحصص المحفوظة", ADD: "إضافة", "Meal required": "الوجبة مطلوبة",
  "Enter food before adding the meal.": "أدخل الطعام قبل إضافة الوجبة.", "Diet required": "النظام الغذائي مطلوب",
  "Add at least one meal before saving.": "أضف وجبة واحدة على الأقل قبل الحفظ.", items: "عناصر", "Diet day": "يوم غذائي", Meal: "وجبة",
  Assigned: "تم التعيين", "Assign whole program": "تعيين البرنامج كاملًا", "This replaces the schedule across the saved program’s weeks.": "سيستبدل هذا الجدول عبر أسابيع البرنامج المحفوظ.",
  "The team member can now access this player.": "يمكن لعضو الفريق الآن الوصول إلى هذا اللاعب.", viewer: "مشاهد",
  "Read assigned clients only.": "عرض العملاء المعينين فقط.", chat: "محادثة", "Answer assigned client chats.": "الرد على محادثات العملاء المعينين.",
  "Coach assigned players and plans.": "تدريب اللاعبين والخطط المعينة.", "Manage new and renewed client access.": "إدارة وصول العملاء الجدد والمجددين.",
  "Team member": "عضو فريق", "Assign a client:": "تعيين عميل:", "REVOKE MEMBER": "إلغاء صلاحية العضو",
  "Waiting for player signup": "بانتظار تسجيل اللاعب", "daily check-up": "متابعة يومية", Saved: "تم الحفظ",
  "Coaching context updated.": "تم تحديث سياق التدريب.", Sent: "تم الإرسال", "Guidance sent to the player.": "تم إرسال الإرشاد إلى اللاعب.",
  "Today’s check-up": "متابعة اليوم", "VIP · daily priority": "VIP · أولوية يومية", "Send guidance": "إرسال إرشاد",
  "SEND MESSAGE": "إرسال رسالة", "The player has not completed their profile yet.": "لم يكمل اللاعب ملفه بعد.",
  "Filter progress": "تصفية التقدم", Range: "الفترة", "Apply filters": "تطبيق الفلاتر", "Clear filters": "مسح الفلاتر",
  "Filtered results": "نتائج مصفاة", "Showing all progress": "عرض كل التقدم", Completed: "مكتمل", Logged: "مسجل",
  "No sessions match the current filters.": "لا توجد جلسات تطابق الفلاتر الحالية.", PREVIOUS: "السابق", Page: "الصفحة", of: "من", NEXT: "التالي",
  Close: "إغلاق", "Private coaching context": "سياق التدريب الخاص", "SAVE CONTEXT": "حفظ السياق",
  "Edit program": "تعديل البرنامج", "SAVE PROGRAM": "حفظ البرنامج", "Edit scheduled workout": "تعديل الحصة المجدولة",
  "Add scheduled workout": "إضافة حصة مجدولة", Week: "الأسبوع", "· Day": "· اليوم",
  "Manage your coaching workspace and account": "إدارة مساحة التدريب والحساب", "Mobile feature overview · July 2026": "نظرة على ميزات الهاتف · يوليو 2026",
  "Verification error": "خطأ في التحقق", "Invalid code": "رمز غير صالح",
  "Add this key to your authenticator app, then enter its six-digit code.": "أضف هذا المفتاح إلى تطبيق المصادقة ثم أدخل الرمز المكون من ستة أرقام.",
  "Enter the six-digit code from your authenticator app.": "أدخل الرمز المكون من ستة أرقام من تطبيق المصادقة.",
  Done: "تم", "Today’s diet progress was saved.": "تم حفظ تقدم غذاء اليوم.", "Coach:": "المدرب:", COMPLETED: "مكتمل", DONE: "تم",
  "Complete every field": "أكمل جميع الحقول", "Your coach needs all profile fields to prepare a suitable plan.": "يحتاج مدربك إلى جميع بيانات الملف لإعداد خطة مناسبة.",
  Membership: "العضوية", "Active coaching": "تدريب نشط", ACTIVE: "نشط", "Access through": "الوصول حتى",
  "Exercises today": "تمارين اليوم", "Meals today": "وجبات اليوم", "Today’s focus": "تركيز اليوم",
  "Continue your program and record every completed set.": "تابع برنامجك وسجل كل مجموعة مكتملة.",
  "Open Program to view today’s coaching plan.": "افتح البرنامج لعرض خطة تدريب اليوم.", "My profile": "ملفي", "EDIT PROFILE": "تعديل الملف",
  "Edit profile": "تعديل الملف", "Complete your profile": "أكمل ملفك", Gender: "النوع", "Sport level": "المستوى الرياضي", Experience: "الخبرة",
  "Apply filters before loading detailed history": "طبّق الفلاتر قبل تحميل السجل المفصل", workout: "تدريب", diet: "غذاء",
  "No sessions match these filters.": "لا توجد جلسات تطابق هذه الفلاتر.", "← PREVIOUS": "السابق →",
  "Coach message": "رسالة المدرب", "No program assigned for this week.": "لا يوجد برنامج معين لهذا الأسبوع.", Rest: "راحة", Training: "تدريب",
  "Video ready": "الفيديو جاهز", "The video passed its safety check.": "اجتاز الفيديو فحص الأمان.", "Upload failed": "فشل الرفع",
  "Enter your reps": "أدخل التكرارات", "Enter the reps you completed before going to the next set.": "أدخل التكرارات المكتملة قبل الانتقال للمجموعة التالية.",
  "Workout completed": "اكتملت الحصة", "Your sets and final notes were saved.": "تم حفظ المجموعات والملاحظات النهائية.",
  "Finish exercise": "إنهاء التمرين", "Comment & video": "تعليق وفيديو", "UPLOAD VIDEO": "رفع فيديو",
  "Video link added": "تمت إضافة رابط الفيديو", "Private video uploaded": "تم رفع الفيديو الخاص", "FINISH ✓": "إنهاء ✓",
  Sessions: "الجلسات", "Diet progress": "تقدم الغذاء", "File not allowed": "الملف غير مسموح",
  "Microphone required": "الميكروفون مطلوب", "Allow microphone access to record a voice message.": "اسمح بالوصول إلى الميكروفون لتسجيل رسالة صوتية.",
  "PHOTO / VIDEO (VIDEO MAX 500 MB)": "صورة / فيديو (الحد الأقصى 500 ميجابايت)", "STOP & SEND": "إيقاف وإرسال",
  "RECORD VOICE": "تسجيل صوت", "BACK TO PLAYERS": "العودة للاعبين", "No active conversation.": "لا توجد محادثة نشطة.",
  "Coach invitation keys": "مفاتيح دعوة المدربين", "CREATE COACH KEY": "إنشاء مفتاح مدرب", "Recent player keys": "مفاتيح اللاعبين الحديثة",
  "REVOKE ACCESS": "إلغاء الوصول", "CREATE COACH INVITATION KEY": "إنشاء مفتاح دعوة مدرب",
  "Manage coaches, invitation keys, and player access": "إدارة المدربين ومفاتيح الدعوة ووصول اللاعبين",
  "CREATE 1-MONTH PLAYER KEY": "إنشاء مفتاح لاعب لشهر", "· ends": "· ينتهي", VIP: "VIP", active: "نشط",
  exercises: "تمارين", "meals ·": "وجبات ·", "sets ·": "مجموعات ·", "Expiry date (YYYY-MM-DD)": "تاريخ الانتهاء (سنة-شهر-يوم)",
  Workout: "الحصة", Exercises: "التمارين", Subscription: "الاشتراك", "reps ·": "تكرارات ·", "EDIT DAY": "تعديل اليوم",
  "Your coach uses this information to create a safe, suitable plan.": "يستخدم مدربك هذه المعلومات لإعداد خطة آمنة ومناسبة.",
  "meals followed": "وجبات ملتزم بها", "Open a player from My Players to review individual progress.": "افتح لاعبًا من «لاعبوني» لمراجعة تقدمه.",
  "% adherence ·": "% التزام ·", "days logged": "أيام مسجلة", meals: "وجبات",
});
const arCaseInsensitive = new Map(
  Object.entries(ar).map(([english, arabic]) => [english.toLocaleLowerCase("en"), arabic]),
);
export function tr(value: string, language: Lang) {
  if (language === "en") return value;
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  const exact = ar[core] ?? arCaseInsensitive.get(core.toLocaleLowerCase("en"));
  if (exact) return leading + exact + trailing;
  const dynamic = core
    .replace(/^Welcome, (.+)$/, "مرحبًا، $1")
    .replace(/^Hi, (.+)$/, "مرحبًا، $1")
    .replace(/^WEEK (\d+)$/, "الأسبوع $1")
    .replace(/^Set (\d+) of (\d+)$/, "المجموعة $1 من $2")
    .replace(/^Meal (\d+) of (\d+)$/, "الوجبة $1 من $2")
    .replace(/^(\d+) days\/week$/, "$1 أيام في الأسبوع")
    .replace(/^(\d+) meals followed$/, "تم اتباع $1 وجبات")
    .replace(/^Coach: (.+)$/, "المدرب: $1")
    .replace(/^(.+) days logged$/, "$1 أيام مسجلة")
    .replace(/^(.+) of (.+)$/, "$1 من $2")
    .replace(/^Delete (.+)\?$/, "حذف $1؟")
    .replace(/^Remove (.+)\?$/, "إزالة $1؟")
    .replace(/^Renew (.+)\?$/, "تجديد $1؟")
    .replace(/^Revoke (.+)\?$/, "إلغاء صلاحية $1؟")
    .replace(/^Could not load (.+)$/, "تعذر تحميل $1")
    .replace(/^Could not save (.+)$/, "تعذر حفظ $1");
  return leading + dynamic + trailing;
}
export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Lang>("en");
  useEffect(() => {
    AsyncStorage.getItem("mobile_language").then(
      (x) => x === "ar" && setLanguage("ar"),
    );
  }, []);
  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.swapLeftAndRightInRTL(true);
    const originalAlert = Alert.alert;
    Alert.alert = ((title: string, message?: string, buttons?: Parameters<typeof Alert.alert>[2], options?: Parameters<typeof Alert.alert>[3]) =>
      originalAlert(
        tr(title, language),
        message ? tr(message, language) : message,
        buttons?.map((button) => ({ ...button, text: button.text ? tr(button.text, language) : button.text })),
        options,
      )) as typeof Alert.alert;
    return () => { Alert.alert = originalAlert; };
  }, [language]);
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
  const theme = useMobileTheme();
  return (
    <Pressable onPress={toggle} style={[styles.button, { backgroundColor: theme.colors.brand500 }]}>
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
  if (Array.isArray(node)) return Children.toArray(node.map((x) => localizeTree(x, language)));
  if (isValidElement(node)) {
    const props = node.props as {
      children?: ReactNode;
      placeholder?: string;
      title?: string;
      subtitle?: string;
      eyebrow?: string;
      text?: string;
      label?: string;
      accessibilityLabel?: string;
      accessibilityHint?: string;
      headerTitle?: string;
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
      "accessibilityLabel",
      "accessibilityHint",
      "headerTitle",
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
  },
  text: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
