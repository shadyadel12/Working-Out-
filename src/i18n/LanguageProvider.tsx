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
  "Simple guide": "دليل مبسط",
  "How It Works": "كيف يعمل",
  "Here is what each button does. Choose any button from the menu whenever you want to open that part of Trainova.": "إليك وظيفة كل زر. اختر أي زر من القائمة عندما تريد فتح ذلك الجزء من ترينوفا.",
  Sections: "الأقسام",
  Tasks: "المهام",
  Forms: "النماذج",
  "Meal Plans": "خطط الوجبات",
  Recipes: "الوصفات",
  Ingredients: "المكونات",
  "Recipe Books": "كتب الوصفات",
  "Metric Groups": "مجموعات القياسات",
  "Users & Keys": "المستخدمون والمفاتيح",
  Traffic: "حركة الموقع",
  "Opens your player list and shows who needs your attention today.": "يفتح قائمة لاعبيك ويوضح من يحتاج إلى متابعتك اليوم.",
  "Opens the tools you reuse when building training and nutrition plans.": "يفتح الأدوات التي تستخدمها عند إعداد خطط التدريب والتغذية.",
  "Shows the exercises you can add to workouts.": "يعرض التمارين التي يمكنك إضافتها إلى الحصص التدريبية.",
  "Shows saved workouts that can be reused in player programs.": "يعرض الحصص التدريبية المحفوظة التي يمكنك استخدامها في برامج اللاعبين.",
  "Shows reusable groups of workouts for organizing a program.": "يعرض مجموعات الحصص التي تساعدك على تنظيم البرنامج التدريبي.",
  "Shows complete saved training programs you can reuse.": "يعرض البرامج التدريبية الكاملة المحفوظة التي يمكنك استخدامها مرة أخرى.",
  "Shows extra tasks or habits that can be assigned to players.": "يعرض المهام أو العادات الإضافية التي يمكنك تكليف اللاعبين بها.",
  "Shows forms used to collect information from players.": "يعرض النماذج المستخدمة لجمع المعلومات من اللاعبين.",
  "Shows saved nutrition plans that can be assigned to players.": "يعرض خطط التغذية المحفوظة التي يمكنك تعيينها للاعبين.",
  "Shows saved recipes for use in nutrition plans.": "يعرض الوصفات المحفوظة لاستخدامها في خطط التغذية.",
  "Shows the foods and ingredients used in recipes.": "يعرض الأطعمة والمكونات المستخدمة في الوصفات.",
  "Shows collections of recipes that can be shared with players.": "يعرض مجموعات الوصفات التي يمكنك مشاركتها مع اللاعبين.",
  "Shows the measurements you use to track player progress.": "يعرض القياسات التي تستخدمها لمتابعة تقدم اللاعبين.",
  "Opens the page where you can see the players you have checked up on so far and who is still waiting.": "يفتح صفحة توضح اللاعبين الذين تابعتهم حتى الآن ومن لا يزال ينتظر المتابعة.",
  "Opens your conversations with players.": "يفتح محادثاتك مع اللاعبين.",
  "Lets you view and manage the people helping you run your coaching account.": "يتيح لك عرض وإدارة الأشخاص الذين يساعدونك في إدارة حساب التدريب.",
  "Lets you create access keys, renew players, and manage subscription dates.": "يتيح لك إنشاء مفاتيح الدخول وتجديد اشتراكات اللاعبين وإدارة مواعيدها.",
  "Lets you change your account and workspace preferences.": "يتيح لك تغيير إعدادات حسابك ومساحة العمل.",
  "Opens your conversation with the Trainova support team.": "يفتح محادثتك مع فريق دعم ترينوفا.",
  "Opens the training plan your coach prepared for you.": "يفتح خطة التدريب التي أعدها لك مدربك.",
  "Opens your current meal and nutrition plan.": "يفتح خطة الوجبات والتغذية الحالية الخاصة بك.",
  "Shows your training results and progress over time.": "يعرض نتائج تدريبك وتقدمك مع مرور الوقت.",
  "Lets you record and review how well you are following your diet plan.": "يتيح لك تسجيل ومراجعة مدى التزامك بخطة التغذية.",
  "Opens your private conversation with your coach.": "يفتح محادثتك الخاصة مع مدربك.",
  "Shows your personal details and lets you update them.": "يعرض بياناتك الشخصية ويتيح لك تحديثها.",
  "Shows coach accounts and the access keys used to join Trainova.": "يعرض حسابات المدربين ومفاتيح الدخول المستخدمة للانضمام إلى ترينوفا.",
  "Shows support conversations that need help from an administrator.": "يعرض محادثات الدعم التي تحتاج إلى مساعدة المسؤول.",
  "Shows website activity and controls for handling suspicious access.": "يعرض نشاط الموقع وأدوات التعامل مع محاولات الدخول المشبوهة.",
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
  "Grams": "الجرامات", "Measure": "طريقة القياس", "Group": "المجموعة", "Key": "المفتاح", "Load": "الحمل",
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

