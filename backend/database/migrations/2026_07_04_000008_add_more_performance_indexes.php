<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->index('type');
            $table->index('activity_date');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index('status');
            $table->index('due_date');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('status');
            $table->index('closed_at');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->index('priority');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('action');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->index('expected_close_date');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropIndex(['activity_date']);
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['due_date']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['closed_at']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['priority']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['action']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['expected_close_date']);
        });
    }
};
