<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary(); // استخدام UUID ليتطابق مع الفرونت إند
            $table->foreignUuid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            
            $table->string('name');
            $table->string('sku')->nullable();
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->enum('status', ['Active', 'Archived'])->default('Active');
            $table->string('product_folder')->nullable(); // لو الفرونت بيقسمهم في فولدرات
            
            $table->unique(['workspace_id', 'sku']);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};