<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('activitable_type')->nullable()->change();
            $table->uuid('activitable_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('activitable_type')->nullable(false)->change();
            $table->uuid('activitable_id')->nullable(false)->change();
        });
    }
};
