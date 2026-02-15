param(
    [Parameter(Mandatory = $true)]
    [string]$Dest
)

$ErrorActionPreference = "Stop"

$Source = Join-Path $PSScriptRoot "data-dump"

if (-not (Test-Path $Source)) {
    throw "Source not found: $Source"
}

if (-not (Test-Path $Dest)) {
    New-Item -ItemType Directory -Path $Dest | Out-Null
}

# Sync only .jsonl.gz and .jsonl.bz2.lastmodified files.
robocopy $Source $Dest *.jsonl.gz *.jsonl.bz2.lastmodified /S /FFT /R:2 /W:2 /Z /XO /XF *.jsonl stations.json.gz systemsPopulated.json.gz Commodity* Journal.FSSBodySignals* Journal.FSSSignalDiscovered*

# Robocopy returns non-zero codes for non-error conditions; treat 0-7 as success.
if ($LASTEXITCODE -gt 7) {
    exit $LASTEXITCODE
}
