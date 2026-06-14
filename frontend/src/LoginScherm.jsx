import { useAuth } from './AuthContext'

// ─── Iconen ──────────────────────────────────────────────────────────────────
function IcoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ─── Stap component ───────────────────────────────────────────────────────────
function Stap({ nummer, titel, beschrijving, placeholder }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ backgroundColor: '#1D4ED8', color: 'white' }}>
        {nummer}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-0.5" style={{ color: '#E2E8F0' }}>{titel}</p>
        <p className="text-xs" style={{ color: '#64748B' }}>{beschrijving}</p>
        {placeholder && (
          <div className="mt-3 rounded-xl flex items-center justify-center text-xs"
            style={{ height: '120px', backgroundColor: '#080F1E', border: '1px dashed #1E3A5F', color: '#334155' }}>
            Screenshot volgt hier
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function LoginScherm() {
  const { inloggen } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#080F1E' }}>

      {/* ── Header ── */}
      <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid #1E3A5F', backgroundColor: '#080F1E' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1D4ED8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="font-semibold text-sm" style={{ color: '#F1F5F9' }}>CV Optimizer</span>
        </div>
        <a href="/security"
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{ color: '#64748B' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Privacy & Beveiliging
        </a>
      </div>

      {/* ── Inhoud ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* ── Hero ── */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ color: '#F1F5F9' }}>
              Verbeter je CV met AI
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Upload je CV en een vacature. Claude analyseert de match, identificeert ontbrekende keywords en schrijft sectie voor sectie concrete verbeteringen.
            </p>
          </div>

          {/* ── Login kaart ── */}
          <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#0F1A2E', border: '1px solid #1E3A5F' }}>
            <button
              onClick={inloggen}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 mb-3 flex items-center justify-center gap-2 text-sm"
              style={{ backgroundColor: '#1D4ED8' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Inloggen
            </button>

            <a
              href="mailto:peter@pdscloud.nl?subject=Toegang aanvragen CV Optimizer&body=Hoi Peter, ik wil graag toegang tot de CV Optimizer. Mijn naam: Mijn organisatie: Met vriendelijke groet"
              className="w-full py-3 rounded-xl font-medium transition-opacity hover:opacity-80 flex items-center justify-center gap-2 text-sm"
              style={{ backgroundColor: 'transparent', color: '#60A5FA', border: '1px solid #1E3A5F' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Toegang aanvragen
            </a>

            <p className="text-xs text-center mt-3" style={{ color: '#334155' }}>
              Account wordt geactiveerd na goedkeuring van de beheerder
            </p>
          </div>

          {/* ── Security badges ── */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['AVG-compliant', 'AES-256 encryptie', 'Zero Trust', 'Geen advertenties'].map(label => (
              <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#064E3B', color: '#34D399' }}>
                <IcoCheck />{label}
              </span>
            ))}
          </div>

          {/* ── Scheidingslijn ── */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1E3A5F' }} />
            <span className="text-xs" style={{ color: '#334155' }}>Zo werkt het</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1E3A5F' }} />
          </div>

          {/* ── Stappen ── */}
          <div className="flex flex-col gap-3">
            <Stap
              nummer="1"
              titel="CV uploaden of plakken"
              beschrijving="Upload een PDF of DOCX, of plak je CV-tekst direct in de tool"
              placeholder
            />
            <Stap
              nummer="2"
              titel="Vacature invoeren"
              beschrijving="Kopieer de vacaturetekst erin en klik op Analyseer"
              placeholder
            />
            <Stap
              nummer="3"
              titel="Match score & keywords"
              beschrijving="Claude analyseert de match en toont ontbrekende keywords"
              placeholder
            />
            <Stap
              nummer="4"
              titel="Sectie voor sectie verbeteren"
              beschrijving="Claude schrijft concrete verbeteringen per sectie"
              placeholder
            />
            <Stap
              nummer="5"
              titel="Exporteren als Word of PDF"
              beschrijving="Download je verbeterde CV direct"
            />
          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-4 text-center text-xs flex-shrink-0"
        style={{ borderTop: '1px solid #1E3A5F', color: '#334155' }}>
        CV Optimizer · peter@pdscloud.nl ·{' '}
        <a href="/security" className="hover:underline" style={{ color: '#475569' }}>
          Privacy & Beveiliging
        </a>
      </div>

    </div>
  )
}
