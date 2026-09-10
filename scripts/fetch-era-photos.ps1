# Fetches the two timeline-era replacement photos (task #18) from Wikimedia
# Commons. Run this from the repo root AFTER the upload.wikimedia.org 429
# throttle on this IP lifts (it was still throttled 2026-09-10 ~11:40 UTC).
# Downloads ONLY into candidate/ — nothing is installed until a human (or a
# later agent turn) views the pixels with the Read tool and wires the winners
# into src/app.js ERA_PHOTOS. No data files are touched.
#
#   powershell -ExecutionPolicy Bypass -File scripts/fetch-era-photos.ps1

$ErrorActionPreference = "Stop"
$UA = "MessiStats/1.0 (personal stats site; contact via site footer)"
$OutDir = Join-Path $PSScriptRoot ".." "candidate"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory $OutDir | Out-Null }

$Files = @(
  # 2013-2015 era: tight portrait crop from the same Ank Kumar Camp Nou series
  # the current era-2014 wide shot comes from (CC BY-SA 4.0).
  @{ Name = "try-2015-crop.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/9/97/Lionel_Messi_in_a_La_Liga_match_at_Camp_Nou%2C_Barcelona_%28_Ank_Kumar%2C_Infosys_Limited%29_03_%28cropped%29.jpg" },
  # 2004-2008 era option A: portrait 1525x2278 (CC BY-SA 2.0).
  @{ Name = "try-2008-a.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/b/b2/He%27s_the_best%2C_period_-_24-365.jpg" },
  # 2004-2008 era option B: portrait 992x1495 (CC BY 2.0).
  @{ Name = "try-2008-b.jpg"; Url = "https://upload.wikimedia.org/wikipedia/commons/8/8a/Messi_2008.jpg" }
)

foreach ($f in $Files) {
  $dest = Join-Path $OutDir $f.Name
  try {
    Invoke-WebRequest -Uri $f.Url -Headers @{ "User-Agent" = $UA } -OutFile $dest
    $size = (Get-Item $dest).Length
    Write-Output ("OK   {0} ({1} bytes)" -f $f.Name, $size)
  } catch {
    Write-Output ("FAIL {0} : {1}" -f $f.Name, $_.Exception.Message)
  }
  Start-Sleep -Seconds 10  # be polite to Commons
}

Write-Output "Done. View each file's pixels before wiring anything into ERA_PHOTOS."
