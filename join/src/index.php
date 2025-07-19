<?php
// Simple PHP router for Angular SPA
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = dirname($_SERVER['SCRIPT_NAME']);

// Remove the script directory from the request URI
$request_path = str_replace($script_name, '', $request_uri);

// Check if the requested file exists
$file_path = __DIR__ . $request_path;

// If it's a real file, let Apache serve it
if (is_file($file_path)) {
    return false;
}

// Check for common static file extensions
if (preg_match('/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|html)$/i', $request_path)) {
    return false;
}

// For all Angular routes, serve index.html
readfile(__DIR__ . '/index.html');
?>
