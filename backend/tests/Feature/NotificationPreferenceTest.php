<?php

namespace Tests\Feature;

use App\Models\NotificationPreference;
use Tests\TestCase;
use Tests\Traits\TestHelpers;

class NotificationPreferenceTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    public function test_unauthenticated_user_cannot_get_preferences(): void
    {
        $response = $this->getJson('/api/settings/notifications');

        $response->assertStatus(401);
    }

    public function test_unauthenticated_user_cannot_update_preferences(): void
    {
        $response = $this->putJson('/api/settings/notifications', [
            'new_leads' => false,
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_get_notification_preferences(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/settings/notifications');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'topic_preferences',
                'channels',
                'new_leads',
                'task_reminders',
                'weekly_digest',
                'browser_alerts',
            ],
        ]);
    }

    public function test_get_creates_record_if_not_exists(): void
    {
        $this->authenticateAsAdmin();

        $this->assertDatabaseEmpty('notification_preferences');

        $response = $this->getJson('/api/settings/notifications');

        $response->assertStatus(200);
        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $this->adminUser->id,
            'new_leads' => true,
            'task_reminders' => true,
            'weekly_digest' => false,
            'browser_alerts' => true,
        ]);
    }

    public function test_user_can_update_email_notification_settings(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/settings/notifications', [
            'new_leads' => false,
            'task_reminders' => false,
            'weekly_digest' => true,
            'browser_alerts' => false,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'new_leads' => false,
            'task_reminders' => false,
            'weekly_digest' => true,
            'browser_alerts' => false,
        ]);

        $this->assertDatabaseHas('notification_preferences', [
            'user_id' => $this->adminUser->id,
            'new_leads' => false,
            'task_reminders' => false,
            'weekly_digest' => true,
            'browser_alerts' => false,
        ]);
    }

    public function test_user_can_update_topic_preferences(): void
    {
        $this->authenticateAsAdmin();

        $topics = [
            [
                'name' => 'Deals',
                'channels' => ['popup' => true, 'browser' => false, 'bell' => true, 'email' => false],
                'subTopics' => [
                    [
                        'name' => 'Deal assigned to you',
                        'desc' => 'Get notified when a deal is assigned to you',
                        'channels' => ['popup' => false, 'browser' => false, 'bell' => true, 'email' => true],
                    ],
                ],
            ],
        ];

        $response = $this->putJson('/api/settings/notifications', [
            'topic_preferences' => $topics,
        ]);

        $response->assertStatus(200);

        $preference = NotificationPreference::where('user_id', $this->adminUser->id)->first();
        $this->assertNotNull($preference);
        $this->assertIsArray($preference->topic_preferences);
        $this->assertCount(1, $preference->topic_preferences);
        $this->assertEquals('Deals', $preference->topic_preferences[0]['name']);
    }

    public function test_user_can_update_all_preferences_at_once(): void
    {
        $this->authenticateAsAdmin();

        $topics = [
            [
                'name' => 'Comments',
                'channels' => ['popup' => true, 'browser' => true, 'bell' => true, 'email' => true],
                'subTopics' => [],
            ],
        ];

        $response = $this->putJson('/api/settings/notifications', [
            'topic_preferences' => $topics,
            'new_leads' => false,
            'task_reminders' => false,
            'weekly_digest' => true,
            'browser_alerts' => false,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'new_leads' => false,
            'task_reminders' => false,
            'weekly_digest' => true,
            'browser_alerts' => false,
        ]);

        $preference = NotificationPreference::where('user_id', $this->adminUser->id)->first();
        $this->assertNotNull($preference);
        $this->assertCount(1, $preference->topic_preferences);
        $this->assertEquals('Comments', $preference->topic_preferences[0]['name']);
        $this->assertFalse($preference->new_leads);
        $this->assertTrue($preference->weekly_digest);
    }

    public function test_notification_preferences_returns_defaults_for_new_user(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/settings/notifications');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'new_leads' => true,
            'task_reminders' => true,
            'weekly_digest' => false,
            'browser_alerts' => true,
        ]);
    }

    public function test_user_can_update_channel_preferences(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/settings/notifications', [
            'channels' => ['email' => false, 'bell' => true, 'browser' => false, 'popup' => false],
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'channels' => ['email' => false, 'bell' => true, 'browser' => false, 'popup' => false],
        ]);

        $preference = NotificationPreference::where('user_id', $this->adminUser->id)->first();
        $this->assertNotNull($preference);
        $this->assertEquals(
            ['email' => false, 'bell' => true, 'browser' => false, 'popup' => false],
            $preference->channels
        );
    }

    public function test_user_can_partially_update_preferences(): void
    {
        $this->authenticateAsAdmin();

        $this->putJson('/api/settings/notifications', [
            'new_leads' => false,
            'weekly_digest' => true,
        ]);

        $response = $this->putJson('/api/settings/notifications', [
            'browser_alerts' => false,
        ]);

        $response->assertStatus(200);

        $preference = NotificationPreference::where('user_id', $this->adminUser->id)->first();
        $this->assertFalse($preference->new_leads);
        $this->assertTrue($preference->task_reminders);
        $this->assertTrue($preference->weekly_digest);
        $this->assertFalse($preference->browser_alerts);
    }

    public function test_invalid_boolean_value_rejected(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/settings/notifications', [
            'new_leads' => 'not-a-boolean',
        ]);

        $response->assertStatus(422);
    }

    public function test_each_user_has_own_preferences(): void
    {
        $this->authenticateAsAdmin();

        $this->putJson('/api/settings/notifications', [
            'new_leads' => false,
            'weekly_digest' => true,
        ]);

        $this->authenticateAsStandardUser();

        $this->putJson('/api/settings/notifications', [
            'new_leads' => true,
            'weekly_digest' => false,
        ]);

        $adminPreference = NotificationPreference::where('user_id', $this->adminUser->id)->first();
        $standardPreference = NotificationPreference::where('user_id', $this->standardUser->id)->first();

        $this->assertFalse($adminPreference->new_leads);
        $this->assertTrue($adminPreference->weekly_digest);

        $this->assertTrue($standardPreference->new_leads);
        $this->assertFalse($standardPreference->weekly_digest);
    }
}
