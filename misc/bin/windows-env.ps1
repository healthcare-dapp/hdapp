if ($args[0] -match '\.env$') {
    Write-Host "Loading environment file [$args[0]]..."
    if(Test-File -Path $args[0] -PathType Leaf) {
        Get-Content $args[0] | foreach {
            $name, $value = $_.split('=')
            Set-Content env:\$name $value
        }
        Start-Process -NoNewWindow -FilePath $args[1] -ArgumentList $args[2] -Wait 
    } else {
        Write-Host "Environment file was not found."
        exit 1
    }
} else {
    Write-Host "Loading WITHOUT environment file..."
    Start-Process -NoNewWindow -FilePath $args[0] -ArgumentList $args[1] -Wait 
}