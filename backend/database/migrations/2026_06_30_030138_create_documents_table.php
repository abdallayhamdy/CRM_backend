<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            
            // السطر ده سحري: بيكريت عمودين (documentable_type و documentable_id) 
            // عشان يربط الملف بأي حاجة (Deal, Contact, Company)
            $table->uuidMorphs('documentable'); 
            
            $table->string('name'); // اسم الملف الأصلي (مثال: contract.pdf)
            $table->string('file_path'); // مسار الملف في السيرفر
            $table->string('mime_type')->nullable(); // نوع الملف (صورة، pdf، الخ)
            $table->unsignedBigInteger('size')->default(0); // حجم الملف بالبايت
            
            $table->foreignUuid('uploaded_by')->nullable()->constrained('users')->nullOnDelete(); // مين اللي رفع الملف
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};