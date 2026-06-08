# CV Optimizer — Projectinstructies (4D Framework)
**Project**: cv-optimizer.pdscloud.nl  
**Eigenaar**: Peter de Swart  
**Doel**: Leerproject AI Fluency + werkende tool voor vrienden/collega's  
**Datum**: mei 2026

---

## Overzicht van het 4D Framework

| Fase | Wat je doet |
|---|---|
| **Define** | Doel, gebruikers, sucrescriteria vastleggen |
| **Design** | Architectuur, prompts, UX-flow ontwerpen |
| **Develop** | Bouwen, testen, itereren |
| **Deploy** | Live zetten, beveiligen, monitoren |

---

# FASE 1 — DEFINE

## 1.1 Probleemstelling

Veel mensen schrijven een generiek CV dat niet aansluit op een specifieke vacature. Ze missen keywords, de tone-of-voice klopt niet, en ze weten niet welke secties zwak zijn. Dit project biedt een AI-gestuurde workflow waarbij een gebruiker zijn CV én een vacature invoert, en per sectie concrete, onderbouwde verbetervoorstellen ontvangt — met de mogelijkheid om wijzigingen interactief door te voeren en het resultaat te downloaden.

## 1.2 Doelgroep

- **Primaire gebruikers**: vrienden en collega's van Peter (kleine, vertrouwde groep)
- **Talen**: Nederlands én Engels (de tool detecteert de taal van het CV automatisch)
- **Technisch niveau gebruikers**: variabel — de UI moet intuïtief zijn zonder technische kennis

## 1.3 Kernfunctionaliteiten (MVP)

1. CV uploaden als `.pdf` of `.docx`
2. Vacature invoeren als platte tekst óf URL
3. Claude analyseert CV vs. vacature en geeft:
   - **Match-score** (0–100%) met toelichting
   - **Ontbrekende keywords** uit de vacature
   - **Tone-of-voice analyse** (past de schrijfstijl bij het bedrijf?)
4. Per CV-sectie (Over mij, Werkervaring, Opleiding, Vaardigheden, etc.):
   - Uitgebreide analyse + redenering
   - Concrete herschrijfvariant(en)
   - Keuze: ① Ongewijzigd laten ② Aanpassing doorvoeren ③ Anders, namelijk…
5. Bewerkbare preview na elke keuze
6. Download aangepast CV als `.docx` en `.pdf`
7. Login vereist — bestanden en sessies worden permanent opgeslagen per gebruiker

## 1.4 Succescriteria

- Een gebruiker kan in < 15 minuten een verbeterd CV downloaden
- Claude-suggesties zijn altijd sectiespecifiek en vacature-gerelateerd (geen generieke tips)
- De tool werkt voor zowel Nederlandse als Engelstalige CV's en vacatures
- Kosten blijven onder €20/maand bij normaal gebruik (kleine groep)

## 1.5 Buiten scope (voor nu)

- Automatische LinkedIn-import
- Multi-user collaboration
- CV-templates from scratch aanmaken
- Mobile-first design (desktop browser is voldoende voor MVP)

---

# FASE 2 — DESIGN

## 2.1 Technische Architectuur

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│   GitHub Pages  →  cv-optimizer.pdscloud.nl             │
│   React (Vite)  +  Tailwind CSS                         │
│   Hosted als Static Web App via GitHub Actions          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS API calls
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (Azure)                         │
│   Azure Functions (Node.js, serverless)                 │
│   Endpoints:                                            │
│   - POST /api/analyze      → Claude API aanroepen       │
│   - POST /api/upload        → CV opslaan in Blob        │
│   - GET  /api/session/{id}  → Sessie ophalen            │
│   - POST /api/export        → .docx/.pdf genereren      │
└────────────┬───────────────────┬────────────────────────┘
             │                   │
┌────────────▼──────┐  ┌────────▼────────────────────────┐
│  Azure Blob       │  │  Anthropic Claude API            │
│  Storage          │  │  Model: claude-sonnet-4-20250514 │
│  - CV bestanden   │  │  claude-sonnet-4-5 (fallback)    │
│  - Sessiedata     │  │  Structured JSON output          │
│  - Export cache   │  └─────────────────────────────────┘
└───────────────────┘
             │
