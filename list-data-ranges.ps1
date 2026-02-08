#!/usr/bin/env pwsh
# List date ranges for all .jsonl.gz files in data-dump by event type

$events = @{}

Get-ChildItem -Path .\data-dump -File -Filter "*.jsonl.gz" | 
    Where-Object { $_.Name -match 'Journal\.(\w+)-(\d{4}-\d{2}-\d{2})' } | 
    ForEach-Object {
        $event = $matches[1]
        $date = $matches[2]
        if (-not $events[$event]) { $events[$event] = @() }
        $events[$event] += $date
    }

$events.GetEnumerator() | 
    Sort-Object Name | 
    ForEach-Object {
        $evt = $_.Key
        $dates = @($_.Value | Sort-Object -Unique)
        Write-Host "$evt`: $($dates[0]) to $($dates[-1]) ($($dates.Count) unique days)"
    }

Write-Host ""
Get-ChildItem -Path .\data-dump -File -Filter "*.json.gz" | 
    ForEach-Object { Write-Host "Also: $($_.Name)" }
