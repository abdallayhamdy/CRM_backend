<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DealController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\PipelineController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\ResetPasswordController;
use App\Http\Controllers\Api\UserViewPreferenceController;
use App\Http\Controllers\Api\UserProfileController;
use App\Http\Controllers\Api\NotificationPreferenceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyGroupController;
use App\Http\Controllers\Api\BackupRestoreController;
use App\Http\Controllers\Api\ActivityCommentController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ContactImportController;
use App\Http\Controllers\Api\CompanyImportController;
use App\Http\Controllers\Api\DealImportController;
use App\Http\Controllers\Settings\WorkspaceSettingsController;
use App\Http\Controllers\Settings\ObjectConfigController;
use App\Http\Controllers\Settings\FormLayoutController;
use App\Http\Controllers\Api\PanelConfigController;
use App\Http\Controllers\Workspace\TeamController;
use App\Http\Controllers\SuperAdmin\WorkspaceController as SuperAdminWorkspaceController;
use App\Http\Controllers\SuperAdmin\PlatformSettingsController;
use App\Http\Controllers\SuperAdmin\PlatformOwnerController;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\SuperAdmin\UsageController;
use App\Http\Controllers\SuperAdmin\HealthController;
use App\Http\Controllers\SuperAdmin\BillingController;
use App\Http\Controllers\SuperAdmin\SecurityController;
use App\Http\Controllers\SuperAdmin\EmailTemplateController;
use App\Http\Controllers\SuperAdmin\ApiKeyController;
use App\Http\Controllers\SuperAdmin\WebhookController;
use App\Http\Controllers\SuperAdmin\SupportTicketController;
use App\Http\Controllers\SuperAdmin\BroadcastController;
use App\Http\Controllers\SuperAdmin\ImpersonationController;
use App\Http\Middleware\IsSuperAdmin;
use App\Http\Controllers\Workspace\InvitationController;
use App\Http\Controllers\Workspace\MemberController;
use App\Http\Controllers\Workspace\PermissionSetController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1')->name('login');

Route::post('/auth/2fa/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:5,1')->name('auth.2fa.verify');

Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:3,1')->name('password.email');
Route::post('/reset-password', ResetPasswordController::class)->name('password.reset');

Route::post('/invitations/accept', [InvitationController::class, 'accept'])->middleware('throttle:5,1');

Route::get('/bootstrap/status', [BootstrapController::class, 'status'])->middleware('throttle:10,1');
Route::post('/bootstrap', [BootstrapController::class, 'create'])->middleware('throttle:3,1');