┌────────────▼──────────────────────────────────────────┐
│  Azure AD B2C (Authenticatie)                          │
│  - Email + wachtwoord login                            │
│  - Elke gebruiker krijgt eigen opslag-namespace        │
│  - Aanbevolen boven Entra ID voor externe gebruikers   │
└───────────────────────────────────────────────────────┘
```

### Waarom deze keuzes?

| Keuze | Reden |
|---|---|
| **GitHub Pages** voor frontend | Gratis, al bekend, past bij pdscloud.nl workflow |
| **Azure Functions** voor backend | Serverless = betaal per aanroep, geen idle kosten |
| **Azure Blob Storage** | Goedkoop, simpel, schaalbaar voor bestandsopslag |
| **Azure AD B2C** | Gratis tot 50.000 MAU, werkt voor externe gebruikers (geen werk-account nodig), eenvoudiger dan Entra ID voor deze use case |
| **Claude Sonnet 4** | Beste balans kwaliteit/kosten voor lange document-analyse |

### Geschatte maandkosten (kleine groep, ~10 gebruikers)

| Service | Kosten/maand |
|---|---|
| Azure Functions | ~€0–2 (consumption plan) |
| Azure Blob Storage | ~€0–1 |
| Azure AD B2C | Gratis (< 50k MAU) |
| Claude API (Sonnet) | ~€5–15 afhankelijk van gebruik |
| **Totaal** | **~€6–18/maand** |

---

## 2.2 UX Flow (gebruikersreis)

```
[1] LOGIN / REGISTRATIE
    ↓
[2] UPLOAD SCHERM
    ├── CV uploaden (.pdf of .docx)
    └── Vacature invoeren (tekst plakken of URL)
    ↓
[3] ANALYSE DASHBOARD
    ├── Match-score (grote cirkel, % + kleurcode)
    ├── Ontbrekende keywords (chips/tags)
    ├── Tone-of-voice rapport (kort, 3-5 zinnen)
    └── [Start sectie-review] knop
    ↓
[4] SECTIE-REVIEW LOOP (één sectie tegelijk)
    ├── Huidige sectietekst (readonly weergave)
    ├── Claude-analyse (uitgebreid: redenering + varianten)
    ├── Keuze:
    │   ① Ongewijzigd laten → volgende sectie
    │   ② Aanpassing doorvoeren → toon bewerkbare preview
    │   ③ Anders, namelijk… → tekstveld → toon bewerkbare preview
    └── [Bewerkbare preview] → Opslaan → volgende sectie
    ↓
[5] SAMENVATTING
    ├── Overzicht van alle wijzigingen
    ├── Optie: terug naar sectie X
    └── [Download CV]
    ↓
[6] DOWNLOAD
    ├── .docx (behoudt opmaak)
    └── .pdf (print-ready)
```

---

## 2.3 Prompt Engineering (de kern van het leerproject)

Dit is het hart van het project vanuit AI Fluency perspectief. Hieronder de prompt-architectuur per stap.

### Prompt 1 — Initiële CV + Vacature Analyse

**Doel**: Gestructureerde JSON teruggeven met match-score, keywords en tone-analyse.

**Systeem-prompt**:
```
Je bent een professionele loopbaancoach en recruitment specialist met 15 jaar ervaring.
Je analyseert CV's en vacatures met als doel de kandidaat te helpen zijn/haar kansen te maximaliseren.

Gedraag je als een eerlijke, constructieve coach — niet als een PR-bureau. 
Geef concrete, specifieke feedback gebaseerd op de daadwerkelijke inhoud.
Detecteer automatisch de taal van het CV (NL of EN) en antwoord in dezelfde taal.

Retourneer ALLEEN geldige JSON, geen markdown, geen inleiding, geen uitleg buiten de JSON.
```

**User-prompt**:
```
Analyseer dit CV ten opzichte van deze vacature.

CV:
<cv_tekst>
{{CV_CONTENT}}
</cv_tekst>

