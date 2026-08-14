// Mock Data for all entities

export const mockWorkspaces = [
  {
    id: 'ws_1',
    name: 'LeadSwift Demo',
    logo_url: null as string | null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const mockUsers = [
  {
    id: 'user_1',
    email: 'admin@leadswift.com',
    firstName: 'أحمد',
    lastName: 'محمد',
    avatarUrl: null as string | null,
    role: 'owner' as const,
    workspace_id: 'ws_1',
    profile_id: 'profile_1'
  },
  {
    id: 'user_2',
    email: 'sara@leadswift.com',
    firstName: 'سارة',
    lastName: 'علي',
    avatarUrl: null as string | null,
    role: 'admin' as const,
    workspace_id: 'ws_1',
    profile_id: 'profile_2'
  }
]

export const mockContacts = [
  {
    id: 'contact_1',
    workspace_id: 'ws_1',
    first_name: 'محمد',
    last_name: 'أحمد',
    email: 'mohamed@example.com',
    phone: '+966501234567',
    company: 'شركة التقنية',
    position: 'مدير تقني',
    status: 'active',
    lead_source: 'website',
    notes: 'مهتم بالمنتج',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'contact_2',
    workspace_id: 'ws_1',
    first_name: 'فاطمة',
    last_name: 'حسين',
    email: 'fatma@example.com',
    phone: '+966509876543',
    company: 'مؤسسة النور',
    position: 'مديرة مبيعات',
    status: 'lead',
    lead_source: 'referral',
    notes: 'تفضل التواصل عبر البريد',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'contact_3',
    workspace_id: 'ws_1',
    first_name: 'خالد',
    last_name: 'العتيبي',
    email: 'khalid@example.com',
    phone: '+966555555555',
    company: 'شركة المستقبل',
    position: 'مدير مشتريات',
    status: 'customer',
    lead_source: 'linkedin',
    notes: 'عميل مميز',
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-01T09:15:00Z'
  },
  {
    id: 'contact_4',
    workspace_id: 'ws_1',
    first_name: 'نورة',
    last_name: 'الشمري',
    email: 'noura@example.com',
    phone: '+966511111111',
    company: 'مجموعة الابتكار',
    position: 'مديرة تسويق',
    status: 'active',
    lead_source: 'campaign',
    notes: 'تتابع حملات التسويق',
    created_at: '2024-02-10T11:45:00Z',
    updated_at: '2024-02-10T11:45:00Z'
  },
  {
    id: 'contact_5',
    workspace_id: 'ws_1',
    first_name: 'عبدالله',
    last_name: 'القصيبي',
    email: 'abdullah@example.com',
    phone: '+966522222222',
    company: 'شركة البيانات',
    position: 'مدير تقني',
    status: 'lead',
    lead_source: 'event',
    notes: 'قابلته في مؤتمر tech summit',
    created_at: '2024-02-15T16:20:00Z',
    updated_at: '2024-02-15T16:20:00Z'
  }
]

export const mockCompanies = [
  {
    id: 'company_1',
    workspace_id: 'ws_1',
    name: 'شركة التقنية المتقدمة',
    industry: 'تكنولوجيا',
    size: '50-200',
    website: 'https://tech-example.com',
    email: 'info@tech-example.com',
    phone: '+966112345678',
    address: 'الرياض، حي العليا',
    notes: 'شركة رائدة في مجال الحلول التقنية',
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 'company_2',
    workspace_id: 'ws_1',
    name: 'مؤسسة الابتكار للتسويق',
    industry: 'تسويق رقمي',
    size: '10-50',
    website: 'https://innovation-marketing.com',
    email: 'contact@innovation-marketing.com',
    phone: '+966118765432',
    address: 'جدة، حي الروضة',
    notes: 'متخصصة في التسويق الرقمي',
    created_at: '2024-01-25T10:30:00Z',
    updated_at: '2024-01-25T10:30:00Z'
  },
  {
    id: 'company_3',
    workspace_id: 'ws_1',
    name: 'مجموعة المستقبل للاستشارات',
    industry: 'استشارات إدارية',
    size: '200+',
    website: 'https://future-group.com',
    email: 'info@future-group.com',
    phone: '+966115554444',
    address: 'الدمام، حي الشاطئ',
    notes: 'استشارات إدارية وتقنية',
    created_at: '2024-02-05T09:00:00Z',
    updated_at: '2024-02-05T09:00:00Z'
  }
]

export const mockDeals = [
  {
    id: 'deal_1',
    workspace_id: 'ws_1',
    title: 'مشروع نظام إدارة المحتوى',
    contact_id: 'contact_1',
    company_id: 'company_1',
    value: 150000,
    currency: 'SAR',
    stage: 'qualified',
    status: 'open',
    priority: 'high',
    expected_close_date: '2024-03-30',
    probability: 75,
    notes: 'العميل مهتم جداً بالمشروع',
    created_at: '2024-01-20T12:00:00Z',
    updated_at: '2024-01-20T12:00:00Z'
  },
  {
    id: 'deal_2',
    workspace_id: 'ws_1',
    title: 'تطبيق موبايل للتجارة الإلكترونية',
    contact_id: 'contact_3',
    company_id: 'company_3',
    value: 300000,
    currency: 'SAR',
    stage: 'proposal',
    status: 'open',
    priority: 'high',
    expected_close_date: '2024-04-15',
    probability: 60,
    notes: 'تم تقديم العرض السعري',
    created_at: '2024-02-01T14:00:00Z',
    updated_at: '2024-02-01T14:00:00Z'
  },
  {
    id: 'deal_3',
    workspace_id: 'ws_1',
    title: 'نظام CRM مخصص',
    contact_id: 'contact_2',
    company_id: 'company_2',
    value: 200000,
    currency: 'SAR',
    stage: 'negotiation',
    status: 'open',
    priority: 'medium',
    expected_close_date: '2024-03-20',
    probability: 80,
    notes: 'في مرحلة التفاوض النهائي',
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2024-02-10T10:00:00Z'
  },
  {
    id: 'deal_4',
    workspace_id: 'ws_1',
    title: 'استشارة استراتيجية رقمية',
    contact_id: 'contact_4',
    company_id: 'company_1',
    value: 50000,
    currency: 'SAR',
    stage: 'closed_won',
    status: 'won',
    priority: 'low',
    expected_close_date: '2024-02-28',
    probability: 100,
    notes: 'تم إغلاق الصفقة بنجاح',
    created_at: '2024-01-25T16:00:00Z',
    updated_at: '2024-02-28T16:00:00Z'
  },
  {
    id: 'deal_5',
    workspace_id: 'ws_1',
    title: 'تطوير موقع إلكتروني',
    contact_id: 'contact_5',
    company_id: 'company_3',
    value: 80000,
    currency: 'SAR',
    stage: 'discovery',
    status: 'open',
    priority: 'medium',
    expected_close_date: '2024-05-01',
    probability: 30,
    notes: 'في مرحلة اكتشاف الاحتياجات',
    created_at: '2024-02-20T11:30:00Z',
    updated_at: '2024-02-20T11:30:00Z'
  }
]

export const mockActivities = [
  {
    id: 'activity_1',
    workspace_id: 'ws_1',
    contact_id: 'contact_1',
    deal_id: 'deal_1',
    type: 'call',
    title: 'مكالمة هاتفية',
    description: 'تم التواصل مع العميل لمناقشة المتطلبات',
    status: 'completed',
    priority: 'high',
    due_date: '2024-02-20T10:00:00Z',
    completed_at: '2024-02-20T10:30:00Z',
    created_at: '2024-02-19T09:00:00Z',
    updated_at: '2024-02-20T10:30:00Z'
  },
  {
    id: 'activity_2',
    workspace_id: 'ws_1',
    contact_id: 'contact_2',
    deal_id: 'deal_3',
    type: 'meeting',
    title: 'اجتماع تقديم العرض',
    description: 'تقديم العرض السعري للعميل',
    status: 'scheduled',
    priority: 'high',
    due_date: '2024-03-01T14:00:00Z',
    completed_at: null,
    created_at: '2024-02-25T11:00:00Z',
    updated_at: '2024-02-25T11:00:00Z'
  },
  {
    id: 'activity_3',
    workspace_id: 'ws_1',
    contact_id: 'contact_3',
    deal_id: 'deal_2',
    type: 'email',
    title: 'إرسال العرض الفني',
    description: 'إرسال التفاصيل الفنية للتطبيق',
    status: 'completed',
    priority: 'medium',
    due_date: '2024-02-15T09:00:00Z',
    completed_at: '2024-02-15T09:15:00Z',
    created_at: '2024-02-14T08:00:00Z',
    updated_at: '2024-02-15T09:15:00Z'
  }
]

export const mockQuotations = [
  {
    id: 'quote_1',
    workspace_id: 'ws_1',
    deal_id: 'deal_1',
    contact_id: 'contact_1',
    company_id: 'company_1',
    number: 'Q-2024-001',
    status: 'sent',
    total: 150000,
    tax: 22500,
    discount: 0,
    valid_until: '2024-03-15',
    notes: 'عرض سعري لنظام إدارة المحتوى',
    items: [
      {
        id: 'item_1',
        description: 'تصميم واجهة المستخدم',
        quantity: 1,
        unit_price: 50000,
        total: 50000
      },
      {
        id: 'item_2',
        description: 'تطوير الباك إند',
        quantity: 1,
        unit_price: 80000,
        total: 80000
      },
      {
        id: 'item_3',
        description: 'اختبار وضبط',
        quantity: 1,
        unit_price: 20000,
        total: 20000
      }
    ],
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  }
]

export const mockInvoices = [
  {
    id: 'inv_1',
    workspace_id: 'ws_1',
    deal_id: 'deal_4',
    contact_id: 'contact_4',
    company_id: 'company_1',
    number: 'INV-2024-001',
    status: 'paid',
    total: 50000,
    tax: 7500,
    discount: 0,
    due_date: '2024-03-15',
    paid_date: '2024-03-10',
    notes: 'فاتورة الاستشارة الاستراتيجية',
    items: [
      {
        id: 'item_1',
        description: 'استشارة استراتيجية رقمية',
        quantity: 1,
        unit_price: 50000,
        total: 50000
      }
    ],
    created_at: '2024-02-28T16:00:00Z',
    updated_at: '2024-03-10T16:00:00Z'
  }
]

export const mockTickets = [
  {
    id: 'ticket_1',
    workspace_id: 'ws_1',
    contact_id: 'contact_3',
    subject: 'مشكلة في تسجيل الدخول',
    description: 'العميل يواجه مشكلة في تسجيل الدخول إلى النظام',
    status: 'open',
    priority: 'high',
    category: 'technical',
    assigned_to: 'user_1',
    created_at: '2024-02-25T09:00:00Z',
    updated_at: '2024-02-25T09:00:00Z'
  },
  {
    id: 'ticket_2',
    workspace_id: 'ws_1',
    contact_id: 'contact_1',
    subject: 'طلب تعديل التقرير',
    description: 'العميل يطلب تعديل تنسيق التقرير الشهري',
    status: 'in_progress',
    priority: 'medium',
    category: 'feature_request',
    assigned_to: 'user_2',
    created_at: '2024-02-20T14:00:00Z',
    updated_at: '2024-02-21T10:00:00Z'
  }
]

export const mockProducts = [
  {
    id: 'product_1',
    workspace_id: 'ws_1',
    name: 'اشتراك سنوي - خطة أساسية',
    description: 'اشتراك سنوي للنظام مع الميزات الأساسية',
    sku: 'SUB-ANN-001',
    price: 12000,
    currency: 'SAR',
    type: 'subscription',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'product_2',
    workspace_id: 'ws_1',
    name: 'تطوير مخصص - ساعة عمل',
    description: 'ساعة عمل للتطوير المخصص',
    sku: 'DEV-HR-001',
    price: 500,
    currency: 'SAR',
    type: 'service',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const mockDocuments = [
  {
    id: 'doc_1',
    workspace_id: 'ws_1',
    name: 'عرض سعري - نظام إدارة المحتوى.pdf',
    type: 'quotation',
    related_type: 'deal',
    related_id: 'deal_1',
    file_url: '/mock/documents/quote-1.pdf',
    file_size: 1024000,
    uploaded_by: 'user_1',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  }
]
