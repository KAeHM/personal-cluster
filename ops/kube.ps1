$ErrorActionPreference = 'Stop'

& (Join-Path $PSScriptRoot 'kube-tunnel.ps1')
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$kubeconfig = Join-Path $env:USERPROFILE '.kube\personal-contabo.yaml'
& kubectl --kubeconfig $kubeconfig @args
exit $LASTEXITCODE
