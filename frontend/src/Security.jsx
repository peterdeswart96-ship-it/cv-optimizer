import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function isDonker(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 150
}

// ─── Iconen als inline SVG ────────────────────────────────────────────────────
function IcoSlot({ children }) {
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: '#1E3A5F' }}>
      {children}
    </div>
  )
}

function IcoSleutel() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="17" r="3"/><path d="M10.5 13.5 21 3"/><path d="m19 5 1 1"/><path d="m17 7 1 1"/></svg></IcoSlot>
}
function IcoSlot2() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></IcoSlot>
}
function IcoDatabase() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg></IcoSlot>
}
function IcoGlobe() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></IcoSlot>
}
function IcoGebruiker() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></IcoSlot>
}
function IcoKlok() {
  return <IcoSlot><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></IcoSlot>
}
function IcoCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}

// ─── Sectie-componenten ───────────────────────────────────────────────────────
function Sectie({ id, titel, children }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-xl font-semibold mb-6" style={{ color: '#F1F5F9' }}>{titel}</h2>
      {children}
    </section>
  )
}

function BeveiligingsKaart({ ico, titel, beschrijving }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
      {ico}
      <div>
        <p className="font-medium text-sm mb-1" style={{ color: '#E2E8F0' }}>{titel}</p>
        <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{beschrijving}</p>
      </div>
    </div>
  )
}

function DatastroomRij({ van, naar, data, versleuteld }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #1E3A5F' }}>
      <div className="text-sm font-medium w-32 flex-shrink-0" style={{ color: '#60A5FA' }}>{van}</div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      <div className="text-sm font-medium w-32 flex-shrink-0" style={{ color: '#60A5FA' }}>{naar}</div>
      <div className="text-sm flex-1" style={{ color: '#94A3B8' }}>{data}</div>
      <div className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: versleuteld ? '#064E3B' : '#1E3A5F', color: versleuteld ? '#34D399' : '#94A3B8' }}>
        {versleuteld ? 'TLS 1.2+' : 'intern'}
      </div>
    </div>
  )
}

function SubverwerkerKaart({ naam, dienst, locatie, dpa, link }) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
      <div className="flex items-start justify-between mb-2">
        <p className="font-medium text-sm" style={{ color: '#E2E8F0' }}>{naam}</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#064E3B', color: '#34D399' }}>{dpa}</span>
      </div>
      <p className="text-sm mb-1" style={{ color: '#94A3B8' }}>{dienst}</p>
      <p className="text-xs" style={{ color: '#475569' }}>{locatie}</p>
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 inline-block hover:underline" style={{ color: '#60A5FA' }}>{link}</a>}
    </div>
  )
}

function FaqItem({ vraag, antwoord }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A5F' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? '#0F1A2E' : '#080F1E' }}
      >
        <span className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{vraag}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-5 py-4" style={{ backgroundColor: '#0F1A2E', borderTop: '1px solid #1E3A5F' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{antwoord}</p>
        </div>
      )}
    </div>
  )
}

