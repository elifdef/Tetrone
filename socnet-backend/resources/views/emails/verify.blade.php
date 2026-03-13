@component('mail::message')
# {{ __('email.greeting', ['name' => $user->first_name]) }}

{{ __('email.verify_intro') }}

@component('mail::button', ['url' => $url, 'color' => 'primary'])
{{ __('email.verify_button') }}
@endcomponent

@component('mail::panel')
{{ __('email.verify_expire', ['minutes' => $expireMinutes]) }}
@endcomponent

{{ __('email.verify_outro') }}

{{ config('app.name') }}

@slot('subcopy')
{{ __('email.trouble_clicking') }}
[{{ $url }}]({{ $url }})
@endslot
@endcomponent