<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('subject');
            $table->text('body');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('email_templates')->insert([
            [
                'id' => (string) Str::uuid(),
                'key' => 'welcome',
                'name' => 'Welcome Email',
                'subject' => 'Welcome to {{companyName}}, {{userName}}!',
                'body' => "Hi {{userName}},\n\nWelcome to {{companyName}}! We're excited to have you on board.\n\nYour account is now active and you can start exploring the platform. If you have any questions, don't hesitate to reach out to our support team.\n\nBest regards,\nThe {{companyName}} Team",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'key' => 'invoice_receipt',
                'name' => 'Invoice Receipt',
                'subject' => 'Payment received — Invoice #{{invoiceId}}',
                'body' => "Hi {{userName}},\n\nWe've received your payment of {{amount}} for Invoice #{{invoiceId}}.\n\nThank you for your business! Your next billing date is {{nextBillingDate}}.\n\nBest regards,\nThe {{companyName}} Team",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'key' => 'password_reset',
                'name' => 'Password Reset',
                'subject' => 'Reset your {{companyName}} password',
                'body' => "Hi {{userName}},\n\nWe received a request to reset your password. Click the link below to set a new one:\n\n{{resetLink}}\n\nIf you didn't request this, you can safely ignore this email. The link expires in 24 hours.\n\nBest regards,\nThe {{companyName}} Team",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'key' => 'trial_ending',
                'name' => 'Trial Ending Reminder',
                'subject' => 'Your {{companyName}} trial ends in {{daysLeft}} days',
                'body' => "Hi {{userName}},\n\nYour {{companyName}} trial is ending in {{daysLeft}} days. To keep using the platform, please choose a plan that fits your needs.\n\nYou can view pricing and upgrade at any time from your dashboard.\n\nBest regards,\nThe {{companyName}} Team",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => (string) Str::uuid(),
                'key' => 'account_suspended',
                'name' => 'Account Suspended',
                'subject' => 'Your {{companyName}} account has been suspended',
                'body' => "Hi {{userName}},\n\nYour {{companyName}} account has been suspended due to {{reason}}.\n\nIf you believe this is an error, please contact our support team at {{supportEmail}}.\n\nBest regards,\nThe {{companyName}} Team",
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