// Complete UI coverage for navigation, helper copy, dialogs, uploads, and
// dynamically rendered status text. Keep these exact phrases centralized so
// every route and popup receives the same Arabic wording.
Object.assign(ar, {
  "Checking admin security…": "جارٍ التحقق من أمان الإدارة…",
  "Signup failed.": "فشل إنشاء الحساب.", "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Invalid or already-used coach key.": "مفتاح المدرب غير صالح أو مستخدم بالفعل.",
  "Invalid or already-used subscription key.": "مفتاح الاشتراك غير صالح أو مستخدم بالفعل.",
  "Invalid coach key": "مفتاح المدرب غير صالح", "This coach key has been revoked": "تم إلغاء مفتاح المدرب هذا",
  "This coach key is already in use": "مفتاح المدرب هذا مستخدم بالفعل", "Not authenticated": "لم يتم تسجيل الدخول",
  "Admin verification": "تحقق الإدارة",
  "Try again": "حاول مرة أخرى",
  "Scan this QR code with your authenticator app, then enter its six-digit code.": "امسح رمز QR بتطبيق المصادقة ثم أدخل الرمز المكون من ستة أرقام.",
  "Manual key:": "المفتاح اليدوي:",
  "Enter the six-digit code from your authenticator app.": "أدخل الرمز المكون من ستة أرقام من تطبيق المصادقة.",
  "Authenticator code": "رمز المصادقة",
  "This week (Sat–Fri)": "هذا الأسبوع (السبت–الجمعة)",
  "Updating results…": "جارٍ تحديث النتائج…",
  "Exercises shown": "التمارين المعروضة",
  "View video": "عرض الفيديو",
  Page: "الصفحة", of: "من",
  "Audio recording is not supported by this browser.": "هذا المتصفح لا يدعم تسجيل الصوت.",
  "Microphone permission is required to record audio.": "يلزم السماح بالميكروفون لتسجيل الصوت.",
  "No messages yet. Say hello!": "لا توجد رسائل بعد. ابدأ بالتحية!",
  "No messages yet. Send a message to the admin team.": "لا توجد رسائل بعد. أرسل رسالة إلى فريق الإدارة.",
  "Send a picture or video (videos up to 500 MB)": "إرسال صورة أو فيديو (حتى 500 ميجابايت)",
  "Attach a photo or video (videos up to 500 MB)": "إرفاق صورة أو فيديو (حتى 500 ميجابايت)",
  "Attach picture or video": "إرفاق صورة أو فيديو",
  "Attach a photo or video": "إرفاق صورة أو فيديو",
  Uploading: "جارٍ الرفع", "Uploading…": "جارٍ الرفع…",
  "Add emoji": "إضافة رمز تعبيري", "Choose an emoji": "اختر رمزًا تعبيريًا",
  "Type a message": "اكتب رسالة", "Diet adherence": "الالتزام بالنظام الغذائي",
  "Days logged": "الأيام المسجلة", Preparing: "جارٍ التجهيز",
  "Your workspace is almost ready": "مساحة عملك أوشكت على الجاهزية",
  selected: "محدد", "Download file": "تنزيل الملف", "Close video": "إغلاق الفيديو",
  "Video link (YouTube or any URL)": "رابط الفيديو (يوتيوب أو أي رابط)",
  "or upload:": "أو ارفع:", "Uploaded file attached ✓": "تم إرفاق الملف المرفوع ✓",
  "No weeks after Week": "لا توجد أسابيع بعد الأسبوع", "to copy into.": "للنسخ إليها.",
  "Open coach profile menu": "فتح قائمة ملف المدرب", Menu: "القائمة",
  "Coach Platform. All rights reserved. ·": "منصة التدريب. جميع الحقوق محفوظة. ·",
  COACHES: "المدربون", "No coaches yet.": "لا يوجد مدربون بعد.",
  "← Conversations": "المحادثات →", "Select a coach to open their support thread.": "اختر مدربًا لفتح محادثة الدعم الخاصة به.",
  "← Back": "رجوع →", "← Back to sign in": "العودة لتسجيل الدخول →",
  "Use at least 8 characters with uppercase, lowercase, a number, and a symbol.": "استخدم 8 أحرف على الأقل تشمل حرفًا كبيرًا وصغيرًا ورقمًا ورمزًا.",
  "Enter the subscription key your coach gave you.": "أدخل مفتاح الاشتراك الذي أعطاك إياه مدربك.",
  "Chat —": "المحادثة —", "Messages —": "الرسائل —", "Analysis —": "التحليل —", "Program —": "البرنامج —", "Diet —": "النظام الغذائي —",
  "You do not have permission to use player chat.": "ليست لديك صلاحية استخدام محادثة اللاعب.",
  "You do not have permission to send player messages.": "ليست لديك صلاحية إرسال رسائل للاعب.",
  "You do not have permission to manage subscriptions.": "ليست لديك صلاحية إدارة الاشتراكات.",
  "VIP unread messages stay at the top, followed by other unread conversations.": "تبقى رسائل VIP غير المقروءة في الأعلى ثم بقية المحادثات غير المقروءة.",
  "Good day,": "يوم سعيد،", "Start with the players who need you most, then keep the rest of the roster moving.": "ابدأ باللاعبين الأكثر احتياجًا ثم تابع بقية الفريق.",
  "Start check-ups": "بدء المتابعات", "Coaching overview": "نظرة عامة على التدريب",
  "Need attention": "يحتاج متابعة", "Unread messages": "رسائل غير مقروءة",
  "Check-ups due": "متابعات مستحقة", "Inactive 7+ days": "غير نشط منذ 7 أيام أو أكثر",
  "View today’s check-ups": "عرض متابعات اليوم", "You’re caught up.": "أنت على اطلاع بكل شيء.",
  "Unread message": "رسالة غير مقروءة", Subscription: "الاشتراك",
  "Quick coach actions": "إجراءات سريعة للمدرب", "Start from a reusable plan": "ابدأ من خطة قابلة لإعادة الاستخدام",
  "Invite a player": "دعوة لاعب", "Quick actions": "إجراءات سريعة",
  "Regenerate meal slots? Existing text for this day will be cleared.": "إعادة إنشاء خانات الوجبات؟ سيتم مسح النص الحالي لهذا اليوم.",
  "Use saved diet": "استخدام نظام غذائي محفوظ", "Select from library…": "اختر من المكتبة…",
  "Saved once for reuse ✓": "تم الحفظ لإعادة الاستخدام ✓", "Saved ✓": "تم الحفظ ✓",
  "Choose how many meals and snacks, then press \"Generate slots\".": "اختر عدد الوجبات والوجبات الخفيفة ثم اضغط «إنشاء الخانات».",
  "Meal details": "تفاصيل الوجبة", "+ Add custom food": "+ إضافة طعام مخصص",
  "Apply saved meal plan": "تطبيق خطة وجبات محفوظة", "Apply meal plan": "تطبيق خطة الوجبات",
  "Use saved recipe": "استخدام وصفة محفوظة", "Recipe book": "كتاب الوصفات",
  "All recipes": "كل الوصفات", "Use recipe": "استخدام الوصفة", "Detach recipe": "فصل الوصفة",
  "View recipe": "عرض الوصفة", "How to make it": "طريقة التحضير",
  "Delete this diet day?": "حذف يوم النظام الغذائي هذا؟", "Delete day": "حذف اليوم",
  "Copy Week": "نسخ الأسبوع", "Search by exercise name…": "البحث باسم التمرين…",
  "Target Muscle Groups": "العضلات المستهدفة", "Movement Patterns": "أنماط الحركة",
  "Start adding exercises to reuse in programs.": "ابدأ بإضافة تمارين لإعادة استخدامها في البرامج.",
  "Exercise Name *": "اسم التمرين *", "Category *": "التصنيف *", "Video Link": "رابط الفيديو",
  "Coach Library": "مكتبة المدرب", Create: "إنشاء", "Lifecycle filter": "تصفية دورة الحياة",
  Visibility: "الظهور", Updated: "محدّث", found: "موجود", "Create the first reusable": "أنشئ أول عنصر قابل لإعادة الاستخدام",
  "Close editor": "إغلاق المحرر", "Team workspace": "مساحة عمل الفريق", "Body weight": "وزن الجسم",
  Unit: "الوحدة", "What would you like to ask?": "ماذا تريد أن تسأل؟", "Short text": "نص قصير",
  "Single choice": "اختيار واحد", "Yes / No": "نعم / لا", Required: "مطلوب",
  "Reps / target": "التكرارات / الهدف", "Rest seconds": "ثواني الراحة", Breakfast: "الإفطار",
  "Send a message": "إرسال رسالة", "Sent messages": "الرسائل المرسلة", "No messages yet.": "لا توجد رسائل بعد.",
  "Return to clients": "العودة إلى العملاء", "Player sections": "أقسام اللاعب", Summary: "الملخص", Training: "التدريب",
  Gender: "النوع", "logged exercises": "تمارين مسجلة", "planned meals completed": "وجبات مخططة مكتملة",
  "training days currently planned": "أيام تدريب مخططة حاليًا", "diet check-ins recorded": "متابعات غذائية مسجلة",
  "— not set": "— غير محدد", "Remove exercise": "إزالة التمرين", "+ Add exercise": "+ إضافة تمرين",
  "+ Add workout": "+ إضافة حصة", "✓ Player completed": "✓ أكمل اللاعب", "Technique, tempo, or rest instructions": "تعليمات الأداء أو الإيقاع أو الراحة",
  "Choose where to copy this workout": "اختر مكان نسخ هذه الحصة", "Close builder": "إغلاق أداة الإنشاء",
  "+ Blank exercise": "+ تمرين فارغ", "Exercise prescription": "وصفة التمرين", "exercises ready": "تمارين جاهزة",
  "Apply a complete saved program starting from Week": "تطبيق برنامج محفوظ كامل بدءًا من الأسبوع",
  "+ Assign Program": "+ تعيين برنامج", "Select a program…": "اختر برنامجًا…",
  "This program extends beyond the player’s available subscription weeks.": "يمتد هذا البرنامج بعد أسابيع اشتراك اللاعب المتاحة.",
  "Replace the existing schedule in these weeks with this saved program?": "استبدال الجدول الحالي في هذه الأسابيع بهذا البرنامج المحفوظ؟",
  "+ Create Program": "+ إنشاء برنامج", "Search by program name…": "البحث باسم البرنامج…",
  "Download template (.xlsx)": "تنزيل القالب (.xlsx)", "— Select a player —": "— اختر لاعبًا —", Imported: "تم الاستيراد",
  "Download diet template (.xlsx)": "تنزيل قالب النظام الغذائي (.xlsx)",
  "Share this key with a new player so they can register and join your account.": "شارك هذا المفتاح مع لاعب جديد ليتمكن من التسجيل والانضمام إلى حسابك.",
  "VIP overrides the weekly frequency.": "يلغي VIP معدل المتابعة الأسبوعي.",
  "Chat directly with the admin team. You can send text, screenshots, images, or videos.": "تحدث مباشرة مع فريق الإدارة وأرسل نصوصًا أو لقطات شاشة أو صورًا أو فيديوهات.",
  "Search team members…": "البحث عن أعضاء الفريق…", "Revoke this team member?": "إلغاء صلاحية عضو الفريق هذا؟",
  "Generate a key to invite your first team member.": "أنشئ مفتاحًا لدعوة أول عضو في فريقك.",
  "Training catalog": "دليل التدريب", "Search workouts…": "البحث عن الحصص…", "Search workouts": "البحث عن الحصص",
  Revision: "الإصدار", "Session blueprint": "مخطط الحصة", "Upper body strength": "قوة الجزء العلوي",
  "Session goal and context": "هدف الحصة وسياقها", "Workout arrangement": "ترتيب الحصة",
  "Use the arrow buttons for keyboard-accessible ordering.": "استخدم أزرار الأسهم للترتيب عبر لوحة المفاتيح.",
  "Start building your workout": "ابدأ إنشاء حصتك", Reusable: "قابل لإعادة الاستخدام",
  "Open section library": "فتح مكتبة الأقسام", "Select an exercise to edit its prescription.": "اختر تمرينًا لتعديل وصفته.",
  "Workout notes": "ملاحظات الحصة", "Instructions shown with this workout": "التعليمات المعروضة مع هذه الحصة",
  "Workout is ready to save.": "الحصة جاهزة للحفظ.", "Save & close": "حفظ وإغلاق",
  Seconds: "ثوانٍ", "Rest (sec)": "الراحة (ثانية)", "Open navigation": "فتح التنقل", Notifications: "الإشعارات",
  "Coaching metrics": "مؤشرات التدريب", "Exercise source": "مصدر التمرين", "Previous page": "الصفحة السابقة", "Next page": "الصفحة التالية",
  "Main navigation": "التنقل الرئيسي", "Choose how to sign in": "اختر طريقة تسجيل الدخول", Athlete: "رياضي",
  "Open your training space": "افتح مساحة تدريبك", "Open your coaching workspace": "افتح مساحة التدريب الخاصة بك",
  "Choose how to sign up": "اختر طريقة إنشاء الحساب", "Start training with a coach": "ابدأ التدريب مع مدرب",
  "Create your coaching account": "أنشئ حساب التدريب الخاص بك", "A preview of today's personalized workout": "معاينة لحصة اليوم المخصصة",
  "Your subscription has expired": "انتهى اشتراكك", "Already renewed? Enter your updated key:": "جددت بالفعل؟ أدخل المفتاح المحدّث:",
  "Today’s diet check-in": "متابعة غذاء اليوم", "Tick each meal you followed, then save.": "حدد كل وجبة التزمت بها ثم احفظ.",
  "Select sport level": "اختر المستوى الرياضي", "Select experience": "اختر مستوى الخبرة",
  "Remove this set": "إزالة هذه المجموعة", "Add set": "إضافة مجموعة", "Your comment": "تعليقك",
  "Save exercise": "حفظ التمرين", "Save exercise changes": "حفظ تعديلات التمرين",
  "Confirm workout": "تأكيد الحصة", "Confirm changes": "تأكيد التغييرات", "Submitting…": "جارٍ الإرسال…",
  "Workout submitted. Select Edit to change your sets, note, or video.": "تم إرسال الحصة. اختر تعديل لتغيير المجموعات أو الملاحظة أو الفيديو.",
  "Nothing scheduled for": "لا يوجد شيء مجدول ليوم", "Coach's demo:": "عرض المدرب:", Target: "الهدف:",
  "No diet check-ins yet.": "لا توجد متابعات غذائية بعد.", video: "فيديو", week: "أسبوع",
  "Coach:": "المدرب:", "Last updated: July 18, 2026": "آخر تحديث: 18 يوليو 2026",
  "This Changelog is now available before sign-in.": "سجل التحديثات متاح الآن قبل تسجيل الدخول.",
  "Workout and diet plans can be saved and reused without changing other players’ plans.": "يمكن حفظ خطط التدريب والغذاء وإعادة استخدامها دون تغيير خطط اللاعبين الآخرين.",
  "Progress and diet pages load only the information requested by the user.": "تحمّل صفحات التقدم والغذاء المعلومات التي يطلبها المستخدم فقط.",
  "Private chat supports text, pictures, videos, audio, and recorded voice messages.": "تدعم المحادثة الخاصة النصوص والصور والفيديو والصوت والرسائل الصوتية المسجلة.",
  VIP: "VIP", "Duplicated to": "تم النسخ إلى", "Add to": "إضافة إلى", slots: "خانات", food: "طعام",
  "'s diet to the next N weeks (overwrites target weeks):": " الغذائي إلى الأسابيع التالية (يستبدل الأسابيع المستهدفة):",
  "Copied to": "تم النسخ إلى", "+ Add New Exercise": "+ إضافة تمرين جديد",
  ", or change the current search and status filters.": "، أو غيّر فلاتر البحث والحالة الحالية.",
  kg: "كجم", "completed of": "مكتمل من",
  "Add workouts and exercises now — they'll be saved together with the day.": "أضف الحصص والتمارين الآن وسيتم حفظها مع اليوم.",
  Push: "دفع", "Chest Press": "ضغط الصدر", Comment: "تعليق", to: "إلى",
  "and all its exercises": "وكل تمارينه", "This will delete": "سيؤدي هذا إلى حذف",
  "and all its exercises from this day.": "وكل تمارينه من هذا اليوم.", exercise: "تمرين", "+ Exercise": "+ تمرين",
  "sets ·": "مجموعات ·", "'s full schedule to the next N weeks (overwrites target weeks):": " الكامل إلى الأسابيع التالية (يستبدل الأسابيع المستهدفة):",
  "This replaces the player’s existing schedule from Week": "سيستبدل هذا جدول اللاعب الحالي من الأسبوع",
  "through Week": "حتى الأسبوع", "Add notes for this workout": "أضف ملاحظات لهذه الحصة",
  "+ &nbsp; Exercise": "+ تمرين", "Search Exercises…": "البحث عن التمارين…", exercises: "تمارين",
  "Download a blank Excel template, fill it with a full program (weeks, days, workouts, exercises), then import it for a player below.": "نزّل قالب Excel فارغًا واملأه ببرنامج كامل ثم استورده للاعب أدناه.",
  "Choose a player, then upload a filled template. This replaces the player's entire existing program.": "اختر لاعبًا ثم ارفع القالب المكتمل. سيستبدل هذا برنامج اللاعب الحالي بالكامل.",
  "days,": "أيام،", "exercises ✓": "تمارين ✓",
  "Download the blank diet workbook, fill in its weeks and days, then import it for a selected player.": "نزّل ملف الغذاء الفارغ واملأ أسابيعه وأيامه ثم استورده للاعب محدد.",
  "Choose a player first. Importing replaces that player's entire diet plan.": "اختر لاعبًا أولًا. سيستبدل الاستيراد خطة غذائه بالكامل.",
  "meals, and": "وجبات، و", "food rows ✓": "صفوف طعام ✓",
  "1 day — Monday": "يوم واحد — الاثنين", "2 days — Monday and Thursday": "يومان — الاثنين والخميس",
  "3 days — Monday, Wednesday and Friday": "3 أيام — الاثنين والأربعاء والجمعة",
  "15 days": "15 يومًا", "1 month": "شهر واحد", "3 months": "3 أشهر", "6 months": "6 أشهر", "1 year": "سنة واحدة",
  "Share this with the new": "شارك هذا مع", rounds: "جولات", blocks: "مجموعات", sections: "أقسام", groups: "مجموعات",
  "% max": "% من الحد الأقصى", "Pulse Coach": "مدرب Pulse", "Preview navigation": "معاينة التنقل",
  "Strength / 04": "القوة / 04", "4 sets · 8 reps": "4 مجموعات · 8 تكرارات", "3 sets · 10 reps": "3 مجموعات · 10 تكرارات",
  "3 sets · 12 reps": "3 مجموعات · 12 تكرارًا", "32 min": "32 دقيقة", "4 week streak": "سلسلة 4 أسابيع",
  "TRAIN SMARTER": "تدرّب بذكاء", "RECOVER BETTER": "تعافَ أفضل", "STAY CONSISTENT": "استمر بثبات",
  ". Please renew with your coach to view your training program.": ". يرجى التجديد مع مدربك لعرض برنامجك التدريبي.",
  ": Diet plan for": ": خطة الغذاء ليوم", "Coach note": "ملاحظة المدرب", "No diet set for": "لا يوجد غذاء محدد ليوم",
  "e.g. 175 cm": "مثال: 175 سم", "Mobile number": "رقم الهاتف", "Your sport": "رياضتك", "Position or role": "المركز أو الدور",
  "sets ×": "مجموعات ×", reps: "تكرارات", Set: "مجموعة", "✓ Done": "✓ تم", "Edit workout": "تعديل الحصة",
  ": Training program for": ": برنامج التدريب ليوم", "Last updated: July": "آخر تحديث: يوليو",
});

