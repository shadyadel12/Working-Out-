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
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
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
  "Light": "فاتح", "Dark": "داكن", "Use light mode": "استخدام الوضع الفاتح", "Use dark mode": "استخدام الوضع الداكن",
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

// Keep new product areas translatable without coupling every component to i18n.
// Exact phrases are preferred so Arabic copy remains natural and contextual.
Object.assign(ar, {
  "Actions": "الإجراءات", "Admin — Keys": "الإدارة — المفاتيح", "Analysis": "التحليل",
  "Archive": "أرشفة", "Archived": "مؤرشف", "Arrangement": "الترتيب", "Draft": "مسودة",
  "Published": "منشور", "Publish": "نشر", "Private": "خاص", "Created": "تاريخ الإنشاء",
  "Created On": "تاريخ الإنشاء", "Last updated": "آخر تحديث", "Difficulty": "الصعوبة",
  "Adherence": "الالتزام", "Age": "العمر", "Coach": "المدرب", "Player": "اللاعب",
  "Day": "اليوم", "Expiry": "انتهاء الصلاحية", "Features": "المميزات", "Food": "الطعام",
  "Grams": "الجرامات", "Group": "المجموعة", "Key": "المفتاح", "Load": "الحمل",
  "Meals": "الوجبات", "Number": "رقم", "Open": "فتح", "Prescription": "تفاصيل التمرين",
  "Quantity": "الكمية", "Question": "السؤال", "Ready when you are": "جاهز عندما تكون مستعدًا",
  "Sections": "الأقسام", "Section": "القسم", "Tasks": "المهام", "Forms & Questionnaires": "النماذج والاستبيانات",
  "Meal Plan Templates": "قوالب خطط الوجبات", "Recipes": "الوصفات", "Ingredients": "المكونات",
  "Recipe Books": "كتب الوصفات", "Metric Groups": "مجموعات القياسات", "Tracking": "التتبع",
  "Add Exercise": "إضافة تمرين", "Add workout": "إضافة حصة", "Add New Exercise": "إضافة تمرين جديد",
  "Add custom food": "إضافة طعام مخصص", "Add to your library": "إضافة إلى مكتبتك",
  "Add foods from the library or enter a custom food.": "أضف أطعمة من المكتبة أو أدخل طعامًا مخصصًا.",
  "Add an exercise or reusable section from the source panel.": "أضف تمرينًا أو قسمًا قابلًا لإعادة الاستخدام من لوحة المصادر.",
  "Arrange exercises, then edit the selected prescription.": "رتّب التمارين، ثم عدّل تفاصيل التمرين المحدد.",
  "Build player workout": "إنشاء حصة للاعب", "Build from scratch": "البدء من الصفر",
  "Build a program": "إنشاء برنامج", "Build versioned sessions from reusable exercises and sections.": "أنشئ حصصًا قابلة للتحديث من تمارين وأقسام قابلة لإعادة الاستخدام.",
  "Create a workout": "إنشاء حصة", "Create a session blueprint from exercises and reusable sections.": "أنشئ قالب حصة من التمارين والأقسام القابلة لإعادة الاستخدام.",
  "Create exercises once and reuse them in any player program.": "أنشئ التمارين مرة واحدة وأعد استخدامها في أي برنامج للاعب.",
  "Day arrangement": "ترتيب اليوم", "Food library": "مكتبة الطعام", "Workout sources": "مصادر الحصة",
  "Workout name": "اسم الحصة", "Exercise name": "اسم التمرين", "Coach notes": "ملاحظات المدرب",
  "Coach note for this day": "ملاحظة المدرب لهذا اليوم", "Coaching note": "ملاحظة تدريبية",
  "Each side": "لكل جانب", "Rest": "الراحة", "Tempo": "الإيقاع", "Percentage load": "نسبة الحمل",
  "Save to library": "حفظ في المكتبة", "Reuse with other players.": "أعد استخدامها مع لاعبين آخرين.",
  "Saved workout": "حصة محفوظة", "Saved diet library": "مكتبة الأنظمة المحفوظة",
  "Search saved workouts": "البحث في الحصص المحفوظة", "Search foods": "البحث عن طعام",
  "Quick add exercise": "إضافة تمرين بسرعة", "Blank exercise": "تمرين فارغ",
  "Untitled exercise": "تمرين بدون اسم", "No reps": "بدون تكرارات", "No load": "بدون حمل",
  "Select an exercise to edit it.": "اختر تمرينًا لتعديله.", "Select a meal or snack to edit it.": "اختر وجبة أو وجبة خفيفة لتعديلها.",
  "Meal name": "اسم الوجبة", "Snacks": "الوجبات الخفيفة", "Snack": "وجبة خفيفة",
  "Optional instructions for the player…": "تعليمات اختيارية للاعب…",
  "Generate slots": "إنشاء الوجبات", "Library name": "الاسم في المكتبة", "Diet template": "قالب النظام الغذائي",
  "Manage Diet": "إدارة النظام الغذائي", "Manage Training": "إدارة التدريب", "Diet Analysis": "تحليل النظام الغذائي",
  "Import diet from Excel": "استيراد النظام الغذائي من Excel", "Download diet template (.xlsx)": "تنزيل قالب النظام الغذائي (.xlsx)",
  "Import program from Excel": "استيراد البرنامج من Excel", "Program template": "قالب البرنامج",
  "Library item": "عنصر المكتبة", "Choose an item": "اختر عنصرًا", "General message": "رسالة عامة",
  "Answer type": "نوع الإجابة", "Long text": "نص طويل", "Multiple choice": "اختيار متعدد",
  "New measurement": "قياس جديد", "Create measurement": "إنشاء قياس", "Default unit": "الوحدة الافتراضية",
  "Remove from group": "إزالة من المجموعة", "Attach to (optional)": "إرفاق بـ (اختياري)",
  "Priority queue": "قائمة الأولويات", "Players needing attention": "لاعبون يحتاجون إلى المتابعة",
  "Needs program": "يحتاج إلى برنامج", "Check-up due": "موعد المتابعة", "Low activity": "نشاط منخفض",
  "Quick actions": "إجراءات سريعة", "Open inbox": "فتح صندوق الرسائل", "Open daily check-ups →": "فتح المتابعات اليومية ←",
  "Open workout analysis →": "فتح تحليل التمارين ←", "Open diet analysis →": "فتح تحليل النظام الغذائي ←",
  "No players currently have urgent coaching signals.": "لا يوجد لاعبون لديهم تنبيهات تدريب عاجلة حاليًا.",
  "No workouts for this day.": "لا توجد حصص لهذا اليوم.", "No exercises.": "لا توجد تمارين.",
  "No program set for this week yet. Check back soon.": "لم يتم تعيين برنامج لهذا الأسبوع بعد. تحقق مرة أخرى قريبًا.",
  "No diet plan set for this week yet. Check back soon.": "لم يتم تعيين نظام غذائي لهذا الأسبوع بعد. تحقق مرة أخرى قريبًا.",
  "No active coach assigned yet.": "لم يتم تعيين مدرب نشط بعد.", "Player not found.": "لم يتم العثور على اللاعب.",
  "Loading items…": "جارٍ تحميل العناصر…", "Loading subscriptions…": "جارٍ تحميل الاشتراكات…",
  "Loading media…": "جارٍ تحميل الوسائط…", "Loading video…": "جارٍ تحميل الفيديو…",
  "Loading attachment…": "جارٍ تحميل المرفق…", "Invalid video link.": "رابط الفيديو غير صالح.",
  "Not set": "غير محدد", "Now": "الآن", "All player keys": "جميع مفاتيح اللاعبين",
  "Coach keys": "مفاتيح المدربين", "New coach key": "مفتاح مدرب جديد", "Issue a player subscription key": "إصدار مفتاح اشتراك للاعب",
  "Users & Keys": "المستخدمون والمفاتيح", "Create coach key": "إنشاء مفتاح مدرب", "Create key": "إنشاء مفتاح",
  "Single-use. Give one to a person so they can sign up as a coach.": "للاستخدام مرة واحدة. أعطه لشخص ليتمكن من التسجيل كمدرب.",
  "Create a key for a coach, then give it to the player to sign up with.": "أنشئ مفتاحًا لدى مدرب ثم أعطه للاعب لإكمال التسجيل.",
  "Select a coach…": "اختر مدربًا…", "No coach keys yet.": "لا توجد مفاتيح مدربين بعد.",
  "No keys issued yet.": "لم يتم إصدار مفاتيح بعد.",
  "No coaches yet. A coach must sign up (with the coach invite code) before you can issue keys for them.": "لا يوجد مدربون بعد. يجب أن يسجل المدرب برمز الدعوة قبل أن تتمكن من إصدار مفاتيح له.",
  "All rights reserved.": "جميع الحقوق محفوظة.",
  "Generate a subscription key": "إنشاء مفتاح اشتراك", "Create coach account": "إنشاء حساب مدرب",
  "Create player account": "إنشاء حساب لاعب", "Enter as player": "الدخول كلاعب",
  "Coach Support": "دعم المدرب", "Chat privately or send targeted coaching guidance.": "تحدث بشكل خاص أو أرسل إرشادات تدريب مخصصة.",
  "Messages from your coach": "رسائل من مدربك", "Coach checked in": "تابعك المدرب",
  "Meals followed": "الوجبات الملتزم بها", "Log each set": "سجّل كل مجموعة", "Copy to next": "نسخ إلى التالي",
  "Diet progress saved.": "تم حفظ تقدم النظام الغذائي.", "PULSEFIT · Built for focused progress.": "PULSEFIT · صُمم لتقدم أكثر تركيزًا.",
  "Experience": "التجربة", "Updates": "التحديثات", "Start training": "ابدأ التدريب",
  "Personal coaching, connected": "تدريب شخصي مترابط", "Build strength.": "ابنِ قوتك.",
  "Own the change.": "امتلك التغيير.",
  "A private training space where your workouts, nutrition, progress, and coach move together.": "مساحة تدريب خاصة تجمع تمارينك وتغذيتك وتقدمك ومدربك في مكان واحد.",
  "Enter as player →": "الدخول كلاعب ←", "Coach workspace ↗": "مساحة المدرب ↖",
  "One clear plan": "خطة واحدة واضحة", "Coach connection": "تواصل مع المدرب", "Built for you": "مصمم لك",
  "Today · Lower body": "اليوم · الجزء السفلي", "Lower body": "الجزء السفلي", "Strength": "القوة",
  "Back squat": "القرفصاء الخلفية", "Romanian deadlift": "الرفعة الميتة الرومانية", "Walking lunge": "اندفاع المشي",
  "Session progress": "تقدم الحصة", "Scroll to explore ↓": "مرر للاستكشاف ↓", "The connected experience": "التجربة المترابطة",
  "Scroll to explore": "مرر للاستكشاف",
  "TRAIN SMARTER RECOVER BETTER STAY CONSISTENT": "تدرّب بذكاء تعافَ أفضل استمر بثبات",
  "TRAIN SMARTER RECOVER BETTER STAY CONSISTENT TRAIN SMARTER RECOVER BETTER STAY CONSISTENT": "تدرّب بذكاء تعافَ أفضل استمر بثبات · تدرّب بذكاء تعافَ أفضل استمر بثبات",
  "Everything your next result needs. Nothing it doesn’t.": "كل ما تحتاجه نتيجتك القادمة، دون أي تشتيت.",
  "Less app-switching. Less guessing. One focused place for the work between you and your coach.": "تنقّل أقل بين التطبيقات وتخمين أقل، في مساحة واحدة مركزة تجمعك بمدربك.",
  "Training that adapts": "تدريب يتكيف معك", "Your coach builds every set, rep, and progression around your real performance.": "يبني مدربك كل مجموعة وتكرار وتدرج وفق أدائك الحقيقي.",
  "Nutrition with direction": "تغذية موجهة", "Simple daily plans, meal check-ins, and feedback keep the work sustainable.": "خطط يومية بسيطة ومتابعة للوجبات وملاحظات تساعدك على الاستمرار.",
  "Progress you can see": "تقدم يمكنك رؤيته", "Turn completed sessions and check-ups into a clear story of momentum.": "حوّل الحصص المكتملة والمتابعات إلى صورة واضحة لتقدمك.",
  "Your strongest chapter": "أقوى فصولك", "starts with one session.": "يبدأ بحصة واحدة.", "Start training →": "ابدأ التدريب ←",
  "Terms": "الشروط", "Next result": "النتيجة القادمة", "Coach command center": "مركز قيادة المدرب",
  "Personal coaching platform": "منصة تدريب شخصي",
});

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
    [/^(\d+) exercises?$/, (n) => `${n} تمارين`],
    [/^(\d+) workouts?$/, (n) => `${n} حصص`],
    [/^(\d+) items?$/, (n) => `${n} عناصر`],
    [/^(\d+) foods?$/, (n) => `${n} أطعمة`],
    [/^(\d+) slots?$/, (n) => `${n} خانات`],
    [/^(\d+) sets?$/, (n) => `${n} مجموعات`],
    [/^(\d+) sets? · (.+) reps?$/, (sets, reps) => `${sets} مجموعات · ${reps} تكرارات`],
    [/^(\d+) week streak$/, (n) => `سلسلة ${n} أسابيع`],
    [/^(\d+) min$/, (n) => `${n} دقيقة`],
    [/^Strength \/ (\d+)$/, (n) => `القوة / ${n}`],
    [/^(\d+) questions?$/, (n) => `${n} أسئلة`],
    [/^(\d+) responses?$/, (n) => `${n} ردود`],
    [/^(\d+) clients?$/, (n) => `${n} عملاء`],
    [/^(\d+) assignments?$/, (n) => `${n} تعيينات`],
    [/^(\d+)\/(\d+) exercises ready$/, (a, b) => `${a}/${b} تمارين جاهزة`],
    [/^Add to (.+)$/, (x) => `إضافة إلى ${x}`],
    [/^Move (.+) up$/, (x) => `نقل ${x} لأعلى`],
    [/^Move (.+) down$/, (x) => `نقل ${x} لأسفل`],
    [/^Remove (.+)$/, (x) => `إزالة ${x}`],
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
    const current = text.nodeValue ?? "";
    const stored = textOriginals.get(text);
    if (stored === undefined || (current !== stored && current !== translateText(stored))) textOriginals.set(text, current);
    const original = textOriginals.get(text)!;
    const next = language === "ar" ? translateText(original) : original;
    if (text.nodeValue !== next) text.nodeValue = next;
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
      const stored = map.get(attr);
      if (stored === undefined || (current !== stored && current !== translateText(stored))) map.set(attr, current);
      const original = map.get(attr)!;
      const next = language === "ar" ? translateText(original) : original;
      if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
    }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    localStorage.getItem("app_language") === "ar" ? "ar" : "en",
  );
  const busy = useRef(false);
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("app_theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });
  const setLanguage = (next: Language) => {
    localStorage.setItem("app_language", next);
    setLanguageState(next);
  };
  const setTheme = (next: "light" | "dark") => {
    localStorage.setItem("app_theme", next);
    setThemeState(next);
  };
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
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
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateNode(mutation.target, language);
        else if (mutation.type === "attributes") translateNode(mutation.target, language);
        else for (const node of mutation.addedNodes) translateNode(node, language);
      }
      busy.current = false;
    });
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label"], subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage, theme, setTheme }}>
      {children}
      <button
        type="button"
        className="public-theme-toggle"
        data-no-translate
        aria-label={theme === "dark" ? "Use light mode" : "Use dark mode"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
      </button>
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
