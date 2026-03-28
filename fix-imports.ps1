$files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Where-Object { 
    Select-String -Path $_.FullName -Pattern 'auth-helpers-nextjs' -Quiet 
}
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $content = $content -replace '(?i)@supabase/ssr', '@supabase/ssr'
    $content = $content -replace 'createServerClient', 'createServerClient'
    $content = $content -replace 'createBrowserClient', 'createBrowserClient'
    $content = $content -replace 'createServerClient', 'createServerClient'
    $content = $content -replace 'createMiddlewareClient', 'createServerClient'
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    Write-Host "Fixed: $($file.Name)"
}
Write-Host "Done!"