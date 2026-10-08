$ErrorActionPreference = 'Stop'

$localPort = 16443
$knownHosts = Join-Path $PSScriptRoot 'local\known_hosts'
$identityFile = Join-Path $env:USERPROFILE '.ssh\personal-cluster_ed25519'

$listener = Get-NetTCPConnection -State Listen -LocalPort $localPort -ErrorAction SilentlyContinue
if ($listener) {
    Write-Output "Tunnel already listening on 127.0.0.1:$localPort"
    exit 0
}

$sshArguments = @(
    '-N',
    '-L', "${localPort}:10.70.0.11:6443",
    '-i', $identityFile,
    '-o', 'BatchMode=yes',
    '-o', 'IdentitiesOnly=yes',
    '-o', 'ExitOnForwardFailure=yes',
    '-o', "UserKnownHostsFile=$knownHosts",
    '-o', 'StrictHostKeyChecking=yes',
    'platform-admin@77.237.239.231'
)

Start-Process -FilePath 'ssh.exe' -ArgumentList $sshArguments -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(10)
do {
    Start-Sleep -Milliseconds 250
    $listener = Get-NetTCPConnection -State Listen -LocalPort $localPort -ErrorAction SilentlyContinue
} until ($listener -or (Get-Date) -ge $deadline)

if (-not $listener) {
    throw "The Kubernetes SSH tunnel did not start on port $localPort."
}

Write-Output "Tunnel ready on 127.0.0.1:$localPort"
