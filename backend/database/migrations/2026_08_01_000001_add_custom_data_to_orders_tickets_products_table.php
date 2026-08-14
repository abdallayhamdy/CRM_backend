<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->json('custom_data')->nullable()->after('closed_at');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->json('custom_data')->nullable()->after('priority');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->json('custom_data')->nullable()->after('product_folder');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('custom_data');
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('custom_data');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('custom_data');
        });
    }
};
