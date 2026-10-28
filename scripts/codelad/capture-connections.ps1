# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for license information.

[CmdletBinding()]
param(
	[Parameter(Mandatory = $true)]
	[ValidateRange(1, 2147483647)]
	[int]$RootProcessId,
	[Parameter(Mandatory = $true)]
	[string]$OutputFile,
	[ValidateRange(1, 3600)]
	[int]$DurationSeconds = 180
)

$ErrorActionPreference = 'Stop'
$OutputFile = [IO.Path]::GetFullPath($OutputFile)
if (Test-Path -LiteralPath $OutputFile) {
	throw 'Refusing to overwrite an existing connection capture.'
}

# Sampling supplements Chromium NetLog. It can miss short-lived connections and UDP/DNS.
# Never record command lines, request bodies or unrelated processes.
$tracked = @{}
$seen = [Collections.Generic.HashSet[string]]::new()
$observedProcesses = [Collections.Generic.HashSet[string]]::new()
$stopwatch = [Diagnostics.Stopwatch]::StartNew()
$writer = [IO.StreamWriter]::new($OutputFile, $false, [Text.UTF8Encoding]::new($false))
try {
	$root = Get-CimInstance Win32_Process -Filter "ProcessId=$RootProcessId"
	if (-not $root) {
		throw 'The editor process exited before socket capture could begin.'
	}
	$tracked[$RootProcessId] = $root.CreationDate.ToUniversalTime().Ticks
	$writer.WriteLine((@{ type = 'coverage'; coverage = 'Sampled editor process-tree TCP connections; excludes UDP/DNS and may miss short-lived connections.' } | ConvertTo-Json -Compress))
	while ($stopwatch.Elapsed.TotalSeconds -lt $DurationSeconds) {
		$processes = @(Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId, CreationDate, Name)
		$alive = @{}
		foreach ($process in $processes) {
			$processKey = [int]$process.ProcessId
			if ($tracked.ContainsKey($processKey) -and $tracked[$processKey] -eq $process.CreationDate.ToUniversalTime().Ticks) {
				$alive[$processKey] = $process.Name
			}
		}
		do {
			$added = $false
			foreach ($process in $processes) {
				$processKey = [int]$process.ProcessId
				if (-not $alive.ContainsKey($processKey) -and $alive.ContainsKey([int]$process.ParentProcessId)) {
					$tracked[$processKey] = $process.CreationDate.ToUniversalTime().Ticks
					$alive[$processKey] = $process.Name
					$added = $true
				}
			}
		} while ($added)
		if (-not $alive.Count) {
			break
		}
		foreach ($process in $processes) {
			$processKey = [int]$process.ProcessId
			if (-not $alive.ContainsKey($processKey) -or -not $observedProcesses.Add("$processKey/$($tracked[$processKey])")) {
				continue
			}
			# Inspect only this editor-owned process. Persist a coarse role, never its arguments or paths.
			$details = Get-CimInstance Win32_Process -Filter "ProcessId=$processKey" -Property CommandLine -ErrorAction SilentlyContinue
			$command = if ($details) { [string]$details.CommandLine } else { '' }
			$role = switch -Regex ($command) {
				'typingsInstaller' { 'automatic-type-acquisition'; break }
				'tsserver' { 'typescript-server'; break }
				'jsonServerMain' { 'json-language-server'; break }
				'npm-cli|npm[\\/]bin[\\/]npm' { 'package-manager'; break }
				'extensionHostProcess' { 'extension-host'; break }
				'hello\.js' { 'local-smoke-script'; break }
				default { 'unclassified' }
			}
			$writer.WriteLine((@{
				type = 'process'
				time = [DateTime]::UtcNow.ToString('o')
				processId = $processKey
				parentProcessId = [int]$process.ParentProcessId
				processName = $process.Name
				role = $role
			} | ConvertTo-Json -Compress))
		}
		foreach ($connection in Get-NetTCPConnection -ErrorAction Stop) {
			$processKey = [int]$connection.OwningProcess
			if (-not $alive.ContainsKey($processKey) -or $connection.RemotePort -eq 0) {
				continue
			}
			$key = "$processKey/$($tracked[$processKey])/$($connection.RemoteAddress)/$($connection.RemotePort)/$($connection.State)"
			if ($seen.Add($key)) {
				$writer.WriteLine((@{
					type = 'connection'
					time = [DateTime]::UtcNow.ToString('o')
					processId = $processKey
					processName = $alive[$processKey]
					remoteAddress = $connection.RemoteAddress
					remotePort = $connection.RemotePort
					state = [string]$connection.State
				} | ConvertTo-Json -Compress))
			}
		}
		$writer.Flush()
		Start-Sleep -Milliseconds 250
	}
	$writer.WriteLine((@{ type = 'complete'; elapsedSeconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 2); connectionStatesObserved = $seen.Count } | ConvertTo-Json -Compress))
} finally {
	$writer.Dispose()
}
