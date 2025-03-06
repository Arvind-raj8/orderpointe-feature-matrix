$port = 8080
$url = "http://localhost:${port}/"
$path = $PWD.Path

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "Server running at $url"
Write-Host "Serving files from $path"

function Get-MimeType($extension) {
    $mimeTypes = @{
        ".html" = "text/html"
        ".css"  = "text/css"
        ".js"   = "text/javascript"
        ".png"  = "image/png"
        ".jpg"  = "image/jpeg"
        ".jpeg" = "image/jpeg"
        ".gif"  = "image/gif"
        ".ico"  = "image/x-icon"
    }
    
    return $mimeTypes[$extension.ToLower()]
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filename = Join-Path $path $localPath.TrimStart("/")
        $extension = [System.IO.Path]::GetExtension($filename)
        
        if (Test-Path $filename -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filename)
            $response.ContentType = Get-MimeType $extension
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