Vacature:
<vacature>
{{VACATURE_CONTENT}}
</vacature>

Retourneer de volgende JSON-structuur:
{
  "taal": "nl" | "en",
  "match_score": <0-100>,
  "match_toelichting": "<2-3 zinnen waarom deze score>",
  "ontbrekende_keywords": ["keyword1", "keyword2", ...],
  "aanwezige_keywords": ["keyword1", "keyword2", ...],
  "tone_of_voice_vacature": "<beschrijf de toon van het bedrijf in 2-3 zinnen>",
  "tone_of_voice_cv": "<beschrijf de huidige toon van het CV in 2-3 zinnen>",
  "tone_aanbeveling": "<concrete aanbeveling voor toon-aanpassing>",
  "secties": [
    {
      "naam": "<sectienaam zoals gevonden in CV>",
      "volgorde": <1, 2, 3...>,
      "originele_tekst": "<volledige originele tekst van deze sectie>"
    }
  ]
}
```

**Waarom deze aanpak?**
- XML-tags (`<cv_tekst>`) zorgen voor duidelijke scheiding van instructies en data — dit reduceert hallucinaties aanzienlijk
- Strict JSON output maakt parsing in de frontend betrouwbaar
- Systeem-prompt definieert persona en gedragsregels, user-prompt geeft de taak

---

### Prompt 2 — Sectie Analyse (per sectie)

**Doel**: Uitgebreide analyse + concrete herschrijfvarianten voor één sectie.

**Systeem-prompt**: *(zelfde als Prompt 1)*

**User-prompt**:
```
Je hebt eerder al het CV en de vacature geanalyseerd. 
Nu ga je sectie "{{SECTIE_NAAM}}" uitgebreid analyseren.

Originele sectietekst:
<sectie>
{{SECTIE_TEKST}}
</sectie>

Vacature context:
<vacature>
{{VACATURE_CONTENT}}
</vacature>

Eerder vastgestelde ontbrekende keywords: {{KEYWORDS_LIJST}}
Tone-of-voice aanbeveling: {{TONE_AANBEVELING}}

Retourneer ALLEEN geldige JSON:
{
  "sectie_naam": "{{SECTIE_NAAM}}",
  "analyse": {
    "sterke_punten": ["<punt 1>", "<punt 2>"],
    "zwakke_punten": ["<punt 1>", "<punt 2>"],
    "redenering": "<uitgebreide uitleg in 3-5 zinnen waarom aanpassingen nodig zijn>",
    "vacature_relevantie": "<hoe sluit deze sectie aan op de vacature, specifiek>"
  },
  "varianten": [
    {
      "variant_nummer": 1,
      "label": "<korte beschrijving, bijv. 'Keywords toegevoegd'>",
      "tekst": "<volledige herschreven sectietekst variant 1>"
    },
    {
      "variant_nummer": 2,
      "label": "<korte beschrijving, bijv. 'Compacter + resultaatgericht'>",
      "tekst": "<volledige herschreven sectietekst variant 2>"
    }
  ],
  "tips": ["<concrete tip 1>", "<concrete tip 2>"]
}
```

**Design beslissingen**:
- Altijd **2 varianten** teruggeven — geeft de gebruiker keuzevrijheid zonder overweldiging
- `redenering` is bewust uitgebreid gevraagd — dit is het leermoment voor de gebruiker
- Context uit eerdere analyse (keywords, tone) meegeven zorgt voor consistente suggesties

---

### Prompt 3 — Vrije Aanpassing Verwerken

**Doel**: Wanneer de gebruiker kiest voor "Anders, namelijk…" en eigen instructies geeft.

**User-prompt**:
```
De gebruiker wil sectie "{{SECTIE_NAAM}}" aanpassen met de volgende eigen instructie:

<instructie>
{{GEBRUIKER_INSTRUCTIE}}
</instructie>

Originele sectietekst:
<sectie>
{{SECTIE_TEKST}}
</sectie>

