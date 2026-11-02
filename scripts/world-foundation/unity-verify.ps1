param(
 [ValidateSet('Prepare','EditMode','PlayMode','ExportAndroid')][string]$Mode='Prepare',
 [string]$Editor='C:\Program Files\Unity\Hub\Editor\6000.6.4f1\Editor\Unity.exe',
 [string]$Project='C:\SYSTEM\SYSTEM-UNITY-WORLD',
 [string]$EvidenceRoot='E:\SYSTEM\.tmp\system-world-foundation\unity-runs'
)
$ErrorActionPreference='Stop'
if (!(Test-Path -LiteralPath $Editor)) { throw 'Unity Editor missing; no installation or license change is performed.' }
if (!(Test-Path -LiteralPath (Join-Path $Project 'Packages\manifest.json'))) { throw 'Unity project manifest missing.' }
if (Test-Path -LiteralPath (Join-Path $Project 'Temp\UnityLockfile')) { throw 'Project may already be open. Close its Editor normally before verification; lock is not removed.' }
$run=Join-Path $EvidenceRoot ((Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $run -Force | Out-Null
$log=Join-Path $run ($Mode+'.log')
$arguments=@('-batchmode','-nographics','-projectPath',('"{0}"' -f $Project),'-logFile',('"{0}"' -f $log))
if ($Mode -eq 'EditMode' -or $Mode -eq 'PlayMode') {
 $results=Join-Path $run 'results.xml'
 $arguments+=@('-runTests','-testPlatform',$Mode,'-testResults',('"{0}"' -f $results))
} else {
 if ($Mode -eq 'ExportAndroid') { $arguments+=@('-buildTarget','Android') }
 $arguments+=@('-executeMethod',('FoundationBuilder.'+$Mode),'-quit')
}
$child=Start-Process -FilePath $Editor -ArgumentList $arguments -PassThru -WindowStyle Hidden
Write-Output "Unity PID=$($child.Id); evidence=$run"
$child.WaitForExit()
if ($child.ExitCode -ne 0) { throw "Unity $Mode failed (exit $($child.ExitCode)); inspect $log" }
if ($Mode -eq 'EditMode' -or $Mode -eq 'PlayMode') {
 if (!(Test-Path -LiteralPath $results)) { throw "No fresh Unity test XML: $results" }
 [xml]$xml=Get-Content -LiteralPath $results -Raw
 $summary=$xml.'test-run'
 if (!$summary -or [int]$summary.total -lt 1 -or [int]$summary.failed -gt 0 -or $summary.result -ne 'Passed') { throw "Unity test run not passing: $results" }
 Write-Output "PASS ${Mode}: $($summary.passed)/$($summary.total), skipped=$($summary.skipped); $results"
} else { Write-Output "PASS $Mode command exit 0; inspect generated scene/export. No runtime/device claim: $log" }
