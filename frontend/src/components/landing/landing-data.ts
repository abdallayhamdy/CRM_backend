export type Locale = 'ar' | 'en';

export const landingContent = {
  ar: {
    nav: {
      cta: 'ابدأ الآن',
    },
    hero: {
      badge: 'نظام CRM مصمم للنمو',
      title: 'مصمم للنمو.',
      subtitle: 'Rootline CRM هو نظام CRM شامل يساعدك على إدارة العملاء، الصفقات، والSBATCH pipelines بكفاءة. تتبع، حلل، ونمو مع أداة واحدة.',
      cta: 'ابدأ رحلة النمو',
    },
    stats: {
      items: [
        { value: '14+', label: 'سنة خبرة' },
        { value: '230+', label: 'مشروع منجز' },
        { value: '12', label: 'دولة' },
        { value: '#1', label: 'في المنطقة' },
      ],
    },
    partners: {
      title: 'شركاؤنا',
    },
    features: {
      sectionTitle: 'ليس مجرد نظام آخر',
      sectionSubtitle: 'نظام تشغيل متكامل للنمو',
      description: 'Rootline CRM هو أكثر من مجرد CRM - هو نظام تشغيل متكامل يساعد شركتك على النمو بذكاء. أدوات متقدمة، تحليلات فورية، وتجربة مستخدم سلسة.',
      items: [
        {
          title: 'إدارة العملاء',
          description: 'نظّم جميع بيانات عملائك في مكان واحد مع ملفات تعريف شاملة وتاريخ تفاعلات.',
          icon: 'users',
        },
        {
          title: 'إدارة الصفقات',
          description: 'تتبع الصفقات من الأولوية إلى الإغلاق مع لوحات بصرية وتحليلات متقدمة.',
          icon: 'handshake',
        },
        {
          title: 'خطوط الأنابيب',
          description: 'أنشئ خطوط أنابيب مخصصة لمتابعة مراحل كل صفقة بصرياً.',
          icon: 'git-branch',
        },
        {
          title: 'التقارير والتحليلات',
          description: 'احصل على رؤى عميقة لأدائك مع تقارير قابلة للتخصيص وDashboard تفاعلي.',
          icon: 'bar-chart-3',
        },
        {
          title: 'إدارة المهام',
          description: 'نظّم مهامك وتذكيراتك وتابع إنجاز فريقك بكفاءة.',
          icon: 'check-square',
        },
        {
          title: 'إدارة الطلبات',
          description: 'تتبع الطلبات من الاستلام إلى التوصيل مع إدارة المخزون.',
          icon: 'package',
        },
      ] as const,
    },
    services: {
      sectionTitle: 'خدماتنا المتكاملة',
      sectionSubtitle: 'حلول CRM شاملة لتيرة عملك',
      description: 'نقدم مجموعة متكاملة من الخدمات التي تغطي جميع احتياجات إدارة العلاقات مع العملاء. من التأسيس إلى التوسع.',
      groups: [
        {
          number: '01',
          title: 'التأسيس',
          subtitle: 'ابدأ ببناء أساس متين لإدارة علاقاتك',
          items: [
            {
              title: 'إعداد النظام',
              description: 'تخصيص Rootline CRM حسب احتياجات شركتك مع إعداد الأدوات والملفات الأساسية.',
              icon: 'settings',
            },
            {
              title: 'استيراد البيانات',
              description: 'نقل بيانات عملائك الحاليين من Excel أو أي نظام آخر بسهولة وأمان.',
              icon: 'upload',
            },
            {
              title: 'تدريب الفريق',
              description: 'دورات تدريبية شاملة لفريقك لضمان استخدام النظام بكفاءة قصوى.',
              icon: 'graduation-cap',
            },
          ],
        },
        {
          number: '02',
          title: 'الإدارة',
          subtitle: 'نظّم وتابع جميع أعمالك من مكان واحد',
          items: [
            {
              title: 'إدارة العملاء',
              description: 'ملفات تعريف شاملة لكل عميل مع تاريخ التفاعلات والملاحظات.',
              icon: 'users',
            },
            {
              title: 'إدارة الصفقات',
              description: 'تتبع كل صفقة من الاستفسار إلى الإغلاق مع تحذيرات ذكية.',
              icon: 'handshake',
            },
            {
              title: 'خطوط الأنابيب',
              description: 'لوحات بصرية لمتابعة مراحل كل صفقة وتحليل معدلات التحويل.',
              icon: 'git-branch',
            },
          ],
        },
        {
          number: '03',
          title: 'الأتمتة',
          subtitle: 'أتمتة المهام المتكررة ووفّر وقتك',
          items: [
            {
              title: 'سير العمل التلقائي',
              description: 'إنشاء قواعد وأتمتة للمهام المتكررة لتوفير الوقت والجهد.',
              icon: 'zap',
            },
            {
              title: 'التذكيرات الذكية',
              description: 'تذكيرات تلقائية للمهام المهمة ولمتابعة العملاء.',
              icon: 'bell',
            },
            {
              title: 'الرسائل التلقائية',
              description: 'إرسال رسائل مخصصة تلقائياً بناءً على سلوك العميل.',
              icon: 'mail',
            },
          ],
        },
        {
          number: '04',
          title: 'التحليل والنمو',
          subtitle: 'احصل على رؤى عميقة لاتخاذ قرارات أفضل',
          items: [
            {
              title: 'التقارير الذكية',
              description: 'تقارير تفاعلية بأداء فريقك ومعدلات إغلاق الصفقات.',
              icon: 'bar-chart-3',
            },
            {
              title: 'تحليل البيانات',
              description: 'رؤى عميقة لسلوك العملاء واتجاهات السوق لاتخاذ قرارات أفضل.',
              icon: 'trending-up',
            },
            {
              title: 'تحسين الأداء',
              description: 'توصيات ذكية لتحسين استراتيجيات المبيعات والتسويق.',
              icon: 'target',
            },
          ],
        },
      ],
    },
    howWeWork: {
      sectionTitle: 'كيف نعمل',
      sectionSubtitle: 'إطار عمل مثبت للنمو',
      description: 'منهجية نظامية من 5 مراحل تحوّل وجودتك الرقمية إلى محرك نمو متوقع.',
      cta: 'ابدأ رحلة النمو',
      stages: [
        {
          id: 'discover',
          number: '01',
          label: 'اكتشف',
          title: 'تحليل شامل للعملاء',
          description: 'نحلل قاعدة عملائك وسلوكهم وفرص النمو المتاحة. لا تخمين - فقط بيانات حقيقية تكشف فرص النمو الحقيقية.',
          deliverables: [
            'تحليل سلوك العملاء',
            'خريطة فرص النمو',
            'تقييم رضا العملاء',
            'تحليل المنافسين',
          ],
        },
        {
          id: 'strategize',
          number: '02',
          label: 'خطط',
          title: 'وضع استراتيجية المبيعات',
          description: 'نضع خطة عمل مخصصة تحدد الأهداف والقنوات والموارد اللازمة لتحقيق النمو المطلوب.',
          deliverables: [
            'خطة استراتيجية المبيعات',
            'تحديد القنوات المناسبة',
            'جدول زمني للتنفيذ',
            'مؤشرات الأداء الرئيسية',
          ],
        },
        {
          id: 'execute',
          number: '03',
          label: 'نفّذ',
          title: 'بناء خطوط الأنابيب',
          description: 'نُنشئ ونُعد خطوط الأنابيب وتسلسلات المتابعة لتضمن عدم فوات أي فرصة.',
          deliverables: [
            'إعداد خطوط الأنابيب',
            'تسلسلات المتابعة',
            'أتمتة الرسائل',
            'تدريب الفريق',
          ],
        },
        {
          id: 'optimize',
          number: '04',
          label: 'حسّن',
          title: 'تحسين الأداء المستمر',
          description: 'نراقب الأداء ونحلل النتائج ونُحسّن العمليات باستمرار لتحقيق أفضل النتائج.',
          deliverables: [
            'تقارير الأداء الأسبوعية',
            'تحليل معدلات التحويل',
            'تحسين سير العمل',
            'اختبار A/B',
          ],
        },
        {
          id: 'scale',
          number: '05',
          label: 'توسّع',
          title: 'توسيع نطاق النمو',
          description: 'نساعدك على توسيع نطاق عملك وزيادة إنتاجية فريقك بأساليب مستدامة.',
          deliverables: [
            'توسيع فريق المبيعات',
            'إضافة قنوات جديدة',
            'أتمتة متقدمة',
            'نمو مستدام',
          ],
        },
      ],
    },
    howItWorks: {
      sectionTitle: 'كيف يعمل Rootline CRM؟',
      sectionSubtitle: 'ثلاث خطوات بسيطة لبدء إدارة عملك',
      steps: [
        {
          step: '01',
          title: 'أنشئ حسابك',
          description: 'سجّل في ثوانٍ وأدخل بيانات شركتك. لا حاجة لبطاقة ائتمان.',
        },
        {
          step: '02',
          title: 'أضف فريقك وعملاءك',
          description: 'ادعُ أعضاء فريقك وأضف بيانات عملائك أو استورد البيانات.',
        },
        {
          step: '03',
          title: 'ابدأ في النمو',
          description: 'تابع صفقاتك وأدر مهامك وراقب أدائك مع تقارير ذكية.',
        },
      ],
    },
    faq: {
      sectionTitle: 'الأسئلة الشائعة',
      sectionSubtitle: 'إجابات على الأسئلة الأكثر شيوعاً',
      items: [
        {
          question: 'هل Rootline CRM مجاني؟',
          answer: 'نعم! نقدم خطة مجانية تشمل المميزات الأساسية. كما نوفر خطط مدفوعة للشركات التي تحتاج مميزات متقدمة.',
        },
        {
          question: 'هل يمكنني استيراد بياناتي من نظام آخر؟',
          answer: 'بالتأكيد. ندعم استيراد البيانات من Excel, CSV, وأنظمة CRM أخرى مثل Rootline وSalesforce.',
        },
        {
          question: 'هل البيانات آمنة؟',
          answer: 'أمان بياناتك أولويتنا. نستخدم تشفير AES-256 لحماية البيانات ونخزّنها في مراكز بيانات آمنة مع نسخ احتياطي يومي.',
        },
        {
          question: 'هل يمكنني الوصول للنظام من الجوال؟',
          answer: 'نعم! Rootline CRM يعمل على جميع الأجهزة - الكمبيوتر والتابلت والجوال - مع تجربة مستخدم مثالية.',
        },
        {
          question: 'هل أحتاج لخبرة تقنية لاستخدام النظام؟',
          answer: 'لا! صممنا Rootline CRM ليكون سهل الاستخدام. واجهة بسيطة و直观ية مع دعم فني متواصل.',
        },
      ],
    },
    cta: {
      title: 'ابدأ رحلتك مع Rootline CRM',
      subtitle: 'سجّل دخولك الآن وابدأ في إدارة عملك بذكاء',
      button: 'سجّل دخولك',
    },
    contact: {
      sectionTitle: 'ابدأ الآن',
      sectionSubtitle: 'جرب Rootline CRM لفريقك',
      description: 'أخبرنا عن حجم فريقك وطبيعة عملك وسنقوم بإعداد حساب تجريبي مخصص لك.',
      pipeline: {
        company: 'Rootline CRM',
        pipelineLabel: 'متابعة العملاء المحتملين',
        stages: [
          { name: 'استفسار جديد', status: 'جديد' },
          { name: 'تم التواصل', status: 'متابعة' },
          { name: 'عرض تجريبي', status: 'نشط' },
          { name: 'إتمام الاشتراك', status: 'بانتظار' },
        ],
        note: 'كل طلب يمر بخط أنابيب المبيعات',
      },
      nextSteps: {
        title: 'ماذا يحدث بعد التسجيل؟',
        items: [
          { number: '01', title: 'إعداد الحساب', description: 'نقوم بإعداد حسابك مع الخطط والصلاحيات المناسبة لفريقك' },
          { number: '02', title: 'استيراد البيانات', description: 'نساعدك في نقل بيانات عملائك الحالية من أي نظام آخر' },
          { number: '03', title: 'تدريب الفريق', description: 'جلسة تدريبية مختصرة لفريقك على استخدام النظام بكفاءة' },
          { number: '04', title: 'بدء الاستخدام', description: 'ابدأ في إدارة صفقاتك وعملائك فوراً مع دعم فني مستمر' },
        ],
      },
      form: {
        fullName: 'الاسم الكامل *',
        fullNamePlaceholder: 'مثال: أحمد محمد',
        phone: 'رقم الهاتف *',
        phonePlaceholder: '0100 000 0000',
        email: 'البريد الإلكتروني *',
        emailPlaceholder: 'ahmed@company.com',
        lookingFor: 'ما الذي تبحث عنه؟ *',
        lookingForPlaceholder: 'اختر ما يناسبك...',
        lookingForOptions: ['إدارة العملاء المحتملين', 'تتبع الصفقات', 'إدارة فريق المبيعات', 'تقارير وتحليلات', 'أتمتة المتابعة'],
        companyName: 'اسم الشركة',
        companyNamePlaceholder: 'مثال: شركة النور للتجارة',
        heardAbout: 'كيف سمعت بنا؟',
        heardAboutPlaceholder: 'اختر...',
        heardAboutOptions: ['بحث جوجل', 'فيسبوك / إنستجرام', 'توصية من صديق', 'إعلانات ممولة', 'أخرى'],
        goals: 'أخبرنا عن فريقك',
        goalsPlaceholder: 'كم عدد فريق المبيعات؟ ما النظام الذي تستخدمه حالياً؟ ما أكبر تحدي تواجهه؟',
        submit: 'احجز عرضاً تجريبياً مجانياً',
        responseNote: 'رد خلال 24 ساعة • عرض تجريبي مجاني 14 يوم • لا حاجة لبطاقة ائتمان',
      },
    },
    footer: {
      copyright: '© 2026 Rootline CRM. جميع الحقوق محفوظة.',
    },
  },
  en: {
    nav: {
      cta: 'Get Started',
    },
    hero: {
      badge: 'CRM System Built for Growth',
      title: 'Engineered for Growth.',
      subtitle: 'Rootline CRM is a comprehensive CRM that helps you manage contacts, deals, and pipelines efficiently. Track, analyze, and grow with one powerful tool.',
      cta: 'Start Your Growth Journey',
    },
    stats: {
      items: [
        { value: '14+', label: 'Years Experience' },
        { value: '230+', label: 'Projects Delivered' },
        { value: '12', label: 'Countries' },
        { value: '#1', label: 'In The Region' },
      ],
    },
    partners: {
      title: 'Our Partners',
    },
    features: {
      sectionTitle: 'Not just another system',
      sectionSubtitle: 'A complete growth operating system',
      description: 'Rootline CRM is more than just a CRM - it\'s a complete operating system that helps your business grow smarter. Advanced tools, real-time analytics, and a seamless user experience.',
      items: [
        {
          title: 'Contact Management',
          description: 'Organize all your customer data in one place with comprehensive profiles and interaction history.',
          icon: 'users',
        },
        {
          title: 'Deal Management',
          description: 'Track deals from qualification to closing with visual boards and advanced analytics.',
          icon: 'handshake',
        },
        {
          title: 'Pipeline Views',
          description: 'Create custom pipelines to visually track each deal through its stages.',
          icon: 'git-branch',
        },
        {
          title: 'Reports & Analytics',
          description: 'Get deep insights into your performance with customizable reports and interactive dashboards.',
          icon: 'bar-chart-3',
        },
        {
          title: 'Task Management',
          description: 'Organize your tasks and reminders, and track your team\'s progress efficiently.',
          icon: 'check-square',
        },
        {
          title: 'Order Management',
          description: 'Track orders from receipt to delivery with inventory management built in.',
          icon: 'package',
        },
      ] as const,
    },
    services: {
      sectionTitle: 'Our Integrated Services',
      sectionSubtitle: 'Complete CRM solutions for your business',
      description: 'We provide a comprehensive suite of services that cover all your customer relationship management needs. From setup to scaling.',
      groups: [
        {
          number: '01',
          title: 'Foundation',
          subtitle: 'Start with building a solid foundation',
          items: [
            {
              title: 'System Setup',
              description: 'Customize Rootline CRM to your business needs with tools and profile configuration.',
              icon: 'settings',
            },
            {
              title: 'Data Import',
              description: 'Easily and securely migrate your customer data from Excel or any other system.',
              icon: 'upload',
            },
            {
              title: 'Team Training',
              description: 'Comprehensive training sessions to ensure your team uses the system efficiently.',
              icon: 'graduation-cap',
            },
          ],
        },
        {
          number: '02',
          title: 'Management',
          subtitle: 'Organize and track all your business from one place',
          items: [
            {
              title: 'Contact Management',
              description: 'Comprehensive profiles for each customer with interaction history and notes.',
              icon: 'users',
            },
            {
              title: 'Deal Management',
              description: 'Track every deal from inquiry to closing with smart alerts.',
              icon: 'handshake',
            },
            {
              title: 'Pipeline Views',
              description: 'Visual boards to track each deal stage and analyze conversion rates.',
              icon: 'git-branch',
            },
          ],
        },
        {
          number: '03',
          title: 'Automation',
          subtitle: 'Automate repetitive tasks and save your time',
          items: [
            {
              title: 'Workflow Automation',
              description: 'Create rules and automation for repetitive tasks to save time and effort.',
              icon: 'zap',
            },
            {
              title: 'Smart Reminders',
              description: 'Automatic reminders for important tasks and customer follow-ups.',
              icon: 'bell',
            },
            {
              title: 'Auto Messages',
              description: 'Send personalized messages automatically based on customer behavior.',
              icon: 'mail',
            },
          ],
        },
        {
          number: '04',
          title: 'Analytics & Growth',
          subtitle: 'Get deep insights to make better decisions',
          items: [
            {
              title: 'Smart Reports',
              description: 'Interactive reports on team performance and deal closing rates.',
              icon: 'bar-chart-3',
            },
            {
              title: 'Data Analysis',
              description: 'Deep insights into customer behavior and market trends for better decisions.',
              icon: 'trending-up',
            },
            {
              title: 'Performance Optimization',
              description: 'Smart recommendations to improve sales and marketing strategies.',
              icon: 'target',
            },
          ],
        },
      ],
    },
    howWeWork: {
      sectionTitle: 'How We Work',
      sectionSubtitle: 'Our Proven Growth Framework',
      description: 'A systematic 5-stage methodology that transforms your digital presence into a predictable growth engine.',
      cta: 'Start Your Growth Journey',
      stages: [
        {
          id: 'discover',
          number: '01',
          label: 'Discover',
          title: 'Deep Customer Intelligence',
          description: 'We analyze your customer base, behavior patterns, and growth opportunities. No guesswork — only real data that reveals true growth opportunities.',
          deliverables: [
            'Customer Behavior Analysis',
            'Growth Opportunity Map',
            'Customer Satisfaction Assessment',
            'Competitor Analysis',
          ],
        },
        {
          id: 'strategize',
          number: '02',
          label: 'Strategize',
          title: 'Sales Strategy Planning',
          description: 'We develop a customized plan that defines goals, channels, and resources needed to achieve the desired growth.',
          deliverables: [
            'Sales Strategy Plan',
            'Channel Selection',
            'Implementation Timeline',
            'Key Performance Indicators',
          ],
        },
        {
          id: 'execute',
          number: '03',
          label: 'Execute',
          title: 'Pipeline Implementation',
          description: 'We build and configure your pipelines and follow-up sequences to ensure no opportunity is missed.',
          deliverables: [
            'Pipeline Setup',
            'Follow-up Sequences',
            'Message Automation',
            'Team Training',
          ],
        },
        {
          id: 'optimize',
          number: '04',
          label: 'Optimize',
          title: 'Continuous Optimization',
          description: 'We monitor performance, analyze results, and continuously improve processes to achieve the best outcomes.',
          deliverables: [
            'Weekly Performance Reports',
            'Conversion Rate Analysis',
            'Workflow Optimization',
            'A/B Testing',
          ],
        },
        {
          id: 'scale',
          number: '05',
          label: 'Scale',
          title: 'Growth & Expansion',
          description: 'We help you expand your business reach and increase team productivity with sustainable methods.',
          deliverables: [
            'Sales Team Expansion',
            'New Channel Addition',
            'Advanced Automation',
            'Sustainable Growth',
          ],
        },
      ],
    },
    howItWorks: {
      sectionTitle: 'How Rootline CRM Works',
      sectionSubtitle: 'Three simple steps to start managing your business',
      steps: [
        {
          step: '01',
          title: 'Create Your Account',
          description: 'Sign up in seconds and enter your basic company info. No credit card required.',
        },
        {
          step: '02',
          title: 'Add Your Team & Contacts',
          description: 'Invite your team members and import your existing contacts or add them manually.',
        },
        {
          step: '03',
          title: 'Start Growing',
          description: 'Track your deals, manage tasks, and monitor performance with smart reports.',
        },
      ],
    },
    faq: {
      sectionTitle: 'Frequently Asked Questions',
      sectionSubtitle: 'Answers to the most common questions',
      items: [
        {
          question: 'Is Rootline CRM free?',
          answer: 'Yes! We offer a free plan that includes all essential features. We also offer paid plans for businesses that need advanced features.',
        },
        {
          question: 'Can I import my data from another system?',
          answer: 'Absolutely. We support importing data from Excel, CSV, and other CRM systems like Rootline and Salesforce.',
        },
        {
          question: 'Is my data secure?',
          answer: 'Data security is our top priority. We use AES-256 encryption and store data in secure data centers with daily backups.',
        },
        {
          question: 'Can I access the system from mobile?',
          answer: 'Yes! Rootline CRM works on all devices - desktop, tablet, and mobile - with an optimal user experience.',
        },
        {
          question: 'Do I need technical skills to use the system?',
          answer: 'No! We designed Rootline CRM to be easy to use. A simple, intuitive interface with continuous technical support.',
        },
      ],
    },
    cta: {
      title: 'Start Your Journey with Rootline CRM',
      subtitle: 'Sign in now and start running your business smarter',
      button: 'Sign In',
    },
    contact: {
      sectionTitle: 'Get Started',
      sectionSubtitle: 'Try Rootline CRM for Your Team',
      description: 'Tell us about your team size and business type — we\'ll set up a personalized demo account for you.',
      pipeline: {
        company: 'Rootline CRM',
        pipelineLabel: 'LEAD TRACKING PIPELINE',
        stages: [
          { name: 'New Inquiry', status: 'NEW' },
          { name: 'Contacted', status: 'FOLLOW-UP' },
          { name: 'Live Demo', status: 'ACTIVE' },
          { name: 'Subscription', status: 'PENDING' },
        ],
        note: 'Every lead goes through our sales pipeline',
      },
      nextSteps: {
        title: 'What Happens After Signup',
        items: [
          { number: '01', title: 'Account Setup', description: 'We configure your account with the right plan and permissions for your team' },
          { number: '02', title: 'Data Migration', description: 'We help you import your existing customer data from any other system' },
          { number: '03', title: 'Team Training', description: 'A quick training session for your team to start using the system efficiently' },
          { number: '04', title: 'Go Live', description: 'Start managing your deals and contacts immediately with ongoing support' },
        ],
      },
      form: {
        fullName: 'Full Name *',
        fullNamePlaceholder: 'e.g. Ahmed Mohamed',
        phone: 'Phone Number *',
        phonePlaceholder: '0100 000 0000',
        email: 'Work Email *',
        emailPlaceholder: 'ahmed@company.com',
        lookingFor: 'What are you looking for? *',
        lookingForPlaceholder: 'Select what fits you...',
        lookingForOptions: ['Lead Management', 'Deal Tracking', 'Sales Team Management', 'Reports & Analytics', 'Follow-up Automation'],
        companyName: 'Company Name',
        companyNamePlaceholder: 'e.g. Al Noor Trading Co.',
        heardAbout: 'How did you hear about us?',
        heardAboutPlaceholder: 'Select...',
        heardAboutOptions: ['Google Search', 'Facebook / Instagram', 'Friend Referral', 'Paid Ads', 'Other'],
        goals: 'Tell us about your team',
        goalsPlaceholder: 'How many sales reps? What system do you use currently? What\'s your biggest challenge?',
        submit: 'Book a Free Demo',
        responseNote: 'Response within 24 hours • 14-day free trial • No credit card required',
      },
    },
    footer: {
      copyright: '© 2026 Rootline CRM. All rights reserved.',
    },
  },
} as const;