Herschrijf de sectie exact volgens de instructie van de gebruiker.
Behoud de originele feiten — verzin niets bij.
Retourneer ALLEEN geldige JSON:
{
  "herschreven_tekst": "<de herschreven sectietekst>",
  "toelichting": "<korte uitleg wat je hebt gedaan>"
}
```

**Belangrijk principe**: `Behoud de originele feiten — verzin niets bij.` Dit is een kritische guardrail — een CV met verzonnen informatie is schadelijk voor de gebruiker.

---

### Prompt Engineering Best Practices (leerpunten)

| Principe | Toepassing in dit project |
|---|---|
| **Rol + context in systeem-prompt** | Coach-persona met duidelijke gedragsregels |
| **XML-tags voor data-scheiding** | `<cv_tekst>`, `<vacature>`, `<sectie>` |
| **Structured output (JSON)** | Altijd strict JSON, nooit markdown-wrapped |
| **Positieve + negatieve instructies** | "Verzin niets bij" naast "Herschrijf exact" |
| **Chain-of-thought uitlokken** | `redenering` veld verplicht in output |
| **Context meegeven** | Keywords en tone uit stap 1 meegeven in stap 2 |
| **Taal-detectie ingebakken** | Model detecteert NL/EN automatisch |

---

## 2.4 Gegevensmodel (Azure Blob Storage)

```
blob-container: cv-optimizer-users/
└── {user_id}/
    ├── sessions/
    │   └── {session_id}.json        ← volledige sessie-state
    ├── uploads/
    │   ├── cv-original.pdf          ← origineel geüpload CV
    │   └── vacature.txt             ← vacaturetekst (of URL)
    └── exports/
        ├── cv-aangepast.docx
        └── cv-aangepast.pdf
```

**Sessie JSON structuur**:
```json
{
  "session_id": "uuid",
  "user_id": "azure-b2c-user-id",
  "aangemaakt": "2026-05-13T10:00:00Z",
  "status": "in_progress" | "completed",
  "analyse": { ...match_score, keywords, tone... },
  "secties": [
    {
      "naam": "Over mij",
      "originele_tekst": "...",
      "status": "ongewijzigd" | "aangepast" | "in_review",
      "definitieve_tekst": "...",
      "gebruiker_keuze": 1 | 2 | 3
    }
  ]
}
```

---

# FASE 3 — DEVELOP

## 3.1 Stap-voor-stap Bouwvolgorde

### Stap 0 — Voorbereiding (eenmalig)

- [ ] Claude API key aanmaken op [console.anthropic.com](https://console.anthropic.com)
  - Account aanmaken → API Keys → Create Key
  - Sla de key op als `CLAUDE_API_KEY` (nooit in code committen!)
- [ ] Azure subscription klaarstetten
- [ ] GitHub repo aanmaken: `peterdeswart96-ship-it/cv-optimizer`
- [ ] Node.js installeren (v18+) voor lokale ontwikkeling

---

### Stap 1 — Azure Infrastructuur Opzetten

```bash
# Azure CLI commando's (uitvoeren in Azure Cloud Shell of lokaal)

# Resource group
az group create --name rg-cv-optimizer --location westeurope

# Storage account (voor Blob + sessies)
az storage account create \
  --name stcvoptimizer \
  --resource-group rg-cv-optimizer \
  --location westeurope \
  --sku Standard_LRS

# Function App (serverless backend)
az functionapp create \
  --resource-group rg-cv-optimizer \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --name func-cv-optimizer \
  --storage-account stcvoptimizer

# Claude API key opslaan als secret (nooit hardcoden!)
az functionapp config appsettings set \
  --name func-cv-optimizer \
  --resource-group rg-cv-optimizer \
  --settings CLAUDE_API_KEY="sk-ant-..."
```

---

### Stap 2 — Azure AD B2C Configureren

1. Ga naar Azure Portal → **Azure AD B2C** → Nieuwe tenant aanmaken
2. Naam: `cvoptimizer`
3. **User flows** aanmaken:
   - Sign up and sign in (SUSI) flow
   - Email + wachtwoord inschakelen
4. **App registration** aanmaken voor de frontend
5. Redirect URI instellen: `https://cv-optimizer.pdscloud.nl/auth/callback`
6. Client ID noteren → in frontend config opslaan

