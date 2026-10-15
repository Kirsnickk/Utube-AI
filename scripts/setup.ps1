$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$taskNode = Join-Path $taskRuntime 'node\bin\node.exe'
$taskPnpm = Join-Path $taskRuntime 'bin\fallback\pnpm.cmd'
$taskPython = Join-Path $taskRuntime 'python\python.exe'
Push-Location $taskRoot
try {
  & $taskPnpm install
  if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
  & $taskPython -m pip install --target .runtime/python -r scripts/requirements.txt
  if ($LASTEXITCODE -ne 0) { throw 'TTS installation failed' }
  if (-not (Test-Path config.local.json)) {
    $taskConfig = Get-Content config.example.json -Raw | ConvertFrom-Json
    $taskConfig.tts.python = $taskPython
    $taskConfig.gateway | Add-Member -NotePropertyName omniRouteDb -NotePropertyValue (Join-Path $env:LOCALAPPDATA 'OmniRoute\data\storage.sqlite')
    $taskConfig | ConvertTo-Json -Depth 10 | Set-Content config.local.json -Encoding utf8
  }
} finally { Pop-Location }
