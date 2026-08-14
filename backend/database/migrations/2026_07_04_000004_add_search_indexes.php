<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->index('email');
            $table->index(['first_name', 'last_name']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->index('name');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->index('title');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('name');
            $table->index('sku');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['first_name', 'last_name']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['title']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['sku']);
        });
    }
};