---

### Stap 3 — Azure Functions Bouwen

Maak de volgende endpoints:

**`/api/analyze`** (POST)
```javascript
// Ontvangt: { cv_tekst, vacature_tekst }
// Doet: Claude API aanroepen met Prompt 1
// Retourneert: JSON analyse-resultaat
// Slaat op: sessie in Blob Storage
```

**`/api/analyze-section`** (POST)
```javascript
// Ontvangt: { session_id, sectie_naam, sectie_tekst }
// Doet: Claude API aanroepen met Prompt 2
// Retourneert: JSON sectie-analyse + varianten
```

**`/api/apply-change`** (POST)
```javascript
// Ontvangt: { session_id, sectie_naam, keuze, aangepaste_tekst? }
// Doet: Sessie updaten in Blob Storage
// Retourneert: { success: true }
```

**`/api/export`** (POST)
```javascript
// Ontvangt: { session_id, formaat: 'docx' | 'pdf' }
// Doet: CV samenstellen uit sessie + converteren
// Retourneert: download URL (Blob SAS token)
// Libraries: docx (npm) voor .docx, puppeteer of jsPDF voor .pdf
```

---

### Stap 4 — Frontend Bouwen (React + Vite)

**Componenten structuur**:
```
src/
├── components/
│   ├── UploadScreen.jsx       ← CV + vacature invoer
│   ├── AnalysisDashboard.jsx  ← match-score + keywords
│   ├── SectionReview.jsx      ← per-sectie workflow
│   ├── EditablePreview.jsx    ← bewerkbare tekst na keuze
│   └── DownloadScreen.jsx     ← .docx / .pdf download
├── hooks/
│   ├── useClaudeAnalysis.js   ← API calls beheren
│   └── useSession.js          ← sessie state beheren
└── App.jsx
```

---

### Stap 5 — CV Parsing

Voor het uitlezen van het geüploade CV bestand:
- **PDF**: gebruik `pdf-parse` (npm) in de Azure Function
- **DOCX**: gebruik `mammoth` (npm) om DOCX naar plaintext te converteren
- Stuur de extracted tekst naar Claude (geen binair bestand)

---

### Stap 6 — Vacature URL Scraping

Wanneer de gebruiker een URL invoert:
```javascript
// In Azure Function: /api/fetch-vacature
// Gebruik: node-fetch + cheerio (HTML parser)
// Extraheer: <main>, <article>, of grootste tekstblok
// Stuur naar Claude: "Dit is de vacaturetekst: ..."
```

> ⚠️ Let op: sommige job boards (LinkedIn, Indeed) blokkeren scraping. 
> Fallback: toon melding "URL niet leesbaar — plak de tekst handmatig"

---

### Stap 7 — GitHub Pages + Subdomein

Volg de bestaande pdscloud.nl subdomain skill:

1. GitHub Pages activeren op de `cv-optimizer` repo
2. `CNAME` bestand toevoegen met inhoud: `cv-optimizer.pdscloud.nl`
3. DNS CNAME record toevoegen in TransIP:
   - Naam: `cv-optimizer`
   - Type: `CNAME`  
   - Waarde: `peterdeswart96-ship-it.github.io.`
4. Custom domain instellen in GitHub Pages settings
5. HTTPS enforcer aanzetten

---

# FASE 4 — DEPLOY

## 4.1 CI/CD Pipeline (GitHub Actions)

Maak `.github/workflows/deploy.yml`:

