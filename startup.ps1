param([Int32]$kiosk=1)
$webServer = "c:\program files\iis express\iisexpress.exe"
$webServerParams = "/path:C:\SkyDrive\marketgid /port:8080"
$webBrowser = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$webBrowserParams = "-kiosk http://localhost:8080/?kiosk=" + $kiosk
$target = "iisexpress"

$process = Get-Process | Where-Object {$_.ProcessName -eq $target}
while ($true)
{
	if (!($process))
	{
		# starting web
		Start-Process -FilePath $webServer -ArgumentList $webServerParams -WindowStyle Minimized
		# sleep 5 seconds
		start-sleep -s 5
		# starting browser
		Start-Process -FilePath $webBrowser -ArgumentList $webBrowserParams
	}
	$process = Get-Process | Where-Object {$_.ProcessName -eq $target}
	$process.WaitForExit()
}