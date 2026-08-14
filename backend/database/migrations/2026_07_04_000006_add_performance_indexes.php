<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspace_user', function (Blueprint $table) {
            $table->index('is_active');
            $table->index('role_name');
        });

        Schema::table('pipelines', function (Blueprint $table) {
            $table->index('is_default');
        });

        Schema::table('pipeline_stages', function (Blueprint $table) {
            $table->index('display_order');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('workspace_user', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['role_name']);
        });

        Schema::table('pipelines', function (Blueprint $table) {
            $table->dropIndex(['is_default']);
        });

        Schema::table('pipeline_stages', function (Blueprint $table) {
            $table->dropIndex(['display_order']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
    }
};
