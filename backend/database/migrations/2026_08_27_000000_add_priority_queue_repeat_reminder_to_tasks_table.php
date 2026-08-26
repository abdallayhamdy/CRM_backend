<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('task_priority', 20)->nullable()->after('status');
            $table->string('task_queue', 50)->nullable()->after('task_priority');
            $table->boolean('set_repeat')->default(false)->after('task_queue');
            $table->string('reminder', 30)->nullable()->after('set_repeat');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['task_priority', 'task_queue', 'set_repeat', 'reminder']);
        });
    }
};