const textOriginals = new WeakMap<Text, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();
const arCaseInsensitive = new Map(
  Object.entries(ar).map(([english, arabic]) => [english.toLocaleLowerCase("en"), arabic]),
);

function translateText(value: string): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;
  const exact = ar[core] ?? arCaseInsensitive.get(core.toLocaleLowerCase("en"));
  if (exact) return leading + exact + trailing;
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
    [/^Welcome, (.+)$/, (name) => `مرحبًا، ${name}`],
    [/^Hi, (.+)$/, (name) => `مرحبًا، ${name}`],
    [/^Coach: (.+)$/, (name) => `المدرب: ${name}`],
    [/^(.+) days logged$/, (n) => `${n} أيام مسجلة`],
    [/^(.+) meals followed$/, (n) => `${n} وجبات ملتزم بها`],
    [/^(.+) of (.+)$/, (a, b) => `${a} من ${b}`],
    [/^Delete (.+)\?$/, (x) => `حذف ${x}؟`],
    [/^Remove (.+)\?$/, (x) => `إزالة ${x}؟`],
    [/^Renew (.+)\?$/, (x) => `تجديد ${x}؟`],
    [/^Revoke (.+)\?$/, (x) => `إلغاء صلاحية ${x}؟`],
    [/^Could not load (.+)$/, (x) => `تعذر تحميل ${x}`],
    [/^Could not save (.+)$/, (x) => `تعذر حفظ ${x}`],
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
    for (const attr of ["placeholder", "title", "aria-label", "aria-description", "alt"]) {
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
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label", "aria-description", "alt"], subtree: true });
    return () => observer.disconnect();
  }, [language]);
  useEffect(() => {
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;
    window.alert = (message?: unknown) => originalAlert(language === "ar" ? translateText(String(message ?? "")) : message);
    window.confirm = (message?: string) => originalConfirm(language === "ar" ? translateText(String(message ?? "")) : String(message ?? ""));
    window.prompt = (message?: string, defaultValue?: string) => originalPrompt(
      language === "ar" ? translateText(String(message ?? "")) : String(message ?? ""),
      language === "ar" && defaultValue ? translateText(defaultValue) : defaultValue,
    );
    document.title = language === "ar" ? "ترينوفا" : "Trainova";
    return () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
    };
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
