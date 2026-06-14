---
name: project-intelligence-pipeline
description: >
  Gebruik deze skill aan het begin en einde van elke werksessie om de projectstatus bij te werken,
  bestanden op te halen en het Claude project te syncen. Herbruikbaar voor alle projecten.
  Trigger wanneer: sessie begint of eindigt, status moet worden bijgewerkt, bestanden moeten worden
  opgehaald, of iemand vraagt naar de werkwijze of pipeline.
---

# Project Intelligence Pipeline — SKILL.md

## Doel
Na elke werksessie de projectstatus bijwerken, relevante bestanden ophalen en het Claude project syncen. Herbruikbaar voor alle projecten op peterdeswart96-ship-it.

## Tools

| Script | Locatie | Doel |
|--------|---------|------|
| `Update-ProjectStatus.ps1` | `C:\Projects\tools\` | Genereert `PROJECT_STATUS.md` vanuit GitHub |
| `Haal-Projectbestanden-Op.ps1` | `C:\Projects\tools\` | Haalt gewijzigde bestanden op uit repo |
| `Git-Commit-En-Push.ps1` | `C:\Projects\tools\` | Commit, push en monitor GitHub Actions |
| `Test-CvOptimizer.ps1` | `C:\Projects\tools\` | Smoke test voor CV Optimizer deployments |

---

## Werkwijze — Einde van elke sessie

### Stap 1: Status genereren
```powershell
C:\Projects\tools\Update-ProjectStatus.ps1 `
  -Repo "cv-optimizer" `
  -ProjectNaam "CV Optimizer" `
  -Beschrijving "SaaS web app die CV's analyseert en verbetert met Claude AI" `
  -OutputPad "C:\Projects\cv-optimizer\PROJECT_STATUS.md"
```

### Stap 2: Status committen
```powershell
cd C:\Projects\cv-optimizer
C:\Projects\tools\Git-Commit-En-Push.ps1 -Bericht "docs: PROJECT_STATUS.md bijgewerkt"
```

### Stap 3: Gewijzigde bestanden ophalen
```powershell
# Alleen bestanden van de laatste commit
C:\Projects\tools\Haal-Projectbestanden-Op.ps1 -Repo "cv-optimizer" -AllesVanLaatsteCommit

# Of specifieke bestanden
C:\Projects\tools\Haal-Projectbestanden-Op.ps1 -Repo "cv-optimizer" -Bestanden @(
    "frontend/src/App.jsx",
    "frontend/src/CVPreview.jsx"
)
```

### Stap 4: Claude project syncen
Upload naar het Claude project:
- `PROJECT_STATUS.md` — altijd
- Gewijzigde bestanden uit `C:\Projects\cv-optimizer-bestanden\`
- Deze `SKILL.md` als die is bijgewerkt

---

## Werkwijze — Begin van elke sessie

```powershell
# Haal de meest recente bestanden op voordat je begint
C:\Projects\tools\Haal-Projectbestanden-Op.ps1 -Repo "cv-optimizer" -AllesVanLaatsteCommit
```

Start elke sessie met:
1. Bekijk `PROJECT_STATUS.md` voor de huidige status
2. Vraag: "Wat staat er open in de backlog?"
3. Kies één issue om op te pakken
4. Werk het af inclusief verificatie (`Test-CvOptimizer.ps1`)
5. Sluit het GitHub Issue pas na handmatig testen in de browser

---

## Agile werkwijze

### Spelregels
- Eén ding tegelijk — nooit meerdere grote wijzigingen tegelijk
- Na elke deployment: verificatiescript uitvoeren vóór je verdergaat
- Issues pas sluiten NADAT: (1) workflow groen, (2) verificatiescript 10/10, (3) handmatig getest
- Nooit een issue sluiten direct na deployment

### GitHub Issues labels
| Label | Betekenis |
|-------|-----------|
| `prioriteit:hoog` | Moet snel opgepakt worden |
| `prioriteit:normaal` | Normale prioriteit |
| `prioriteit:laag` | Nice-to-have |
| `type:bug` | Iets werkt niet correct |
| `type:feature` | Nieuwe functionaliteit |
| `type:ux` | UI/UX verbetering |
| `type:security` | Beveiliging |
| `area:frontend` | Frontend wijziging |
| `area:backend` | Backend wijziging |

---

## Hergebruik voor andere projecten

Vervang de parameters bij stap 1 en 3:

```powershell
# Mokum Bot
C:\Projects\tools\Update-ProjectStatus.ps1 `
  -Repo "cuescore" `
  -ProjectNaam "Mokum Bot" `
  -Beschrijving "Claude API chatbot voor Mokum Pool & Darts" `
  -OutputPad "C:\Projects\mokum-bot\PROJECT_STATUS.md"

C:\Projects\tools\Haal-Projectbestanden-Op.ps1 -Repo "cuescore" -AllesVanLaatsteCommit
```

---

## Kritieke werkwijze regels (geheugen)

1. **Altijd live versie ophalen** vóór patchen:
   ```powershell
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/peterdeswart96-ship-it/cv-optimizer/main/frontend/src/[bestand]" -OutFile "C:\Projects\cv-optimizer-bestanden\[bestand]"
   ```
   Gebruik NOOIT een eerder geüploade versie als basis.

2. **GitHub Issues pas sluiten** NADAT:
   - Workflow groen is
   - Verificatiescript 10/10 geeft
   - Fix handmatig getest is in de browser

3. **Bij problemen**: eerst terugdraaien (`git revert HEAD`), dan debuggen

---

## PROJECT_STATUS.md structuur

Het gegenereerde bestand bevat altijd:
- Deployment status (laatste workflow runs)
- Open issues gesorteerd op prioriteit
- Recente commits (laatste 5)
- Claude project sync checklist