```yaml
name: Deploy CV Optimizer

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install & Build
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist

  deploy-functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: func-cv-optimizer
          package: ./backend
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## 4.2 Security Checklist

- [ ] Claude API key **alleen** als Azure Function App Setting (nooit in GitHub)
- [ ] Azure Blob Storage: **geen publieke toegang** — altijd via SAS tokens
- [ ] CORS instellen op Azure Functions: alleen `cv-optimizer.pdscloud.nl` toestaan
- [ ] Azure AD B2C: token validatie in elke Function implementeren
- [ ] `.env` bestanden in `.gitignore`
- [ ] Rate limiting op `/api/analyze` endpoint (bijv. max 10 analyses/uur/gebruiker)

---

## 4.3 Monitoring & Beheer

| Tool | Gebruik |
|---|---|
| **Azure Application Insights** | Errors loggen, response times bewaken |
| **Azure Function logs** | Zie exact welke API calls falen |
| **Anthropic Console** | Claude API gebruik + kosten bijhouden |
| **GitHub Actions** | Deploy status monitoren |

---

## 4.4 Iteraties na MVP

Na de eerste werkende versie kun je uitbreiden met:

1. **Sessiegeschiedenis** — eerder geoptimaliseerde CV's opnieuw bekijken
2. **Template kiezer** — verschillende CV-stijlen voor de download
3. **Cover letter generator** — op basis van het geoptimaliseerde CV + vacature
4. **LinkedIn URL scrapen** — vacature direct van LinkedIn importeren
5. **Streaming responses** — Claude antwoorden live tonen terwijl ze binnenkomen
6. **Vacature zoekfunctie via API's** — gebruiker kan direct vanuit de tool zoeken naar vacatures i.p.v. tekst handmatig plakken

   Onderzochte opties:

   | API | NL-support | Gratis | Opmerkingen |
   |---|---|---|---|
   | **Adzuna** | ✅ | ✅ gratis tier | Beste optie: REST/JSON, `app_id` + `app_key` via developer.adzuna.com, 19 landen incl. NL |
   | **Jooble** | ✅ | ✅ | REST API, eenvoudig, minder uitgebreid dan Adzuna |
   | **LinkedIn Jobs** | ✅ | ❌ | Officiële API vereist goedgekeurd developer account, blokkeert scraping actief |
   | **Indeed** | ✅ | ❌ | Publieke API deprecated; alleen via partnership |
   | **WerkenvoorNederland** | ✅ | ✅ | Overheids-API (CSO Vacature API), alleen overheidsbaantjes |

   **Aanbeveling: Adzuna als primaire API.**

   Technische aanpak:
   - Nieuw Azure Function endpoint `/api/zoek-vacatures` dat de Adzuna API aanroept
   - `ADZUNA_APP_ID` en `ADZUNA_APP_KEY` opslaan als Function App Settings (nooit in code)
   - Frontend toont zoekresultaten als selecteerbare kaarten — bij selectie wordt de vacaturetekst automatisch ingeladen
   - Adzuna API-aanroep: `https://api.adzuna.com/v1/api/jobs/nl/search/1?app_id=...&app_key=...&q={zoekterm}&location={locatie}`

---

## 4.5 Leerpunten Claude API (AI Fluency)

Dit project raakt de volgende kernconcepten uit de AI Fluency cursus:

| Concept | Waar toegepast |
|---|---|
| **Prompt structuur** | Systeem vs. user prompt scheiding |
| **XML tags voor context** | `<cv_tekst>`, `<vacature>` tags |
| **Structured outputs** | Strict JSON responses voor betrouwbare parsing |
| **Chain-of-thought** | `redenering` veld verplicht stellen |
| **Guardrails** | "Verzin niets bij" instructie |
| **Multi-turn context** | Sectie-analyse bouwt voort op initiële analyse |
| **Persona engineering** | Coach-rol met specifieke gedragsregels |
| **Taal-detectie** | Automatisch NL/EN in systeem-prompt |

---

## Quickstart Samenvatting

```
Week 1: Stap 0 + 1 + 2  → Azure infra + API key + B2C auth
Week 2: Stap 3           → Azure Functions bouwen + testen
Week 3: Stap 4 + 5 + 6  → Frontend bouwen + CV parsing + URL scraping  
Week 4: Stap 7 + CI/CD  → Live zetten op cv-optimizer.pdscloud.nl
```

---

*Gegenereerd op basis van het 4D Framework van Anthropic*  
*Project: CV Optimizer | Eigenaar: Peter de Swart | v1.0 — mei 2026*
