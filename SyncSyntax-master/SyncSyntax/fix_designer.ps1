$files = Get-ChildItem -Path "Migrations" -Include *.Designer.cs,AppDbContextModelSnapshot.cs -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content.Replace('b.Property<DateTime>("PublishedDate")', 'b.Property<DateTime?>("PublishedDate")')
    $newContent = [Regex]::Replace($newContent, 'b.Property<string>\("Status"\)\s*\.IsRequired\(\)', 'b.Property<string>("Status")')
    $newContent = [Regex]::Replace($newContent, 'b.Property<string>\("FeatureImagePath"\)\s*\.IsRequired\(\)', 'b.Property<string>("FeatureImagePath")')
    if ($content -ne $newContent) {
        Set-Content $file.FullName $newContent
        Write-Host "Updated $($file.Name)"
    }
}
