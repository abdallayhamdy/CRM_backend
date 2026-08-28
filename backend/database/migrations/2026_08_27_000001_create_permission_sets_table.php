<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_sets', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('locked')->default(false);

            $table->timestamps();

            // منع تكرار نفس اسم مجموعة الصلاحيات داخل نفس مساحة العمل
            // (المفتاح الفريد المركب يغطي أيضاً عمليات البحث عن workspace_id)
            $table->unique(['workspace_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_sets');
    }
};