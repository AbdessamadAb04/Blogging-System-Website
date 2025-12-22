$files = Get-ChildItem -Path "Migrations" -Include *.Designer.cs,AppDbContextModelSnapshot.cs -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content.Replace('b.Property<DateTime?>("PublishedDate")', 'b.Property<DateTime>("PublishedDate")')
    # Use regex to restore IsRequired for Status (if missing) - simplified approach since formatting varies
    # We will just fix PublishedDate for now as that causes compiler error. Status/FeatureImage string mismatch is warning.
    
    if ($content -ne $newContent) {
        Set-Content $file.FullName $newContent
        Write-Host "Reverted $($file.Name)"
    }
}
