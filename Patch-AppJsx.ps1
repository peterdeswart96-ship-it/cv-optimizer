# ============================================================
# Patch-AppJsx.ps1
# Past drie gerichte wijzigingen toe in App.jsx:
# 1. Voeg cvHtml state toe
# 2. Sla html op bij uploadCv
# 3. Geef cvHtml mee in navigate calls
# ============================================================

$Pad = "C:\Projects\cv-optimizer\frontend\src\App.jsx"

if (-not (Test-Path $Pad)) {
    Write-Host "FOUT: App.jsx niet gevonden op $Pad" -ForegroundColor Red
    exit 1
}

$inhoud = Get-Content $Pad -Raw -Encoding UTF8

# ── Patch 1: cvHtml state toevoegen ──────────────────────────────────────────
$oud1 = "  const [cvTekst, setCvTekst] = useState('')"
$nieuw1 = "  const [cvTekst, setCvTekst] = useState('')
  const [cvHtml, setCvHtml] = useState(null)   // HTML structuur van DOCX upload"

if ($inhoud -match [regex]::Escape($oud1)) {
    $inhoud = $inhoud.Replace($oud1, $nieuw1)
    Write-Host "OK: cvHtml state toegevoegd" -ForegroundColor Green
} else {
    Write-Host "SKIP: cvHtml state al aanwezig of niet gevonden" -ForegroundColor Yellow
}

# ── Patch 2: uploadCv — sla html op naast tekst ──────────────────────────────
$oud2 = @"
      if (data.tekst) {
        setCvTekst(data.tekst)
      } else {
        setFout(data.error || 'Kon bestand niet verwerken')
      }
"@

$nieuw2 = @"
      if (data.tekst) {
        setCvTekst(data.tekst)
        setCvHtml(data.html || null)   // null bij PDF, HTML string bij DOCX
      } else {
        setFout(data.error || 'Kon bestand niet verwerken')
      }
"@

if ($inhoud -match [regex]::Escape($oud2.Trim())) {
    $inhoud = $inhoud.Replace($oud2, $nieuw2)
    Write-Host "OK: uploadCv bijgewerkt met cvHtml" -ForegroundColor Green
} else {
    Write-Host "SKIP: uploadCv upload al bijgewerkt of niet gevonden" -ForegroundColor Yellow
}

# ── Patch 3a: navigate naar keyword-feedback — voeg cvHtml toe ───────────────
$oud3a = "navigate('/keyword-feedback', { state: { analyse, cvTekst, vacatureTekst } })"
$nieuw3a = "navigate('/keyword-feedback', { state: { analyse, cvTekst, cvHtml, vacatureTekst } })"

if ($inhoud -match [regex]::Escape($oud3a)) {
    $inhoud = $inhoud.Replace($oud3a, $nieuw3a)
    Write-Host "OK: navigate keyword-feedback bijgewerkt" -ForegroundColor Green
} else {
    Write-Host "SKIP: navigate keyword-feedback al bijgewerkt of niet gevonden" -ForegroundColor Yellow
}

# ── Patch 3b: navigate naar cv-preview in SectieReview — voeg cvHtml toe ─────
$oud3b = "state: { secties, definitieveTeksten, cvTekst }"
$nieuw3b = "state: { secties, definitieveTeksten, cvTekst, cvHtml }"

if ($inhoud -match [regex]::Escape($oud3b)) {
    $inhoud = $inhoud.Replace($oud3b, $nieuw3b)
    Write-Host "OK: navigate cv-preview bijgewerkt" -ForegroundColor Green
} else {
    Write-Host "SKIP: navigate cv-preview al bijgewerkt of niet gevonden" -ForegroundColor Yellow
}

# ── Opslaan ───────────────────────────────────────────────────────────────────
[System.IO.File]::WriteAllText($Pad, $inhoud, [System.Text.Encoding]::UTF8)
Write-Host ""
Write-Host "App.jsx succesvol bijgewerkt!" -ForegroundColor Cyan
