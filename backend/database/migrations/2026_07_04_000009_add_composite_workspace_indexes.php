<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Contacts - primary listing + permission filter
        Schema::table('contacts', function (Blueprint $table) {
            $table->index(['workspace_id', 'deleted_at', 'created_at'], 'idx_contacts_ws_del_crt');
            $table->index(['workspace_id', 'assigned_to', 'deleted_at'], 'idx_contacts_ws_asgn_del');
        });

        // Deals - primary listing + status filter + kanban + date sort
        Schema::table('deals', function (Blueprint $table) {
            $table->index(['workspace_id', 'deleted_at', 'created_at'], 'idx_deals_ws_del_crt');
            $table->index(['workspace_id', 'status', 'deleted_at'], 'idx_deals_ws_st_del');
            $table->index(['workspace_id', 'pipeline_stage_id'], 'idx_deals_ws_pl_stage');
            $table->index(['workspace_id', 'deleted_at', 'expected_close_date'], 'idx_deals_ws_del_ecd');
        });

        // Companies - primary listing + search
        Schema::table('companies', function (Blueprint $table) {
            $table->index(['workspace_id', 'deleted_at', 'created_at'], 'idx_companies_ws_del_crt');
            $table->index(['workspace_id', 'name'], 'idx_companies_ws_name');
        });

        // Tasks - polymorphic + status + assignee + due_date
        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['workspace_id', 'taskable_type', 'taskable_id'], 'idx_tasks_ws_tkbl');
            $table->index(['workspace_id', 'status'], 'idx_tasks_ws_status');
            $table->index(['workspace_id', 'assigned_to'], 'idx_tasks_ws_asgn');
            $table->index(['workspace_id', 'due_date'], 'idx_tasks_ws_due');
        });

        // Notes - polymorphic + created_at sort
        Schema::table('notes', function (Blueprint $table) {
            $table->index(['workspace_id', 'notable_type', 'notable_id'], 'idx_notes_ws_ntbl');
            $table->index(['workspace_id', 'created_at'], 'idx_notes_ws_crt');
        });

        // Activities - permission filter + polymorphic
        Schema::table('activities', function (Blueprint $table) {
            $table->index(['workspace_id', 'user_id', 'created_at'], 'idx_activities_ws_usr_crt');
            $table->index(['workspace_id', 'activitable_type', 'activitable_id'], 'idx_activities_ws_actbl');
        });

        // Activity Comments - workspace scoped to parent activity
        Schema::table('activity_comments', function (Blueprint $table) {
            $table->index(['workspace_id', 'activity_id', 'created_at'], 'idx_act_cmts_ws_act_crt');
        });

        // Pipelines - find default
        Schema::table('pipelines', function (Blueprint $table) {
            $table->index(['workspace_id', 'is_default'], 'idx_pipelines_ws_def');
        });

        // Pipeline Stages - relationship ordering
        Schema::table('pipeline_stages', function (Blueprint $table) {
            $table->index(['pipeline_id', 'display_order'], 'idx_pl_stages_pl_ord');
        });

        // Stages - filter by object type + display order
        Schema::table('stages', function (Blueprint $table) {
            $table->index(['workspace_id', 'object_type', 'order'], 'idx_stages_ws_obj_ord');
        });

        // Orders - status filter + listing
        Schema::table('orders', function (Blueprint $table) {
            $table->index(['workspace_id', 'status', 'created_at'], 'idx_orders_ws_st_crt');
        });

        // Order Line Items - relationship ordering
        Schema::table('order_line_items', function (Blueprint $table) {
            $table->index(['order_id', 'display_order'], 'idx_oli_ord_disp');
        });

        // Products - status filter + search
        Schema::table('products', function (Blueprint $table) {
            $table->index(['workspace_id', 'status'], 'idx_products_ws_st');
        });

        // Tickets - status filter + assignee
        Schema::table('tickets', function (Blueprint $table) {
            $table->index(['workspace_id', 'status', 'created_at'], 'idx_tickets_ws_st_crt');
            $table->index(['workspace_id', 'assigned_to'], 'idx_tickets_ws_asgn');
        });

        // Documents - polymorphic
        Schema::table('documents', function (Blueprint $table) {
            $table->index(['workspace_id', 'documentable_type', 'documentable_id'], 'idx_docs_ws_docbl');
        });

        // Contact Imports - user + status
        Schema::table('contact_imports', function (Blueprint $table) {
            $table->index(['workspace_id', 'user_id'], 'idx_ci_ws_usr');
            $table->index(['workspace_id', 'status'], 'idx_ci_ws_st');
        });

        // Audit Logs - polymorphic + chronological
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['workspace_id', 'auditable_type', 'auditable_id'], 'idx_al_ws_audbl');
            $table->index(['workspace_id', 'created_at'], 'idx_al_ws_crt');
        });

        // Workspace User pivot - member listing with role filter
        Schema::table('workspace_user', function (Blueprint $table) {
            $table->index(['workspace_id', 'is_active', 'role_name'], 'idx_wsu_ws_act_role');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex('idx_contacts_ws_del_crt');
            $table->dropIndex('idx_contacts_ws_asgn_del');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex('idx_deals_ws_del_crt');
            $table->dropIndex('idx_deals_ws_st_del');
            $table->dropIndex('idx_deals_ws_pl_stage');
            $table->dropIndex('idx_deals_ws_del_ecd');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex('idx_companies_ws_del_crt');
            $table->dropIndex('idx_companies_ws_name');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('idx_tasks_ws_tkbl');
            $table->dropIndex('idx_tasks_ws_status');
            $table->dropIndex('idx_tasks_ws_asgn');
            $table->dropIndex('idx_tasks_ws_due');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('idx_notes_ws_ntbl');
            $table->dropIndex('idx_notes_ws_crt');
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex('idx_activities_ws_usr_crt');
            $table->dropIndex('idx_activities_ws_actbl');
        });

        Schema::table('activity_comments', function (Blueprint $table) {
            $table->dropIndex('idx_act_cmts_ws_act_crt');
        });

        Schema::table('pipelines', function (Blueprint $table) {
            $table->dropIndex('idx_pipelines_ws_def');
        });

        Schema::table('pipeline_stages', function (Blueprint $table) {
            $table->dropIndex('idx_pl_stages_pl_ord');
        });

        Schema::table('stages', function (Blueprint $table) {
            $table->dropIndex('idx_stages_ws_obj_ord');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_ws_st_crt');
        });

        Schema::table('order_line_items', function (Blueprint $table) {
            $table->dropIndex('idx_oli_ord_disp');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_ws_st');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('idx_tickets_ws_st_crt');
            $table->dropIndex('idx_tickets_ws_asgn');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex('idx_docs_ws_docbl');
        });

        Schema::table('contact_imports', function (Blueprint $table) {
            $table->dropIndex('idx_ci_ws_usr');
            $table->dropIndex('idx_ci_ws_st');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_al_ws_audbl');
            $table->dropIndex('idx_al_ws_crt');
        });

        Schema::table('workspace_user', function (Blueprint $table) {
            $table->dropIndex('idx_wsu_ws_act_role');
        });
    }
};
