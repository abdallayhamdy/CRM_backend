<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->boolean('two_factor_required')->default(false)->after('default_plan');
            $table->boolean('ip_whitelist_enabled')->default(false)->after('two_factor_required');
            $table->json('whitelisted_ips')->nullable()->after('ip_whitelist_enabled');
            $table->unsignedSmallInteger('session_timeout_minutes')->default(30)->after('whitelisted_ips');
        });
    }

    public function down(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_required',
                'ip_whitelist_enabled',
                'whitelisted_ips',
                'session_timeout_minutes',
            ]);
        });
    }
};
