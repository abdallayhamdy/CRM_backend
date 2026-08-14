<?php

namespace Database\Seeders;

use App\Models\Deal;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Pipeline;
use App\Models\PipelineStage;
use App\Models\Stage;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderLineItem;
use App\Models\Ticket;
use App\Models\Activity;
use App\Models\ActivityComment;
use App\Models\Document;
use App\Models\Note;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\PlatformSettings;
use App\Services\ContactStageService;
use App\Services\CompanyStageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    private const PASSWORD = '12345678';

    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        // =====================================================================
        //  Find or create the workspace
        // =====================================================================
        $workspace = Workspace::firstOrCreate(
            ['name' => 'LeadSwift CRM'],
            [
                'status' => 'active',
            ]
        );

        setPermissionsTeamId($workspace->id);

        // =====================================================================
        //  DELETE all existing data except workspace
        // =====================================================================
        $this->wipeAllData($workspace);

        // =====================================================================
        //  Create Platform Owner (super admin) — NO workspace associations
        // =====================================================================
        $platformOwner = $this->createPlatformOwner();

        // =====================================================================
        //  Create Workspace Users with correct roles
        // =====================================================================
        $workspaceOwner   = $this->createWorkspaceUser('Workspace Owner',  'admin@crm.com',   'Admin CRM',  $workspace, 'Workspace Owner');
        $workspaceAdmin   = $this->createWorkspaceUser('Workspace Admin',  'ahmed@crm.com',   'Ahmed Staff', $workspace, 'Workspace Admin');
        $workspaceMember  = $this->createWorkspaceUser('Workspace Member', 'sarah@crm.com',   'Sara Ahmed',  $workspace, 'Workspace Member');
        $workspaceViewer  = $this->createWorkspaceUser('Workspace Viewer', 'viewer@crm.com',  'Viewer User', $workspace, 'Workspace Viewer');

        // Extra demo members
        $extraMembers = $this->seedExtraMembers($workspace);

        $allWorkspaceUsers = array_merge([$workspaceOwner, $workspaceAdmin, $workspaceMember, $workspaceViewer], $extraMembers);

        // =====================================================================
        //  Seed CRM Data
        // =====================================================================
        $pipelineStageIds = $this->seedPipeline($workspace);
        $dealStageIds     = $this->seedDealStages($workspace);
        $this->seedSystemStages($workspace);

        $contactStages = Stage::where('workspace_id', $workspace->id)
            ->where('object_type', 'contact')->pluck('id')->toArray();
        $companyStages = Stage::where('workspace_id', $workspace->id)
            ->where('object_type', 'company')->pluck('id')->toArray();

        $companies = $this->seedCompanies($workspace, $allWorkspaceUsers, $workspaceOwner, $companyStages);
        $contacts  = $this->seedContacts($workspace, $companies, $allWorkspaceUsers, $workspaceOwner, $contactStages);
        $products  = $this->seedProducts($workspace);
        $deals     = $this->seedDeals($workspace, $contacts, $companies, $allWorkspaceUsers, $dealStageIds, $pipelineStageIds);
        $this->seedTickets($workspace, $contacts, $allWorkspaceUsers);
        $this->seedOrders($workspace, $contacts, $companies, $allWorkspaceUsers, $products);
        $this->seedActivities($workspace, $allWorkspaceUsers, $deals, $contacts, $companies);
        $this->seedDocuments($workspace, $allWorkspaceUsers, $deals, $contacts, $companies);
        $this->seedNotes($workspace, $allWorkspaceUsers, $deals, $contacts, $companies);
        $this->seedTasks($workspace, $allWorkspaceUsers, $workspaceOwner, $deals, $contacts, $companies);
        $this->seedActivityComments($workspace, $allWorkspaceUsers);

        // =====================================================================
        //  Output summary
        // =====================================================================
        $this->command->info('');
        $this->command->info('=== RBAC SEED COMPLETE ===');
        $this->command->info('');
        $this->command->info('Demo Accounts:');
        $this->command->info('  Platform Owner : owner@crm.com   / ' . self::PASSWORD . ' (is_super_admin=1, NO workspace)');
        $this->command->info('  Workspace Owner: admin@crm.com   / ' . self::PASSWORD . ' (full workspace access)');
        $this->command->info('  Workspace Admin: ahmed@crm.com   / ' . self::PASSWORD . ' (all except billing/delete)');
        $this->command->info('  Workspace Member: sarah@crm.com  / ' . self::PASSWORD . ' (create/edit own, view reports)');
        $this->command->info('  Workspace Viewer: viewer@crm.com / ' . self::PASSWORD . ' (read-only)');
        $this->command->info('');
    }

    // =========================================================================
    //  Platform Owner — isolated from all workspaces
    // =========================================================================
    private function createPlatformOwner(): User
    {
        $user = User::updateOrCreate(
            ['email' => 'owner@crm.com'],
            [
                'name'           => 'Platform Owner',
                'password'       => Hash::make(self::PASSWORD),
                'workspace_id'   => null,
                'is_super_admin' => true,
            ]
        );

        // Ensure NO workspace associations
        DB::table('workspace_user')->where('user_id', $user->id)->delete();
        DB::table('model_has_roles')->where('model_id', $user->id)->delete();
        DB::table('model_has_permissions')->where('model_id', $user->id)->delete();

        // The platform is bootstrapped as soon as the first Platform Owner exists.
        // This flag is what closes the public /api/bootstrap endpoint.
        PlatformSettings::instance()->forceFill(['bootstrap_completed_at' => now()])->save();

        return $user;
    }

    // =========================================================================
    //  Workspace User — with correct Spatie role + workspace_user pivot
    // =========================================================================
    private function createWorkspaceUser(
        string $roleName,
        string $email,
        string $name,
        Workspace $workspace,
        string $spatieRole,
    ): User {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name'           => $name,
                'password'       => Hash::make(self::PASSWORD),
                'workspace_id'   => $workspace->id,
                'is_super_admin' => false,
            ]
        );

        setPermissionsTeamId($workspace->id);
        $user->syncRoles($spatieRole);

        DB::table('workspace_user')->updateOrInsert(
            ['user_id' => $user->id, 'workspace_id' => $workspace->id],
            [
                'is_active'  => true,
                'role_name'  => $roleName,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        return $user;
    }

    // =========================================================================
    //  Extra demo members (all Workspace Member role)
    // =========================================================================
    private function seedExtraMembers(Workspace $workspace): array
    {
        $members = [
            ['name' => 'محمد علي',   'email' => 'mohamed@crm.com'],
            ['name' => 'نورة خالد',  'email' => 'nora@crm.com'],
            ['name' => 'خالد محمود', 'email' => 'khaled@crm.com'],
            ['name' => 'منى يوسف',   'email' => 'mona@crm.com'],
            ['name' => 'ياسر عبدالله','email' => 'yasser@crm.com'],
            ['name' => 'ليلى حسن',   'email' => 'laila@crm.com'],
            ['name' => 'عمر هاني',    'email' => 'omar@crm.com'],
        ];

        $users = [];
        foreach ($members as $data) {
            $users[] = $this->createWorkspaceUser('Workspace Member', $data['email'], $data['name'], $workspace, 'Workspace Member');
        }
        return $users;
    }

    // =========================================================================
    //  Wipe data
    // =========================================================================
    private function wipeAllData(Workspace $workspace): void
    {
        DB::table('order_line_items')->delete();
        DB::table('activity_comments')
            ->whereIn('activity_id', fn($q) => $q->select('id')->from('activities')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('activities')->where('workspace_id', $workspace->id)->delete();
        DB::table('tasks')
            ->whereIn('taskable_id', fn($q) => $q->select('id')->from('deals')->where('workspace_id', $workspace->id))
            ->orWhereIn('taskable_id', fn($q) => $q->select('id')->from('contacts')->where('workspace_id', $workspace->id))
            ->orWhereIn('taskable_id', fn($q) => $q->select('id')->from('companies')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('notes')
            ->whereIn('notable_id', fn($q) => $q->select('id')->from('deals')->where('workspace_id', $workspace->id))
            ->orWhereIn('notable_id', fn($q) => $q->select('id')->from('contacts')->where('workspace_id', $workspace->id))
            ->orWhereIn('notable_id', fn($q) => $q->select('id')->from('companies')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('documents')
            ->whereIn('documentable_id', fn($q) => $q->select('id')->from('deals')->where('workspace_id', $workspace->id))
            ->orWhereIn('documentable_id', fn($q) => $q->select('id')->from('contacts')->where('workspace_id', $workspace->id))
            ->orWhereIn('documentable_id', fn($q) => $q->select('id')->from('companies')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('tickets')
            ->whereIn('contact_id', fn($q) => $q->select('id')->from('contacts')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('deals')->where('workspace_id', $workspace->id)->delete();
        DB::table('orders')->where('workspace_id', $workspace->id)->delete();
        DB::table('contacts')->where('workspace_id', $workspace->id)->delete();
        DB::table('companies')->where('workspace_id', $workspace->id)->delete();
        DB::table('pipeline_stages')
            ->whereIn('pipeline_id', fn($q) => $q->select('id')->from('pipelines')->where('workspace_id', $workspace->id))
            ->delete();
        DB::table('pipelines')->where('workspace_id', $workspace->id)->delete();
        DB::table('stages')->where('workspace_id', $workspace->id)->delete();
        DB::table('products')->where('workspace_id', $workspace->id)->delete();
        DB::table('invitations')->where('workspace_id', $workspace->id)->delete();
        DB::table('teams')->where('workspace_id', $workspace->id)->delete();
        DB::table('personal_access_tokens')->delete();
        DB::table('audit_logs')->delete();
        DB::table('model_has_roles')->where('model_id', '!=', DB::raw("(SELECT id FROM users WHERE email='owner@crm.com' LIMIT 1)"))->delete();
        DB::table('model_has_permissions')->where('model_id', '!=', DB::raw("(SELECT id FROM users WHERE email='owner@crm.com' LIMIT 1)"))->delete();
        DB::table('users')->where('email', '!=', 'owner@crm.com')->delete();
    }

    // =========================================================================
    //  CRM Data Seeders
    // =========================================================================

    private function seedPipeline(Workspace $workspace): array
    {
        $pipeline = Pipeline::create([
            'workspace_id' => $workspace->id,
            'name' => 'مسار المبيعات',
            'is_default' => true,
        ]);

        $stages = [
            ['name' => 'مكالمة أولية', 'display_order' => 1, 'win_probability' => 10],
            ['name' => 'عرض سعر',      'display_order' => 2, 'win_probability' => 30],
            ['name' => 'تفاوض',        'display_order' => 3, 'win_probability' => 60],
            ['name' => 'مغلقة (مكسب)',  'display_order' => 4, 'win_probability' => 100],
            ['name' => 'مغلقة (خسارة)', 'display_order' => 5, 'win_probability' => 0],
        ];

        $ids = [];
        foreach ($stages as $data) {
            $data['pipeline_id'] = $pipeline->id;
            $ids[] = PipelineStage::create($data)->id;
        }
        return $ids;
    }

    private function seedDealStages(Workspace $workspace): array
    {
        $stages = [
            ['name' => 'مكالمة أولية', 'color' => '#3498db', 'order' => 1, 'object_type' => 'deal'],
            ['name' => 'عرض سعر',      'color' => '#f1c40f', 'order' => 2, 'object_type' => 'deal'],
            ['name' => 'تفاوض',        'color' => '#e67e22', 'order' => 3, 'object_type' => 'deal'],
            ['name' => 'مغلقة (مكسب)',  'color' => '#2ecc71', 'order' => 4, 'object_type' => 'deal'],
            ['name' => 'مغلقة (خسارة)', 'color' => '#e74c3c', 'order' => 5, 'object_type' => 'deal'],
        ];

        $ids = [];
        foreach ($stages as $data) {
            $data['workspace_id'] = $workspace->id;
            $ids[] = Stage::create($data)->id;
        }
        return $ids;
    }

    private function seedSystemStages(Workspace $workspace): void
    {
        app(ContactStageService::class)->ensureStagesExist($workspace->id);
        app(CompanyStageService::class)->ensureStagesExist($workspace->id);
    }

    private function seedCompanies(Workspace $workspace, array $users, User $admin, array $companyStages): array
    {
        $names = [
            'شركة التقنية المتطورة', 'مجموعة الأفق الذهبي', 'شركة الابتكار الرقمي',
            'مؤسسة النهضة', 'شركة القمة للبرمجيات', 'مجموعة الخليج التجارية',
            'شركة الاتصالات المتكاملة', 'مؤسسة الفجر الجديد', 'شركة الصناعات الوطنية',
            'مجموعة الرياض المالية', 'شركة العصر للتجارة', 'مؤسسة البناء الحديث',
            'شركة النيل للتسويق', 'مجموعة الجزيرة للإعلام', 'شركة التاج الذهبي',
            'مؤسسة الريادة للاستشارات', 'شركة المستقبل للطاقة', 'مجموعة السلام الدولية',
            'شركة الواحة الزراعية', 'مؤسسة الإبداع الفني',
        ];
        $industries = ['تكنولوجيا', 'تجارة', 'صناعة', 'خدمات', 'مالية', 'طاقة', 'زراعة', 'إعلام', 'عقارات', 'استشارات'];
        $companies = [];

        foreach ($names as $name) {
            $id = count($companies) + 1;
            $companies[] = Company::create([
                'workspace_id' => $workspace->id,
                'name'         => $name,
                'email'        => "info@company{$id}.com",
                'phone'        => '05' . sprintf('%08d', $id * 10000000 + rand(0, 9999999)),
                'website'      => "https://www.company{$id}.com",
                'industry'     => $industries[array_rand($industries)],
                'assigned_to'  => $users[array_rand($users)]->id,
                'stage_id'     => $companyStages[array_rand($companyStages)] ?? null,
                'created_by'   => $admin->id,
            ]);
        }
        return $companies;
    }

    private function seedContacts(Workspace $workspace, array $companies, array $users, User $admin, array $contactStages): array
    {
        $firstNames = ['أحمد','محمد','علي','خالد','عمر','يوسف','حسن','محمود','عبدالله','نور',
                       'سارة','مريم','فاطمة','نورة','هند','ليلى','منى','حنان','داليا','شيماء'];
        $lastNames  = ['السيد','عبدالله','محمود','علي','خالد','حسن','يوسف','أحمد','محمد','عمر',
                       'هاشم','ناصر','قاسم','إبراهيم','جمال','كمال','بدر','شاكر','نبيل','كريم'];
        $prefixes   = ['010','011','012','015'];
        $contacts   = [];

        for ($i = 0; $i < 120; $i++) {
            $contacts[] = Contact::create([
                'workspace_id' => $workspace->id,
                'company_id'   => $companies[array_rand($companies)]->id,
                'stage_id'     => $contactStages[array_rand($contactStages)] ?? null,
                'assigned_to'  => $users[array_rand($users)]->id,
                'created_by'   => $admin->id,
                'first_name'   => $firstNames[array_rand($firstNames)],
                'last_name'    => $lastNames[array_rand($lastNames)],
                'email'        => "contact" . ($i + 1) . "@demo.com",
                'phone'        => $prefixes[array_rand($prefixes)] . sprintf('%08d', rand(0, 99999999)),
            ]);
        }
        return $contacts;
    }

    private function seedProducts(Workspace $workspace): array
    {
        $data = [
            ['name' => 'اشتراك شهري أساسي',    'sku' => 'SUB-BASIC',      'price' => 99],
            ['name' => 'اشتراك شهري متقدم',    'sku' => 'SUB-PRO',        'price' => 199],
            ['name' => 'اشتراك سنوي أساسي',    'sku' => 'SUB-YEAR-BASIC', 'price' => 999],
            ['name' => 'اشتراك سنوي متقدم',    'sku' => 'SUB-YEAR-PRO',   'price' => 1999],
            ['name' => 'حزمة البدء السريع',     'sku' => 'PKG-QUICKSTART', 'price' => 499],
            ['name' => 'خدمة استشارية',         'sku' => 'SVC-CONSULT',    'price' => 149],
            ['name' => 'تدريب فريق',           'sku' => 'SVC-TRAINING',   'price' => 2499],
            ['name' => 'دعم فني ممتاز',        'sku' => 'SVC-PREMIUM-SUP','price' => 349],
            ['name' => 'تصميم واجهات',         'sku' => 'SVC-UI-DESIGN',  'price' => 1499],
            ['name' => 'تطوير تطبيقات',        'sku' => 'SVC-APP-DEV',    'price' => 4999],
            ['name' => 'استضافة مواقع',         'sku' => 'HST-WEB',        'price' => 29],
            ['name' => 'خدمة سحابية',           'sku' => 'SVC-CLOUD',      'price' => 199],
            ['name' => 'أمان إلكتروني',         'sku' => 'SVC-SECURITY',   'price' => 799],
            ['name' => 'تحليل بيانات',          'sku' => 'SVC-ANALYTICS',  'price' => 1299],
            ['name' => 'تسويق إلكتروني',       'sku' => 'SVC-DIGITAL-MKT','price' => 599],
            ['name' => 'تحسين محركات بحث',      'sku' => 'SVC-SEO',        'price' => 449],
            ['name' => 'إدارة حسابات التواصل',   'sku' => 'SVC-SOCIAL-MEDIA','price' => 899],
            ['name' => 'استضافة خاصة',          'sku' => 'HST-DEDICATED',  'price' => 149],
            ['name' => 'نسخ احتياطي',           'sku' => 'SVC-BACKUP',     'price' => 79],
            ['name' => 'خدمة برمجة مخصصة',      'sku' => 'SVC-CUSTOM-DEV', 'price' => 7999],
            ['name' => 'باقة الثلاثة أشهر',     'sku' => 'PKG-3MONTH',     'price' => 499],
            ['name' => 'باقة الستة أشهر',       'sku' => 'PKG-6MONTH',     'price' => 899],
            ['name' => 'ترقية النظام',          'sku' => 'SVC-UPGRADE',    'price' => 299],
            ['name' => 'ربط API',               'sku' => 'SVC-API-INTEGRATION','price' => 999],
            ['name' => 'خدمة عملاء VIP',        'sku' => 'SVC-VIP-SUPPORT','price' => 1499],
        ];

        $products = [];
        foreach ($data as $pd) {
            $products[] = Product::create([
                'workspace_id' => $workspace->id,
                'name'         => $pd['name'],
                'sku'          => $pd['sku'],
                'unit_price'   => $pd['price'],
                'status'       => 'Active',
            ]);
        }
        return $products;
    }

    private function seedDeals(Workspace $workspace, array $contacts, array $companies, array $users, array $dealStageIds, array $pipelineStageIds): array
    {
        $titles = [
            'تطوير نظام إدارة','تصميم موقع إلكتروني','حزمة استضافة سنوية',
            'خدمات استشارية تقنية','تدريب الموظفين','تطبيق جوال',
            'نظام محاسبة سحابي','أرشفة إلكترونية','بوابة إلكترونية',
            'خدمة أمن سيبراني','منصة تعليم عن بعد','نظام موارد بشرية',
            'برنامج ولاء العملاء','تحليل بيانات مبيعات','خدمة دعم فني',
            'استضافة تطبيقات سحابية','تسويق إلكتروني متكامل','حزمة برمجة مخصصة',
            'نظام إدارة علاقات عملاء','خدمة تحسين محركات بحث','تطوير متجر إلكتروني',
            'حلول ذكاء اصطناعي','نظام إدارة مخزون','خدمة نسخ احتياطي',
            'بنية تحتية تقنية','بوابة دفع إلكتروني','نظام تذاكر دعم',
            'منصة تواصل داخلي','أتمتة تسويقية','حلول إنترنت الأشياء',
            'نظام إدارة مشاريع','خدمة روبوت محادثة','تحليل بيانات ضخمة',
            'نظام حضور وانصراف','بوابة موظفين','حلول طاقة رقمية',
            'تطوير واجهات برمجة','اختبارات جودة','خدمة استضافة ألعاب',
            'نظام إدارة محتوى',
        ];

        $statuses = ['open','won','lost'];
        $deals = [];

        for ($i = 0; $i < 60; $i++) {
            $deals[] = Deal::create([
                'workspace_id'       => $workspace->id,
                'contact_id'         => $contacts[array_rand($contacts)]->id,
                'company_id'         => $companies[array_rand($companies)]->id,
                'stage_id'           => $dealStageIds[array_rand($dealStageIds)] ?? null,
                'pipeline_stage_id'  => $pipelineStageIds[array_rand($pipelineStageIds)] ?? null,
                'assigned_to'        => $users[array_rand($users)]->id,
                'title'              => $titles[$i % count($titles)],
                'amount'             => rand(1000, 100000),
                'status'             => $statuses[array_rand($statuses)],
                'expected_close_date'=> now()->addDays(rand(1, 90)),
            ]);
        }
        return $deals;
    }

    private function seedTickets(Workspace $workspace, array $contacts, array $users): void
    {
        $subjects = [
            'مشكلة في تسجيل الدخول','استفسار عن فاتورة','طلب ترقية حساب',
            'بلاغ عن خطأ في النظام','استفسار عن الخدمات','طلب دعم فني عاجل',
            'مشكلة في الدفع الإلكتروني','استفسار عن سياسة الاسترجاع','طلب إضافة مستخدمين',
            'استفسار عن توفر الخدمة','شكوى من بطء الخدمة','طلب تقرير مخصص',
            'استفسار عن التحديثات الجديدة','طلب تدريب إضافي','مشكلة في التكامل مع API',
            'استفسار عن الأسعار','طلب إلغاء اشتراك','مشكلة في البريد الإلكتروني',
            'استفسار عن الضمان','طلب نسخة احتياطية','استفسار عن الخطة المناسبة',
            'طلب دعم فوري','مشكلة في استقبال الإشعارات','استفسار عن الشروط والأحكام',
            'طلب تحديث بيانات','مشكلة في التحقق بخطوتين','استفسار عن مدة التوصيل',
            'طلب حذف حساب','مشكلة في المزامنة','استفسار عن الخدمات الجديدة',
        ];
        $statuses  = ['open','pending','resolved','closed'];
        $priorities = ['low','medium','high','urgent'];

        foreach ($subjects as $subject) {
            Ticket::create([
                'workspace_id' => $workspace->id,
                'contact_id'   => $contacts[array_rand($contacts)]->id,
                'assigned_to'  => $users[array_rand($users)]->id,
                'subject'      => $subject,
                'description'  => fake()->paragraph(),
                'status'       => $statuses[array_rand($statuses)],
                'priority'     => $priorities[array_rand($priorities)],
            ]);
        }
    }

    private function seedOrders(Workspace $workspace, array $contacts, array $companies, array $users, array $products): void
    {
        $statuses = ['open','paid','refunded'];

        for ($i = 0; $i < 15; $i++) {
            $contact = $contacts[array_rand($contacts)];
            $company = $companies[array_rand($companies)];
            $owner   = $users[array_rand($users)];
            $status  = $statuses[array_rand($statuses)];

            $numItems     = rand(1, 5);
            $selectedKeys = array_rand($products, min($numItems, count($products)));
            if (!is_array($selectedKeys)) $selectedKeys = [$selectedKeys];

            $subtotal  = 0;
            $lineItems = [];

            foreach ($selectedKeys as $key) {
                $product = $products[$key];
                $qty     = rand(1, 10);
                $lineTotal = $qty * $product->unit_price;
                $subtotal += $lineTotal;
                $lineItems[] = [
                    'product_id'    => $product->id,
                    'name'          => $product->name,
                    'quantity'      => $qty,
                    'unit_price'    => $product->unit_price,
                    'total'         => $lineTotal,
                    'display_order' => count($lineItems) + 1,
                ];
            }

            $discount = (rand(0,1) && $subtotal > 500) ? rand(100, min(1000, (int)($subtotal * 0.2))) : 0;
            $tax      = round($subtotal * 0.15, 2);
            $shipping = $subtotal > 1000 ? 0 : 49.99;
            $total    = round($subtotal - $discount + $tax + $shipping, 2);

            $order = Order::create([
                'workspace_id'  => $workspace->id,
                'contact_id'    => $contact->id,
                'company_id'    => $company->id,
                'owner_id'      => $owner->id,
                'order_number'  => 'ORD-' . str_pad($i + 1, 6, '0', STR_PAD_LEFT),
                'title'         => 'طلب رقم ' . ($i + 1) . ' - ' . $company->name,
                'status'        => $status,
                'currency'      => 'SAR',
                'subtotal'      => $subtotal,
                'discount'      => $discount,
                'tax'           => $tax,
                'shipping'      => $shipping,
                'total'         => $total,
                'closed_at'     => in_array($status, ['paid','refunded']) ? now()->subDays(rand(1,30)) : null,
            ]);

            foreach ($lineItems as $li) {
                $order->lineItems()->create($li);
            }
        }
    }

    private function seedActivities(Workspace $workspace, array $users, array $deals, array $contacts, array $companies): void
    {
        $types    = ['call','meeting','email','task','note'];
        $subjects = ['مكالمة مع العميل','اجتماع مناقشة المتطلبات','إرسال عرض سعر',
                     'متابعة أسبوعية','مناقشة العقد','زيارة العميل','اتفاق مبدئي',
                     'مراجعة الأداء','إرسال فاتورة','تحديث بيانات المشروع'];

        $targets = [
            'App\Models\Deal'    => $deals,
            'App\Models\Contact' => $contacts,
            'App\Models\Company' => $companies,
        ];

        for ($i = 0; $i < 120; $i++) {
            $type   = array_rand($targets);
            $models = $targets[$type];

            Activity::create([
                'workspace_id'      => $workspace->id,
                'user_id'           => $users[array_rand($users)]->id,
                'type'              => $types[array_rand($types)],
                'subject'           => $subjects[array_rand($subjects)],
                'description'       => fake()->paragraph(),
                'activity_date'     => now()->subDays(rand(0, 60)),
                'activitable_type'  => $type,
                'activitable_id'    => $models[array_rand($models)]->id,
            ]);
        }
    }

    private function seedDocuments(Workspace $workspace, array $users, array $deals, array $contacts, array $companies): void
    {
        $docNames  = ['عرض سعر','عقد اتفاقية','تقرير فني','مستند متطلبات','فاتورة',
                      'مخطط المشروع','نسخة عقد','كتيب تعريفي','تقرير أداء','شهادة إنجاز'];
        $mimeTypes = ['application/pdf','application/msword','image/jpeg','image/png',
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

        $targets = [
            'App\Models\Deal'    => $deals,
            'App\Models\Contact' => $contacts,
            'App\Models\Company' => $companies,
        ];

        for ($i = 0; $i < 40; $i++) {
            $type   = array_rand($targets);
            $models = $targets[$type];

            Document::create([
                'workspace_id'       => $workspace->id,
                'name'               => $docNames[array_rand($docNames)] . '.pdf',
                'file_path'          => 'documents/' . (string) Str::uuid() . '.pdf',
                'mime_type'          => $mimeTypes[array_rand($mimeTypes)],
                'size'               => rand(1000, 5000000),
                'uploaded_by'        => $users[array_rand($users)]->id,
                'documentable_type'  => $type,
                'documentable_id'    => $models[array_rand($models)]->id,
            ]);
        }
    }

    private function seedNotes(Workspace $workspace, array $users, array $deals, array $contacts, array $companies): void
    {
        $contents = [
            'ملاحظات هامة حول هذا العنصر','تم مناقشة التفاصيل مع الفريق',
            'يحتاج إلى متابعة الأسبوع القادم','تم إرسال العرض للعميل بانتظار الرد',
            'اجتماع ناجح مع العميل','تحديث البيانات بعد الاجتماع',
            'تم الاتفاق على الشروط النهائية','بانتظار موافقة الإدارة',
        ];

        $targets = [
            'App\Models\Deal'    => $deals,
            'App\Models\Contact' => $contacts,
            'App\Models\Company' => $companies,
        ];

        for ($i = 0; $i < 20; $i++) {
            $type   = array_rand($targets);
            $models = $targets[$type];

            Note::create([
                'workspace_id'  => $workspace->id,
                'user_id'       => $users[array_rand($users)]->id,
                'content'       => $contents[array_rand($contents)],
                'notable_type'  => $type,
                'notable_id'    => $models[array_rand($models)]->id,
            ]);
        }
    }

    private function seedTasks(Workspace $workspace, array $users, User $admin, array $deals, array $contacts, array $companies): void
    {
        $titles   = ['متابعة العميل','إرسال عرض سعر','تحديث البيانات','جدولة اجتماع',
                     'مراجعة العقد','إعداد تقرير','اتصال بالعميل','معاينة الموقع',
                     'تقديم الدعم','مراجعة الطلب'];
        $statuses = ['pending','in_progress','completed'];

        $targets = [
            'App\Models\Deal'    => $deals,
            'App\Models\Contact' => $contacts,
            'App\Models\Company' => $companies,
        ];

        for ($i = 0; $i < 60; $i++) {
            $type   = array_rand($targets);
            $models = $targets[$type];

            Task::create([
                'workspace_id'   => $workspace->id,
                'assigned_to'    => $users[array_rand($users)]->id,
                'created_by'     => $admin->id,
                'title'          => $titles[array_rand($titles)] . ' - ' . ($i + 1),
                'due_date'       => now()->addDays(rand(1, 30)),
                'status'         => $statuses[array_rand($statuses)],
                'taskable_type'  => $type,
                'taskable_id'    => $models[array_rand($models)]->id,
            ]);
        }
    }

    private function seedActivityComments(Workspace $workspace, array $users): void
    {
        $activities   = Activity::where('workspace_id', $workspace->id)->get();
        $commentCount = min(10, $activities->count());
        if ($commentCount === 0) return;

        foreach ($activities->random($commentCount) as $activity) {
            ActivityComment::create([
                'workspace_id' => $workspace->id,
                'activity_id'  => $activity->id,
                'user_id'      => $users[array_rand($users)]->id,
                'content'      => 'تمت المتابعة والموافقة على الإجراء',
            ]);
        }
    }
}
