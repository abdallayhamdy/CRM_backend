<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('language')->nullable()->default('en')->after('role');
            $table->string('date_format')->nullable()->default('us')->after('language');
            $table->string('phone_country')->nullable()->default('us')->after('date_format');
            $table->string('phone_number')->nullable()->after('phone_country');
            $table->string('default_landing_page')->nullable()->default('dashboard')->after('phone_number');
            $table->string('work_start_day')->nullable()->default('Monday')->after('default_landing_page');
            $table->string('work_end_day')->nullable()->default('Friday')->after('work_start_day');
            $table->string('work_start_time')->nullable()->default('09:00')->after('work_end_day');
            $table->string('work_end_time')->nullable()->default('17:00')->after('work_start_time');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'language',
                'date_format',
                'phone_country',
                'phone_number',
                'default_landing_page',
                'work_start_day',
                'work_end_day',
                'work_start_time',
                'work_end_time',
            ]);
        });
    }
};
