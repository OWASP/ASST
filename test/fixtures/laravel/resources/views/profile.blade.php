<h1>{{ $user->name }}</h1>
<div class="bio">{!! $user->bio !!}</div> {{-- @expect CWE-79 --}}
<p>{!! request('q') !!}</p> {{-- @expect CWE-79 --}}
<form method="POST" action="/profile">
    @csrf
    <input name="name">
</form>
<form method="POST" action="/profile/delete"> {{-- @expect CWE-352 --}}
    <button>Delete account</button>
</form>
