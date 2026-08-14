<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invitation $invitation,
        public string $inviterName,
        public string $acceptUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'You\'ve been invited to join ' . ($this->invitation->workspace->name ?? 'a workspace'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.invitation',
            with: [
                'inviterName' => $this->inviterName,
                'workspaceName' => $this->invitation->workspace->name ?? 'the workspace',
                'acceptUrl' => $this->acceptUrl,
                'expiresAt' => $this->invitation->expires_at->format('F j, Y'),
                'roleName' => $this->invitation->role_name,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
