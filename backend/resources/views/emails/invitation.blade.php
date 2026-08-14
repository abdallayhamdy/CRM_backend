@component('mail::message')
# You're Invited!

**{{ $inviterName }}** has invited you to join **{{ $workspaceName }}** on {{ config('app.name') }}.

You will be given the role: **{{ $roleName }}**

This invitation expires on **{{ $expiresAt }}**.

@component('mail::button', ['url' => $acceptUrl, 'color' => 'primary'])
Accept Invitation
@endcomponent

If you did not expect this invitation, you may ignore this email.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
