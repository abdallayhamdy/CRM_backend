<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('currency')->nullable()->default('USD')->after('max_users');
            $table->string('currency_symbol')->nullable()->default('$')->after('currency');
            $table->string('default_language')->nullable()->default('en')->after('currency_symbol');
            $table->string('default_date_format')->nullable()->default('us')->after('default_language');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'currency',
                'currency_symbol',
                'default_language',
                'default_date_format',
            ]);
        });
    }
};
