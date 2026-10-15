param([Parameter(ValueFromRemainingArguments=$true)][string[]]$TaskArgs)
$ErrorActionPreference = 'Stop'
$taskNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $taskNode)) { $taskNode = (Get-Command node -ErrorAction Stop).Source }
Push-Location $PSScriptRoot
try { & $taskNode (Join-Path $PSScriptRoot 'src\cli.mjs') @TaskArgs; if ($LASTEXITCODE -ne 0) { throw "Pipeline exited with code $LASTEXITCODE" } } finally { Pop-Location }