Route::middleware(['auth:sanctum', 'set.workspace', 'check.impersonation.expiry'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'currentUser']);
    Route::get('/user/profile', [UserProfileController::class, 'show']);
    Route::put('/user/profile', [UserProfileController::class, 'update']);
    Route::post('/user/profile/avatar', [UserProfileController::class, 'uploadAvatar']);
    Route::delete('/user/profile/avatar', [UserProfileController::class, 'deleteAvatar']);
    Route::put('/user/password', [UserProfileController::class, 'changePassword']);
    Route::get('/user/sessions', [UserProfileController::class, 'sessions']);
    Route::post('/user/logout-all', [UserProfileController::class, 'logoutAll']);
    Route::get('/settings/notifications', [NotificationPreferenceController::class, 'show']);
    Route::put('/settings/notifications', [NotificationPreferenceController::class, 'update']);

    Route::get('/audit-log', [AuditLogController::class, 'index']);
    Route::post('/audit-log', [AuditLogController::class, 'store']);
    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('contacts', ContactController::class)->except(['edit', 'create']);
    Route::match(['patch', 'post'], 'deals/{deal}/move-stage', [DealController::class, 'moveStage']);
    Route::match(['patch', 'post'], 'deals/{deal}/associate-contact', [DealController::class, 'associateContact']);
    Route::get('/deals/search', [SearchController::class, 'deals']);
    Route::apiResource('deals', DealController::class);
    Route::apiResource('notes', NoteController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::get('/activities/{activity}', [ActivityController::class, 'show']);
    Route::patch('/activities/{activity}', [ActivityController::class, 'update']);
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);
    Route::get('/products/search', [ProductController::class, 'search']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('orders', OrderController::class);
    Route::post('/orders/{order}/line-items', [OrderController::class, 'addLineItems']);
    Route::put('/orders/{order}/line-items', [OrderController::class, 'replaceLineItems']);
    Route::apiResource('pipelines', PipelineController::class);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::apiResource('documents', DocumentController::class);
    Route::apiResource('tickets', TicketController::class);
    Route::apiResource('properties', PropertyController::class);
    Route::get('/properties/stats', [PropertyController::class, 'stats']);
    Route::get('/properties/{property}/rules', [PropertyController::class, 'getRules']);
    Route::patch('/properties/{property}/rules', [PropertyController::class, 'updateRules']);
    Route::get('/properties/{property}/access', [PropertyController::class, 'getAccess']);
    Route::patch('/properties/{property}/access', [PropertyController::class, 'updateAccess']);
    Route::post('/properties/{property}/access/assignments', [PropertyController::class, 'addAssignment']);
    Route::delete('/properties/{property}/access/assignments/{assignment}', [PropertyController::class, 'removeAssignment']);
    Route::patch('/properties/{property}/access/assignments/{assignment}', [PropertyController::class, 'updateAssignment']);
    Route::get('/property-groups', [PropertyGroupController::class, 'index']);
    Route::post('/property-groups', [PropertyGroupController::class, 'store']);
    Route::patch('/property-groups/rename', [PropertyGroupController::class, 'rename']);
    Route::post('/property-groups/merge', [PropertyGroupController::class, 'merge']);
    Route::delete('/property-groups/{group}', [PropertyGroupController::class, 'destroy']);
    Route::get('/settings/backups', [BackupRestoreController::class, 'indexBackups']);
    Route::post('/settings/backups', [BackupRestoreController::class, 'storeBackup']);
    Route::get('/settings/backup-schedule', [BackupRestoreController::class, 'showSchedule']);
    Route::patch('/settings/backup-schedule', [BackupRestoreController::class, 'updateSchedule']);
    Route::get('/settings/restore-history', [BackupRestoreController::class, 'indexRestoreHistory']);
    Route::post('/settings/restore-history', [BackupRestoreController::class, 'storeRestoreHistory']);
    Route::get('/roles', [InvitationController::class, 'indexRoles']);
    Route::get('/invitations', [InvitationController::class, 'index']);
    Route::post('/invitations', [InvitationController::class, 'store']);

    Route::get('/workspace/members', [MemberController::class, 'index']);
    Route::patch('/workspace/members/{member}/role', [MemberController::class, 'updateRole']);
    Route::post('/workspace/members/{member}/deactivate', [MemberController::class, 'deactivate']);
    Route::post('/workspace/members/{member}/activate', [MemberController::class, 'activate']);
    Route::post('/workspace/members/bulk-deactivate', [MemberController::class, 'bulkDeactivate']);
    Route::delete('/workspace/members/{member}', [MemberController::class, 'remove']);

    Route::get('/workspace/settings', [WorkspaceSettingsController::class, 'show']);
    Route::patch('/workspace/settings', [WorkspaceSettingsController::class, 'update']);
    Route::post('/workspace/settings/logo', [WorkspaceSettingsController::class, 'uploadLogo']);

    Route::get('/panel-configs/{type}', [PanelConfigController::class, 'show']);
    Route::put('/panel-configs/{type}', [PanelConfigController::class, 'update']);

    Route::get('/settings/object-configs', [ObjectConfigController::class, 'show']);
    Route::put('/settings/object-configs', [ObjectConfigController::class, 'update']);

    Route::get('/settings/form-layouts', [FormLayoutController::class, 'show']);
    Route::put('/settings/form-layouts', [FormLayoutController::class, 'update']);

    Route::apiResource('teams', TeamController::class);
    Route::get('/teams/{team}/members', [TeamController::class, 'members']);
    Route::post('/teams/{team}/members/{user}', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember']);

    Route::get('/workspaces/{workspace}/permission-sets', [PermissionSetController::class, 'index']);
    Route::post('/workspaces/{workspace}/permission-sets', [PermissionSetController::class, 'store']);
    Route::get('/workspaces/{workspace}/permission-sets/{permission_set}', [PermissionSetController::class, 'show']);
    Route::put('/workspaces/{workspace}/permission-sets/{permission_set}', [PermissionSetController::class, 'update']);
    Route::delete('/workspaces/{workspace}/permission-sets/{permission_set}', [PermissionSetController::class, 'destroy']);
    Route::post('/workspaces/{workspace}/permission-sets/{permission_set}/assign', [PermissionSetController::class, 'assign']);

    Route::apiResource('preferences', UserViewPreferenceController::class);

    Route::get('/activities/{activity}/comments', [ActivityCommentController::class, 'index']);
    Route::post('/activity-comments', [ActivityCommentController::class, 'store']);
    Route::get('/activity-comments/{activityComment}', [ActivityCommentController::class, 'show']);
    Route::put('/activity-comments/{activityComment}', [ActivityCommentController::class, 'update']);
    Route::delete('/activity-comments/{activityComment}', [ActivityCommentController::class, 'destroy']);

    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);

    Route::prefix('reports')->group(function () {
        Route::get('/executive', [ReportController::class, 'executive']);
        Route::get('/sales', [ReportController::class, 'sales']);
        Route::get('/customers', [ReportController::class, 'customers']);
        Route::get('/orders', [ReportController::class, 'orders']);
        Route::get('/tickets', [ReportController::class, 'tickets']);
        Route::get('/productivity', [ReportController::class, 'productivity']);
        Route::get('/activity/calls', [ReportController::class, 'calls']);
        Route::get('/filter-options', [ReportController::class, 'filterOptions']);
        Route::get('/export', [ReportController::class, 'export']);
    });

    Route::get('/search/contacts', [SearchController::class, 'contacts']);
    Route::get('/search/companies', [SearchController::class, 'companies']);
    Route::get('/search/deals', [SearchController::class, 'deals']);
    Route::get('/search/products', [SearchController::class, 'products']);
    Route::get('/search', [SearchController::class, 'search']);

    Route::post('/contacts/import', [ContactImportController::class, 'store']);
    Route::get('/contacts/import/{contactImport}', [ContactImportController::class, 'show']);

    Route::post('/companies/import', [CompanyImportController::class, 'store']);
    Route::get('/companies/import/{companyImport}', [CompanyImportController::class, 'show']);

    Route::post('/deals/import', [DealImportController::class, 'store']);
    Route::get('/deals/import/{dealImport}', [DealImportController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'check.impersonation.expiry', IsSuperAdmin::class])->prefix('super-admin')->group(function () {
    Route::get('/workspaces', [SuperAdminWorkspaceController::class, 'index']);
    Route::post('/workspaces', [SuperAdminWorkspaceController::class, 'store']);
    Route::delete('/workspaces/{workspace}', [SuperAdminWorkspaceController::class, 'destroy']);
    Route::get('/tenants', [SuperAdminWorkspaceController::class, 'tenantsIndex']);
    Route::post('/tenants', [SuperAdminWorkspaceController::class, 'tenantsStore']);
    Route::get('/tenants/{workspace}', [SuperAdminWorkspaceController::class, 'show']);
    Route::patch('/tenants/{workspace}', [SuperAdminWorkspaceController::class, 'update']);
    Route::delete('/tenants/{workspace}', [SuperAdminWorkspaceController::class, 'destroyTenant']);

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::patch('/users/{user}/workspaces/{workspace}', [UserController::class, 'updateWorkspaceStatus']);

    Route::get('/platform-owners', [PlatformOwnerController::class, 'index']);
    Route::post('/platform-owners', [PlatformOwnerController::class, 'store']);
    Route::post('/platform-owners/terminate-self', [PlatformOwnerController::class, 'terminateSelf']);
    Route::post('/platform-owners/{user}/deactivate', [PlatformOwnerController::class, 'deactivate']);

    Route::get('/usage/summary', [UsageController::class, 'summary']);
    Route::get('/usage/growth', [UsageController::class, 'growth']);
    Route::get('/usage/tenant-usage', [UsageController::class, 'tenantUsage']);
    Route::get('/usage/feature-adoption', [UsageController::class, 'featureAdoption']);

    Route::get('/health/summary', [HealthController::class, 'summary']);
    Route::get('/health/uptime', [HealthController::class, 'uptime']);
    Route::get('/health/response-times', [HealthController::class, 'responseTimes']);
    Route::get('/health/errors', [HealthController::class, 'errors']);
    Route::get('/health/queues', [HealthController::class, 'queues']);

    Route::get('/billing/summary', [BillingController::class, 'summary']);
    Route::get('/billing/invoices', [BillingController::class, 'index']);
    Route::post('/billing/invoices', [BillingController::class, 'store']);
    Route::patch('/billing/invoices/{invoice}/pay', [BillingController::class, 'markAsPaid']);
    Route::get('/billing/plan-distribution', [BillingController::class, 'planDistribution']);
    Route::get('/billing/revenue-trend', [BillingController::class, 'revenueTrend']);

    Route::get('/settings/general', [PlatformSettingsController::class, 'show']);
    Route::put('/settings/general', [PlatformSettingsController::class, 'update']);

    Route::get('/email-templates', [EmailTemplateController::class, 'index']);
    Route::get('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'show']);
    Route::put('/email-templates/{emailTemplate}', [EmailTemplateController::class, 'update']);

    Route::get('/api-keys', [ApiKeyController::class, 'index']);
    Route::post('/api-keys', [ApiKeyController::class, 'store']);
    Route::post('/api-keys/{apiKey}/revoke', [ApiKeyController::class, 'revoke']);

    Route::get('/webhooks', [WebhookController::class, 'index']);
    Route::post('/webhooks', [WebhookController::class, 'store']);
    Route::patch('/webhooks/{webhook}/toggle', [WebhookController::class, 'toggle']);
    Route::delete('/webhooks/{webhook}', [WebhookController::class, 'destroy']);

    Route::get('/support-tickets', [SupportTicketController::class, 'index']);
    Route::patch('/support-tickets/{ticket}/status', [SupportTicketController::class, 'updateStatus']);

    Route::get('/broadcasts', [BroadcastController::class, 'index']);
    Route::post('/broadcasts', [BroadcastController::class, 'store']);

    Route::get('/security/settings', [SecurityController::class, 'settings']);
    Route::patch('/security/settings', [SecurityController::class, 'updateSettings']);
    Route::get('/security/audit-log', [SecurityController::class, 'auditLog']);
    Route::get('/security/sessions', [SecurityController::class, 'sessions']);
    Route::delete('/security/sessions/{id}', [SecurityController::class, 'revokeSession']);

    Route::post('/impersonate', [ImpersonationController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'check.impersonation.expiry'])->prefix('super-admin')->group(function () {
    Route::post('/impersonate/stop', [ImpersonationController::class, 'stop']);
    Route::get('/impersonate/status', [ImpersonationController::class, 'status']);
});

