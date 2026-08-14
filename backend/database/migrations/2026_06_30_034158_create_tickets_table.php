<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            
            // العلاقات
            $table->foreignUuid('contact_id')->nullable()->constrained('contacts')->nullOnDelete(); // العميل صاحب المشكلة
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete(); // الموظف المسؤول
            
            // تفاصيل التذكرة
            $table->string('subject');
            $table->text('description')->nullable();
            
            // الحالة والأولوية
            $table->enum('status', ['open', 'pending', 'resolved', 'closed'])->default('open');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};