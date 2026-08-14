<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_line_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            
            // بنربط المنتج، وبنخليه nullable عشان لو المنتج اتمسح من الكتالوج الفاتورة القديمة متضربش
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            
            // بنحفظ اسم المنتج والسعر وقت البيع (عشان لو السعر اتغير بعدين في الكتالوج)
            $table->string('name');
            $table->text('description')->nullable();
            
            // الحسابات
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            
            $table->integer('display_order')->default(0); // ترتيب ظهورهم في الفاتورة
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_line_items');
    }
};