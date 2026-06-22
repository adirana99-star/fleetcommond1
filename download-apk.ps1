$id='4e85418f-96ea-48e9-8edc-75f987fdfb2f'
while ($true) {
  $o = npx --package eas-cli eas build:view $id 2>$null | Out-String
  if ($o -match 'Application Archive URL\s+(.*)') {
    $url = $matches[1].Trim()
    if ($url -ne '<in progress>') {
      Write-Host "FOUND_URL $url"
      Invoke-WebRequest -Uri $url -OutFile ".\fleet-command.apk"
      Write-Host "DOWNLOADED .\fleet-command.apk"
      break
    }
  }
  Start-Sleep -Seconds 15
}
