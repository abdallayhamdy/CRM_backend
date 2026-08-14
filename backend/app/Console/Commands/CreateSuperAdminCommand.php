<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class CreateSuperAdminCommand extends Command
{
    protected $signature = 'crm:create-platform-owner
        {--name= : User name}
        {--email= : User email}
        {--password= : User password (prompted if missing)}';

    protected $description = 'Create a Platform Owner account. Use this for initial setup or account recovery. Idempotent -- safe to run multiple times.';

    public function handle(): int
    {
        $this->newLine();
        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║     Create Platform Owner Account           ║');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->newLine();

        $name  = $this->option('name')  ?: $this->ask('Name', 'Super Admin');
        $email = $this->option('email') ?: $this->ask('Email', 'admin@crm.com');

        $existingUser = User::withoutGlobalScopes()->where('email', $email)->first();

        // -- Path A: Already a Super Admin --

        if ($existingUser && $existingUser->is_super_admin) {
            $this->warn("User [{$email}] already exists and is a Platform Owner.");

            $resetPassword = $this->option('password')
                ? true
                : $this->confirm('Do you want to reset the password for this user?', false);

            if (!$resetPassword) {
                $this->info('No changes made.');
                return self::SUCCESS;
            }

            $password        = $this->option('password') ?: $this->secret('New password');
            $passwordConfirm = $this->option('password') ?: $this->secret('Confirm password');

            if ($password !== $passwordConfirm) {
                $this->error('Passwords do not match. Aborting.');
                return self::FAILURE;
            }

            $existingUser->update(['password' => $password]);
            $this->newLine();
            $this->printCredentials($existingUser->email, $password);
            return self::SUCCESS;
        }

        // -- Path B: Exists but NOT Super Admin -> upgrade --

        if ($existingUser && !$existingUser->is_super_admin) {
            $this->warn("User [{$email}] exists but is NOT a Platform Owner. Upgrading...");

            if (!$this->confirm('Upgrade this user to Platform Owner?', true)) {
                $this->info('Aborted.');
                return self::SUCCESS;
            }

            DB::beginTransaction();
            try {
                $existingUser->forceFill(['is_super_admin' => true])->save();
                $this->info("Upgraded [{$email}] to Platform Owner.");

                DB::commit();
                $this->newLine();
                $this->info("Email: {$email}");
                $this->info("Use existing password to login.");
                $this->comment("These credentials are for DEVELOPMENT only.");
                return self::SUCCESS;
            } catch (\Throwable $e) {
                DB::rollBack();
                $this->error("Error: {$e->getMessage()}");
                return self::FAILURE;
            }
        }

        // -- Path C: New user -> get password --

        $password = $this->option('password');
        if (!$password) {
            $password        = $this->secret('Password');
            $passwordConfirm = $this->secret('Confirm password');

            if ($password !== $passwordConfirm) {
                $this->error('Passwords do not match. Aborting.');
                return self::FAILURE;
            }
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'name'     => $name,
                'email'    => $email,
                'password' => $password,
            ]);
            $user->forceFill(['is_super_admin' => true])->save();
            $this->info("Created new user [{$email}] as Platform Owner.");

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->error("Error: {$e->getMessage()}");
            return self::FAILURE;
        }

        $this->newLine();
        $this->printCredentials($email, $password);

        return self::SUCCESS;
    }

    private function printCredentials(string $email, string $password): void
    {
        $this->info('╔══════════════════════════════════════════════╗');
        $this->info('║          ACCOUNT READY FOR LOGIN             ║');
        $this->info('╠══════════════════════════════════════════════╣');
        $this->info("║  Email:    {$email}");
        $this->info("║  Password: {$password}");
        $this->info('║  Role:     Platform Owner');
        $this->info('╚══════════════════════════════════════════════╝');
        $this->newLine();
        $this->comment('These credentials are for DEVELOPMENT only.');
        $this->comment('Do not commit them to version control.');
        $this->newLine();
    }
}
