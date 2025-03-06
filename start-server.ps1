$port = 3000
$path = $PSScriptRoot

# Create a simple HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Server started at http://localhost:$port"
Write-Host "Press Ctrl+C to stop the server"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    # Get the requested file path
    $rawUrl = $request.RawUrl
    if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
    $filePath = Join-Path $path ($rawUrl.TrimStart("/"))
    
    # Set content type based on file extension
    $extension = [System.IO.Path]::GetExtension($filePath)
    $contentType = switch ($extension) {
        ".html" { "text/html" }
        ".css"  { "text/css" }
        ".js"   { "text/javascript" }
        default { "application/octet-stream" }
    }
    
    # Send the response
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    
    $response.Close()
}
