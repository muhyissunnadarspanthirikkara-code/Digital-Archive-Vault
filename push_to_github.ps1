$token = "YOUR_GITHUB_TOKEN_HERE"
$owner = "muhyissunnadarspanthirikkara-code"
$repo = "Digital-Archive-Vault"
$files = @("index.html", "style.css", "app.js", "SETUP_GUIDE.md")

foreach ($file in $files) {
    $filePath = "c:\Users\muhyi\Desktop\New folder\$file"
    if (Test-Path $filePath) {
        Write-Host "Uploading $file..."
        $content = [Convert]::ToBase64String([IO.File]::ReadAllBytes($filePath))
        $url = "https://api.github.com/repos/$owner/$repo/contents/$file"
        
        $sha = $null
        try {
            $res = Invoke-RestMethod -Uri $url -Headers @{Authorization = "token $token"}
            $sha = $res.sha
        } catch {}

        $body = @{
            message = "Initial upload: $file"
            content = $content
            branch = "main"
        }
        if ($sha) { 
            $body.sha = $sha 
            $body.message = "Update: $file"
        }

        $jsonBody = $body | ConvertTo-Json
        Invoke-RestMethod -Method Put -Uri $url -Headers @{Authorization = "token $token"} -Body $jsonBody -ContentType "application/json"
        Write-Host "Successfully uploaded $file"
    }
}
