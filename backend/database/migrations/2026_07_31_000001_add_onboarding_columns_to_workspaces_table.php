<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('name');
            $table->string('billing_email')->nullable()->after('logo_path');
            $table->string('billing_phone')->nullable()->after('billing_email');
            $table->string('billing_address')->nullable()->after('billing_phone');
            $table->string('billing_city')->nullable()->after('billing_address');
            $table->string('billing_state')->nullable()->after('billing_city');
            $table->string('billing_zip')->nullable()->after('billing_state');
            $table->string('billing_country')->nullable()->after('billing_zip');
            $table->string('tax_id')->nullable()->after('billing_country');
            $table->string('billing_cycle')->default('monthly')->after('tax_id');
            $table->date('subscription_start_date')->nullable()->after('billing_cycle');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'billing_email',
                'billing_phone',
                'billing_address',
                'billing_city',
                'billing_state',
                'billing_zip',
                'billing_country',
                'tax_id',
                'billing_cycle',
                'subscription_start_date',
            ]);
        });
    }
};
