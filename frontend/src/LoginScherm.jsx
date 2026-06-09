import { useState } from 'react'
import { useAuth } from './AuthContext'
import { screenshot_invoer, screenshot_analyse, screenshot_sectie } from './screenshots'

function IcoCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function IcoSlot() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function IcoSlot2() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function IcoAI() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10"/>
      <path d="M12 8v4l3 3"/>
      <path d="M18 2v4h4"/>
    </svg>
  )
}

function IcoDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}

const SCREENSHOTS = [
  {
    src: screenshot_invoer,
    label: 'CV & vacature invoeren',
    beschrijving: 'Upload een PDF of DOCX, of plak je CV-tekst direct in de tool',
  },
  {
    src: screenshot_analyse,
    label: 'Match score & keywords',
    beschrijving: 'Zie direct welke keywords ontbreken en hoe sterk je match is',
  },
  {
    src: screenshot_sectie,
    label: 'Sectie-voor-sectie verbeteren',
    beschrijving: 'Claude analyseert elke sectie en schrijft concrete verbeteringen',
  },
]

export default function LoginScherm() {
  const { inloggen } = useAuth()
  const [actiefSchermshot, setActiefSchermshot] = useState(0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080F1E' }}>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1E3A5F' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1D4ED8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="font-semibold" style={{ color: '#F1F5F9' }}>CV Optimizer</span>
        </div>
        <a
          href="/security"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
          style={{ color: '#94A3B8' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Privacy & Beveiliging
        </a>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Linkerkolom — login + info */}
          <div>

            {/* Hero tekst */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-3 leading-tight" style={{ color: '#F1F5F9' }}>
                Verbeter je CV met AI
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: '#94A3B8' }}>
                Upload je CV en een vacature. Claude analyseert de match, identificeert ontbrekende keywords en schrijft sectie voor sectie concrete verbeteringen.
              </p>
            </div>

            {/* Login kaart */}
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
              <button
                onClick={inloggen}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 mb-3 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Inloggen
              </button>
              <a
                href="mailto:peter@pdscloud.nl?subject=Toegang aanvragen CV Optimizer&body=Hoi Peter, ik wil graag toegang tot de CV Optimizer. Mijn naam: Mijn organisatie: Met vriendelijke groet"
                className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-80 flex items-center justify-center gap-2 text-center"
                style={{ backgroundColor: '#0F1A2E', color: '#60A5FA', border: '1px solid #1E3A5F' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Toegang aanvragen
              </a>
              <p className="text-xs text-center mt-3" style={{ color: '#475569' }}>
                Account wordt geactiveerd na goedkeuring van de beheerder
              </p>
            </div>

            {/* Wat kun je doen */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-3" style={{ color: '#64748B' }}>WAT JE KUNT DOEN</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { ico: <IcoAI />, tekst: 'CV analyseren met Claude AI — match score en keywords' },
                  { ico: <IcoSlot2 />, tekst: 'Sectie voor sectie je CV verbeteren met concrete suggesties' },
                  { ico: <IcoDownload />, tekst: 'Verbeterd CV exporteren als Word of PDF' },
                  { ico: <IcoSlot />, tekst: 'CV\'s en vacatures opslaan voor hergebruik' },
                ].map(({ ico, tekst }) => (
                  <div key={tekst} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
                      {ico}
                    </div>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>{tekst}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Security blok */}
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1E3A5F 100%)', border: '1px solid #1E3A5F' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1D4ED8' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#E2E8F0' }}>Uw gegevens zijn veilig</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {['AVG-compliant', 'AES-256 encryptie', 'Zero Trust', 'Geen advertenties'].map(label => (
                  <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: '#064E3B', color: '#34D399' }}>
                    <IcoCheck />{label}
                  </span>
                ))}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                Uw CV-inhoud wordt niet gelogd, niet gebruikt voor AI-training en automatisch verwijderd na 90 dagen.{' '}
                <a href="/security" className="hover:underline" style={{ color: '#60A5FA' }}>
                  Meer over beveiliging →
                </a>
              </p>
            </div>

          </div>

          {/* Rechterkolom — screenshots */}
          <div>
            <p className="text-sm font-medium mb-4" style={{ color: '#64748B' }}>ZO WERKT HET</p>

            {/* Screenshot viewer */}
            <div className="rounded-2xl overflow-hidden mb-3" style={{ border: '1px solid #1E3A5F' }}>
              <img
                src={SCREENSHOTS[actiefSchermshot].src}
                alt={SCREENSHOTS[actiefSchermshot].label}
                className="w-full object-cover"
                style={{ maxHeight: '360px', objectPosition: 'top' }}
              />
              <div className="px-4 py-3" style={{ backgroundColor: '#0F1A2E' }}>
                <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>
                  {SCREENSHOTS[actiefSchermshot].label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                  {SCREENSHOTS[actiefSchermshot].beschrijving}
                </p>
              </div>
            </div>

            {/* Thumbnail navigatie */}
            <div className="flex gap-2 mb-8">
              {SCREENSHOTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiefSchermshot(i)}
                  className="flex-1 rounded-xl overflow-hidden transition-all"
                  style={{
                    border: actiefSchermshot === i ? '2px solid #1D4ED8' : '1px solid #1E3A5F',
                    opacity: actiefSchermshot === i ? 1 : 0.5
                  }}
                >
                  <img src={s.src} alt={s.label} className="w-full object-cover" style={{ height: '64px', objectPosition: 'top' }} />
                </button>
              ))}
            </div>

            {/* Stappen */}
            <div className="flex flex-col gap-3">
              {[
                { stap: '1', titel: 'CV uploaden of plakken', tekst: 'PDF, DOCX of gewoon tekst plakken' },
                { stap: '2', titel: 'Vacature invoeren', tekst: 'Kopieer de vacaturetekst erin' },
                { stap: '3', titel: 'Analyse starten', tekst: 'Claude vergelijkt en geeft een match score' },
                { stap: '4', titel: 'CV verbeteren', tekst: 'Sectie voor sectie concrete suggesties verwerken' },
                { stap: '5', titel: 'Exporteren', tekst: 'Download je verbeterde CV als Word of PDF' },
              ].map(({ stap, titel, tekst }) => (
                <div key={stap} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ backgroundColor: '#1D4ED8', color: 'white' }}>
                    {stap}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#E2E8F0' }}>{titel}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{tekst}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center text-xs" style={{ borderTop: '1px solid #1E3A5F', color: '#334155' }}>
        CV Optimizer • peter@pdscloud.nl •{' '}
        <a href="/security" className="hover:underline" style={{ color: '#475569' }}>Privacy & Beveiliging</a>
      </div>

    </div>
  )
}
