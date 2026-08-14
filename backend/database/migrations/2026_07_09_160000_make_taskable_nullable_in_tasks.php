<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('taskable_type')->nullable()->change();
            $table->uuid('taskable_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('taskable_type')->nullable(false)->change();
            $table->uuid('taskable_id')->nullable(false)->change();
        });
    }
};
