<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('category')->nullable()->after('action');
            $table->string('subcategory')->nullable()->after('category');
            $table->string('assisted_by')->nullable()->after('user_id');
            $table->string('source')->nullable()->after('assisted_by');
            $table->string('source_url')->nullable()->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['category', 'subcategory', 'assisted_by', 'source', 'source_url']);
        });
    }
};
