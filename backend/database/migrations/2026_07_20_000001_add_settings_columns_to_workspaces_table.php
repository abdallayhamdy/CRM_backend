<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('timezone')->nullable()->after('name');
            $table->string('fiscal_year_start')->nullable()->after('timezone');
            $table->string('industry')->nullable()->after('fiscal_year_start');
            $table->string('company_name')->nullable()->after('industry');
            $table->string('company_domain')->nullable()->after('company_name');
            $table->string('company_address')->nullable()->after('company_domain');
            $table->string('company_city')->nullable()->after('company_address');
            $table->string('company_state')->nullable()->after('company_city');
            $table->string('company_zip')->nullable()->after('company_state');
            $table->string('company_country')->nullable()->after('company_zip');
            $table->string('logo_path')->nullable()->after('company_country');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'timezone',
                'fiscal_year_start',
                'industry',
                'company_name',
                'company_domain',
                'company_address',
                'company_city',
                'company_state',
                'company_zip',
                'company_country',
                'logo_path',
            ]);
        });
    }
};
