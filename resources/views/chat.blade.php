<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Chat App') }}</title>

    <!-- React App Vite Assets -->
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])

    <script>
        // Pass Laravel user data AND token to React
        window.Laravel = {
            user: @json(auth()->user()),
            token: '{{ $token }}',
            csrfToken: '{{ csrf_token() }}'
        };
    </script>
</head>

<body class="antialiased">
    <div id="root"></div>
</body>

</html>