// ─── Navigatie ankers ─────────────────────────────────────────────────────────
const ANKERS = [
  { id: 'beveiliging', label: 'Beveiliging' },
  { id: 'datastromen', label: 'Datastromen' },
  { id: 'subverwerkers', label: 'Sub-verwerkers' },
  { id: 'rechten', label: 'Uw rechten' },
  { id: 'faq', label: 'FAQ' },
  { id: 'privacyverklaring', label: 'Privacyverklaring' },
]

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function Security() {
  const navigate = useNavigate()
  const primaireTekstKleur = '#FFFFFF'

  const scrollNaar = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080F1E' }}>

      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: '#1D4ED8' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="opacity-80 hover:opacity-100 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="font-semibold text-white">Privacy & Beveiliging</span>
          </div>
        </div>
        <span className="text-sm opacity-70" style={{ color: 'white' }}>
          cv-optimizer.pdscloud.nl
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-10 p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1E3A5F 100%)', border: '1px solid #1E3A5F' }}>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1D4ED8' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#F1F5F9' }}>
                Hoe CV Optimizer uw gegevens beschermt
              </h1>
              <p className="leading-relaxed" style={{ color: '#94A3B8' }}>
                Uw CV bevat persoonlijke informatie. Op deze pagina leggen we precies uit welke gegevens we verwerken,
                hoe we die beveiligen, met wie we ze delen en welke rechten u heeft. Geen kleine lettertjes.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {[
                  'AVG-compliant',
                  'AES-256 encryptie',
                  'Zero Trust architectuur',
                  'Geen advertenties',
                ].map(label => (
                  <span key={label} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#064E3B', color: '#34D399' }}>
                    <IcoCheck />{label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inhoudsopgave */}
        <div className="flex flex-wrap gap-2 mb-10">
          {ANKERS.map(({ id, label }) => (
            <button key={id} onClick={() => scrollNaar(id)}
              className="text-sm px-4 py-1.5 rounded-full transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0F1A2E', color: '#60A5FA', border: '1px solid #1E3A5F' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── SECTIE 1: Beveiligingsmaatregelen ── */}
        <Sectie id="beveiliging" titel="Beveiligingsmaatregelen">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <BeveiligingsKaart
              ico={<IcoSleutel />}
              titel="JWT-tokenvalidatie op alle endpoints"
              beschrijving="Elke API-aanroep vereist een geldig inlogtoken. Niet-ingelogde gebruikers krijgen geen toegang, ook niet via directe URL-aanroepen."
            />
            <BeveiligingsKaart
              ico={<IcoSlot2 />}
              titel="Managed Identity — geen opgeslagen sleutels"
              beschrijving="De server gebruikt Azure Managed Identity om toegang te krijgen tot opslag. Er zijn geen wachtwoorden of API-sleutels opgeslagen in de code of configuratie."
            />
            <BeveiligingsKaart
              ico={<IcoDatabase />}
              titel="AES-256 encryptie at-rest"
              beschrijving="Alle opgeslagen bestanden (CV's, sessies, branding) zijn versleuteld op Azure Blob Storage met AES-256. Microsoft beheert de sleutels."
            />
            <BeveiligingsKaart
              ico={<IcoGlobe />}
              titel="TLS 1.2+ encryptie in transit"
              beschrijving="Alle communicatie tussen uw browser, onze servers en externe diensten verloopt via HTTPS met minimaal TLS 1.2. Oudere protocollen zijn uitgeschakeld."
            />
            <BeveiligingsKaart
              ico={<IcoGebruiker />}
              titel="Strikte CORS-beveiliging"
              beschrijving="De API accepteert uitsluitend aanroepen van cv-optimizer.pdscloud.nl. Andere websites kunnen uw gegevens niet opvragen via onze API."
            />
            <BeveiligingsKaart
              ico={<IcoKlok />}
              titel="Automatische verwijdering na 90 dagen"
              beschrijving="CV-bestanden en sessiegegevens worden automatisch verwijderd na 90 dagen inactiviteit. U hoeft hier niets voor te doen."
            />
          </div>
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#E2E8F0' }}>Wat we niet doen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                'CV-inhoud loggen in technische logbestanden',
                'Gegevens verkopen aan derden',
                'Advertentiecookies of tracking gebruiken',
                'CV-gegevens gebruiken voor AI-training',
                'Wachtwoorden of sleutels in code opslaan',
                'Toegang geven zonder geldig inlogtoken',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-sm" style={{ color: '#94A3B8' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </Sectie>

        {/* ── SECTIE 2: Datastromen ── */}
        <Sectie id="datastromen" titel="Hoe uw gegevens stromen">
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#94A3B8' }}>
            Onderstaand diagram toont precies welke gegevens waarheen gaan bij een CV-analyse.
            Uw CV-tekst verlaat Nederland alleen voor de AI-analyse bij Anthropic — dit is contractueel vastgelegd via Standard Contractual Clauses.
          </p>

          {/* Architectuurdiagram */}
          <div className="rounded-xl p-5 mb-4" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
            <div className="flex flex-col items-center gap-2 text-sm">

              {/* Browser */}
              <div className="w-full max-w-xs px-4 py-3 rounded-lg text-center font-medium"
                style={{ backgroundColor: '#1E3A5F', color: '#E2E8F0', border: '1px solid #2563EB' }}>
                🖥️ Uw browser (Nederland)
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <svg width="2" height="20" viewBox="0 0 2 20"><line x1="1" y1="0" x2="1" y2="20" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 2"/></svg>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#064E3B', color: '#34D399' }}>HTTPS + JWT-token</span>
                <svg width="2" height="20" viewBox="0 0 2 20"><line x1="1" y1="0" x2="1" y2="20" stroke="#2563EB" strokeWidth="2" strokeDasharray="4 2"/></svg>
              </div>

              {/* Azure Functions */}
              <div className="w-full max-w-xs px-4 py-3 rounded-lg text-center font-medium"
                style={{ backgroundColor: '#1E3A5F', color: '#E2E8F0', border: '1px solid #2563EB' }}>
                ⚡ Azure Functions (West Europe)
              </div>

              {/* Splitsing */}
              <div className="flex items-start gap-8 mt-2">
                <div className="flex flex-col items-center gap-1">
                  <svg width="2" height="16" viewBox="0 0 2 16"><line x1="1" y1="0" x2="1" y2="16" stroke="#475569" strokeWidth="2" strokeDasharray="3 2"/></svg>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1E3A5F', color: '#94A3B8' }}>opslag</span>
                  <svg width="2" height="16" viewBox="0 0 2 16"><line x1="1" y1="0" x2="1" y2="16" stroke="#475569" strokeWidth="2" strokeDasharray="3 2"/></svg>
                  <div className="px-4 py-2 rounded-lg text-center text-xs font-medium"
                    style={{ backgroundColor: '#0A1628', color: '#94A3B8', border: '1px solid #1E3A5F' }}>
                    🗄️ Azure Blob Storage<br /><span style={{ color: '#475569' }}>EU — versleuteld</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <svg width="2" height="16" viewBox="0 0 2 16"><line x1="1" y1="0" x2="1" y2="16" stroke="#D97706" strokeWidth="2" strokeDasharray="3 2"/></svg>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#451A03', color: '#FCD34D' }}>CV-tekst via SCCs</span>
                  <svg width="2" height="16" viewBox="0 0 2 16"><line x1="1" y1="0" x2="1" y2="16" stroke="#D97706" strokeWidth="2" strokeDasharray="3 2"/></svg>
                  <div className="px-4 py-2 rounded-lg text-center text-xs font-medium"
                    style={{ backgroundColor: '#0A1628', color: '#94A3B8', border: '1px solid #92400E' }}>
                    🤖 Anthropic Claude<br /><span style={{ color: '#475569' }}>San Francisco — DPA + SCCs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1E3A5F' }}>
            <div className="px-4 py-2 text-xs font-medium" style={{ backgroundColor: '#0F1A2E', color: '#475569' }}>
              DATASTROOM DETAILS
            </div>
            <div className="px-4" style={{ backgroundColor: '#080F1E' }}>
              <DatastroomRij van="Browser" naar="Azure API" data="CV-tekst, vacaturetekst, JWT-token" versleuteld={true} />
              <DatastroomRij van="Azure API" naar="Blob Storage" data="CV-bestand opslaan (indien gekozen)" versleuteld={false} />
              <DatastroomRij van="Azure API" naar="Anthropic" data="CV-tekst en vacaturetekst (geen accountgegevens)" versleuteld={true} />
              <DatastroomRij van="Anthropic" naar="Azure API" data="Analyse-resultaat (JSON)" versleuteld={true} />
              <DatastroomRij van="Azure API" naar="Browser" data="Analyse-resultaat (JSON)" versleuteld={true} />
            </div>
          </div>
        </Sectie>

        {/* ── SECTIE 3: Sub-verwerkers ── */}
        <Sectie id="subverwerkers" titel="Sub-verwerkers">
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#94A3B8' }}>
            We werken met de volgende externe partijen. Met elke partij die persoonsgegevens verwerkt is een verwerkersovereenkomst (DPA) gesloten conform Art. 28 AVG.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SubverwerkerKaart
              naam="Microsoft Azure"
              dienst="Blob Storage (CV-opslag) en Entra External ID (authenticatie)"
              locatie="West Europe — gegevens blijven binnen de EU"
              dpa="DPA aanwezig"
              link="https://learn.microsoft.com/nl-nl/compliance/regulatory/gdpr"
            />
            <SubverwerkerKaart
              naam="Anthropic"
              dienst="Claude API — AI-analyse van CV-inhoud"
              locatie="San Francisco, VS — doorgifte via Standard Contractual Clauses (Art. 46 AVG)"
              dpa="DPA + SCCs"
              link="https://www.anthropic.com/privacy"
            />
            <SubverwerkerKaart
              naam="GitHub Pages"
              dienst="Hosting van de webapplicatie (statische bestanden)"
              locatie="Geen persoonsgegevens verwerkt"
              dpa="Niet van toepassing"
            />
            <SubverwerkerKaart
              naam="TransIP"
              dienst="DNS-beheer voor pdscloud.nl"
              locatie="Nederland — geen persoonsgegevens verwerkt"
              dpa="Niet van toepassing"
            />
          </div>
        </Sectie>

        {/* ── SECTIE 4: Rechten ── */}
        <Sectie id="rechten" titel="Uw rechten onder de AVG">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { recht: 'Recht op inzage', uitleg: 'Opvragen welke gegevens we van u hebben.' },
              { recht: 'Recht op rectificatie', uitleg: 'Onjuiste gegevens laten corrigeren.' },
              { recht: 'Recht op vergetelheid', uitleg: 'Al uw gegevens laten verwijderen.' },
              { recht: 'Recht op beperking', uitleg: 'Verwerking tijdelijk laten beperken.' },
              { recht: 'Dataportabiliteit', uitleg: 'Uw gegevens opvragen als JSON-bestand.' },
              { recht: 'Recht van bezwaar', uitleg: 'Bezwaar maken tegen verwerking.' },
            ].map(({ recht, uitleg }) => (
              <div key={recht} className="flex items-start gap-3 p-4 rounded-xl"
                style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
                <IcoCheck />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{recht}</p>
                  <p className="text-sm" style={{ color: '#94A3B8' }}>{uitleg}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#E2E8F0' }}>Verzoek indienen</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Stuur een e-mail naar{' '}
              <a href="mailto:peter@pdscloud.nl" className="hover:underline" style={{ color: '#60A5FA' }}>
                peter@pdscloud.nl
              </a>
              {' '}— we reageren binnen 4 weken. U heeft ook het recht om een klacht in te dienen bij de{' '}
              <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#60A5FA' }}>
                Autoriteit Persoonsgegevens
              </a>.
            </p>
          </div>
        </Sectie>

        {/* ── SECTIE 5: FAQ ── */}
        <Sectie id="faq" titel="Veelgestelde vragen">
          <div className="flex flex-col gap-2">
            <FaqItem
              vraag="Wordt mijn CV gebruikt om AI-modellen te trainen?"
              antwoord="Nee. We gebruiken de Claude API van Anthropic via een commercieel plan met een Data Processing Agreement. Anthropic gebruikt gegevens die via de API worden verwerkt niet voor het trainen van hun modellen. Dit is contractueel vastgelegd."
            />
            <FaqItem
              vraag="Waar worden mijn CV-bestanden opgeslagen?"
              antwoord="Uw CV-bestanden worden opgeslagen op Azure Blob Storage in West Europe (EU). De gegevens verlaten de EU niet voor opslag. Alleen voor de AI-analyse wordt uw CV-tekst tijdelijk verwerkt door Anthropic in de VS, op basis van Standard Contractual Clauses."
            />
            <FaqItem
              vraag="Hoe lang worden mijn gegevens bewaard?"
              antwoord="CV-bestanden en sessiegegevens worden automatisch verwijderd na 90 dagen inactiviteit. Accountgegevens worden bewaard zolang uw account actief is, of maximaal 2 jaar na uw laatste login. U kunt op elk moment uw account en alle gegevens laten verwijderen."
            />
            <FaqItem
              vraag="Wie kan mijn CV-bestanden inzien?"
              antwoord="Alleen u kunt uw eigen CV-bestanden inzien. De toegangscontrole is gebaseerd op uw inlogtoken — de server verifieert bij elke aanroep dat u alleen toegang krijgt tot bestanden die gekoppeld zijn aan uw eigen gebruikers-ID. Wij (Peter de Swart) hebben als systeembeheerder technisch toegang tot de opslag, maar raadplegen uw bestanden niet."
            />
            <FaqItem
              vraag="Wat gebeurt er met mijn gegevens als ik mijn account verwijder?"
              antwoord="Bij het verwijderen van uw account worden alle gekoppelde CV-bestanden, sessiegegevens en accountgegevens permanent verwijderd. Stuur hiervoor een e-mail naar peter@pdscloud.nl. We verwerken uw verzoek binnen 4 weken."
            />
            <FaqItem
              vraag="Gebruikt CV Optimizer cookies of tracking?"
              antwoord="Nee. CV Optimizer gebruikt geen tracking cookies, advertentiecookies of analytics van derden. De enige opslag in uw browser is technisch noodzakelijk voor het inloggen (sessie-informatie via MSAL van Microsoft)."
            />
            <FaqItem
              vraag="Is de verbinding met CV Optimizer beveiligd?"
              antwoord="Ja. Alle communicatie verloopt via HTTPS met minimaal TLS 1.2. De verbinding is ook beveiligd met een Content Security Policy (CSP) die voorkomt dat externe scripts worden geladen, en een X-Frame-Options header die clickjacking-aanvallen blokkeert."
            />
            <FaqItem
              vraag="Wat is het verschil tussen Anthropic verwerkt mijn CV en Anthropic traint op mijn CV?"
              antwoord="Verwerken betekent dat uw CV-tekst tijdelijk wordt gelezen om een analyse te genereren — vergelijkbaar met hoe een tekstverwerker een document opent. Trainen betekent dat de inhoud wordt gebruikt om een AI-model slimmer te maken. Via de commerciële API geldt het eerste, niet het tweede. Anthropic's DPA bevestigt dit expliciet."
            />
          </div>
        </Sectie>

        {/* ── SECTIE 6: Privacyverklaring ── */}
        <Sectie id="privacyverklaring" titel="Privacyverklaring">
          <div className="prose max-w-none">
            {[
              {
                kop: '1. Wie zijn wij?',
                tekst: 'CV Optimizer is een webapplicatie ontwikkeld en beheerd door Peter de Swart (peter@pdscloud.nl). Peter is de verwerkingsverantwoordelijke in de zin van de AVG voor alle gegevensverwerking die plaatsvindt via cv-optimizer.pdscloud.nl.'
              },
              {
                kop: '2. Welke gegevens verwerken wij?',
                tekst: 'Wij verwerken: accountgegevens (e-mailadres, naam, organisatie), de inhoud van uw CV en de vacaturetekst die u invoert, en technische gebruiksgegevens (tijdstip, statuscode — zonder CV-inhoud). Uw CV kan bijzondere persoonsgegevens bevatten. Wij verzoeken u geen onnodige bijzondere gegevens op te nemen.'
              },
              {
                kop: '3. Rechtsgrond',
                tekst: 'Verwerking van accountgegevens en CV-analyse: uitvoering van een overeenkomst (Art. 6 lid 1 sub b AVG). Tonen organisatiehuisstijl: gerechtvaardigd belang (Art. 6 lid 1 sub f AVG).'
              },
              {
                kop: '4. Doorgifte buiten de EU',
                tekst: 'De tekst van uw CV wordt voor analyse verwerkt door Anthropic (VS). De juridische grondslag is Standard Contractual Clauses conform Art. 46 lid 2 sub c AVG. Alle overige verwerking vindt plaats binnen de EU (Azure West Europe).'
              },
              {
                kop: '5. Bewaartermijnen',
                tekst: 'CV-bestanden en sessies: 90 dagen na laatste gebruik. Accountgegevens: tot verwijdering of 2 jaar inactiviteit. Technische logs: maximaal 90 dagen.'
              },
              {
                kop: '6. Uw rechten',
                tekst: 'U heeft recht op inzage, rectificatie, vergetelheid, beperking, dataportabiliteit en bezwaar. Verzoeken kunt u indienen via peter@pdscloud.nl. U kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens (www.autoriteitpersoonsgegevens.nl).'
              },
              {
                kop: '7. Wijzigingen',
                tekst: 'Deze verklaring kan worden aangepast bij wijzigingen in de dienstverlening of wetgeving. De actuele versie staat altijd op deze pagina. Versie 1.0 — 9 juni 2026.'
              },
            ].map(({ kop, tekst }) => (
              <div key={kop} className="mb-5 p-5 rounded-xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#60A5FA' }}>{kop}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{tekst}</p>
              </div>
            ))}
          </div>
        </Sectie>

        {/* Footer */}
        <div className="pt-6 mt-6 text-center text-xs" style={{ borderTop: '1px solid #1E3A5F', color: '#475569' }}>
          CV Optimizer — peter@pdscloud.nl — Versie 1.0 — 9 juni 2026
        </div>

      </div>
    </div>
  )
}
