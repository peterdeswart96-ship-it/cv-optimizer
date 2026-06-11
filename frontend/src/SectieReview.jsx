import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { tekst2Blokken, renderBlokken } from './cvUtils'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

// ─── Mini CV-sectie preview ──────────────────────────────────────────────────
// Toont een sectie precies zoals die in CVPreview er uit ziet
function CvSectiePreview({ naam, tekst, highlight = false }) {
  const blokken = tekst2Blokken(tekst)

  return (
    <div style={{
      fontFamily: "'Arial', 'Helvetica', sans-serif",
      border: highlight ? '2px solid #1a3a5c' : '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#ffffff'
    }}>
      {/* Sectie titel — zelfde stijl als CVPreview */}
      <div style={{
        borderBottom: '1.5px solid #1a3a5c',
        padding: '8px 12px 5px 12px',
        backgroundColor: highlight ? '#f0f5ff' : '#fafbfc'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: '#1a3a5c',
          letterSpacing: '0.8px',
          textTransform: 'uppercase'
        }}>
          {naam}
        </span>
        {highlight && (
          <span style={{
            marginLeft: '8px',
            fontSize: '9px',
            color: '#3b82f6',
            fontWeight: 'normal',
            letterSpacing: '0'
          }}>
            verbeterde versie
          </span>
        )}
      </div>

      {/* Sectie inhoud */}
      <div style={{ padding: '8px 12px 10px 12px' }}>
        {blokken.length === 0 ? (
          <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
            Geen inhoud
          </span>
        ) : (
          renderBlokken(blokken, 'preview')
        )}
      </div>
    </div>
  )
}

// ─── Layout feedback badge ───────────────────────────────────────────────────
function LayoutFeedbackBadge({ items }) {
  if (!items || items.length === 0) return null

  return (
    <div style={{
      backgroundColor: '#fffbeb',
      border: '1px solid #fbbf24',
      borderRadius: '8px',
      padding: '10px 12px',
      marginBottom: '12px'
    }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
        📐 Opmaak-tips
      </p>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {items.map((item, i) => (
          <li key={i} style={{
            fontSize: '11px',
            color: '#78350f',
            display: 'flex',
            gap: '6px',
            marginBottom: '3px'
          }}>
            <span style={{ color: '#f59e0b', flexShrink: 0 }}>→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Hoofd component ─────────────────────────────────────────────────────────
function SectieReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const {
    analyse,
    cvTekst,
    vacatureTekst,
    keywordContext,
    geselecteerdeKeywords,
    keywordSecties
  } = location.state || {}

  const [huidigeSectieIndex, setHuidigeSectieIndex] = useState(0)
  const [sectieAnalyse, setSectieAnalyse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState(null)
  const [aangepasteTekst, setAangepasteTekst] = useState('')
  const [eigenInstructie, setEigenInstructie] = useState('')
  const [toonEigenInstructie, setToonEigenInstructie] = useState(false)
  const [toonBewerken, setToonBewerken] = useState(false)
  const [definitieveTeksten, setDefinitieveTeksten] = useState({})
  const [klaar, setKlaar] = useState(false)

  if (!analyse || !analyse.secties || analyse.secties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Geen analyse gevonden. Doe eerst een analyse.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← Terug naar analyse
          </button>
        </div>
      </div>
    )
  }

  const secties = analyse.secties
  const huidigeSectie = secties[huidigeSectieIndex]
  const totaalSecties = secties.length
  const isLaatsteSectie = huidigeSectieIndex === totaalSecties - 1

  // Huidige tekst van de sectie (na eventuele aanpassingen)
  const huidigeTekst = definitieveTeksten[huidigeSectie.naam] ?? huidigeSectie.originele_tekst ?? ''

  // ── Sectie analyseren ──────────────────────────────────────────────────────
  const analyseerSectie = async () => {
    setLoading(true)
    setFout(null)
    setSectieAnalyse(null)
    setAangepasteTekst('')
    setToonEigenInstructie(false)
    setEigenInstructie('')
    setToonBewerken(false)

    try {
      const token = await getToken()
      const response = await fetch(`${BACKEND}/analyze-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sectie_naam: huidigeSectie.naam,
          sectie_inhoud: huidigeSectie.originele_tekst,
          vacature_tekst: vacatureTekst,
          ontbrekende_keywords: analyse.ontbrekende_keywords,
          tone_aanbeveling: analyse.tone_aanbeveling,
          keyword_context: keywordContext || '',
          layout_analyse: true   // ← nieuw vlag voor backend
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Er ging iets mis')

      setSectieAnalyse(data)

    } catch (err) {
      setFout(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Eigen instructie verwerken ─────────────────────────────────────────────
  const verwerkEigenInstructie = async () => {
    setLoading(true)
    setFout(null)

    try {
      const token = await getToken()
      const response = await fetch(`${BACKEND}/analyze-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sectie_naam: huidigeSectie.naam,
          sectie_inhoud: huidigeSectie.originele_tekst,
          vacature_tekst: vacatureTekst,
          eigen_instructie: eigenInstructie
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Er ging iets mis')

      setAangepasteTekst(data.herschreven || '')
      setToonBewerken(false)

    } catch (err) {
      setFout(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Opslaan en doorgaan ────────────────────────────────────────────────────
  const slaOpEnVerder = (tekst) => {
    const nieuweDefinitieveTeksten = {
      ...definitieveTeksten,
      [huidigeSectie.naam]: tekst
    }
    setDefinitieveTeksten(nieuweDefinitieveTeksten)

    if (isLaatsteSectie) {
      setKlaar(true)
    } else {
      setHuidigeSectieIndex(huidigeSectieIndex + 1)
      setSectieAnalyse(null)
      setAangepasteTekst('')
      setToonEigenInstructie(false)
      setToonBewerken(false)
      setEigenInstructie('')
    }
  }

  // ── Klaar scherm ───────────────────────────────────────────────────────────
  if (klaar) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">CV Optimizer</h1>
          <p className="text-sm text-gray-500 mt-1">Sectie review voltooid</p>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Je CV is verbeterd!</h2>
            <p className="text-sm text-green-700">Je hebt alle {totaalSecties} secties doorlopen.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Overzicht wijzigingen</h2>
            <div className="space-y-3">
              {secties.map((sectie, i) => {
                const gewijzigd = definitieveTeksten[sectie.naam] &&
                  definitieveTeksten[sectie.naam] !== sectie.originele_tekst
                return (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-700">{sectie.naam}</p>
                      {gewijzigd ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Aangepast</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Ongewijzigd</span>
                      )}
                    </div>
                    {definitieveTeksten[sectie.naam] && (
                      <p className="text-xs text-gray-400 font-mono mt-1 truncate">
                        {definitieveTeksten[sectie.naam].substring(0, 100)}…
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Nieuwe analyse
            </button>
            <button
              onClick={() => navigate('/cv-preview', {
                state: { secties, definitieveTeksten, cvTekst }
              })}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Bekijk en download CV →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Keyword context banner ─────────────────────────────────────────────────
  const keywordsVoorDezeSectie = (() => {
    if (!keywordSecties || !geselecteerdeKeywords) return []
    return geselecteerdeKeywords.filter(kw => keywordSecties[kw] === huidigeSectie.naam)
  })()

  // ── Hoofd render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV Sectie Review</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sectie {huidigeSectieIndex + 1} van {totaalSecties}
            </p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">
            ← Terug naar analyse
          </button>
        </div>

        {/* Voortgangsbalk */}
        <div className="max-w-3xl mx-auto mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((huidigeSectieIndex) / totaalSecties) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {secties.map((sectie, i) => (
              <span key={i} className={`text-xs ${
                i === huidigeSectieIndex
                  ? 'text-blue-600 font-medium'
                  : i < huidigeSectieIndex
                    ? 'text-green-600'
                    : 'text-gray-400'
              }`}>
                {i < huidigeSectieIndex ? '✓' : i === huidigeSectieIndex ? '◉' : '○'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* ── Huidige sectie preview ── */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Huidige versie
          </p>
          <CvSectiePreview naam={huidigeSectie.naam} tekst={huidigeTekst} />
        </div>

        {/* Keyword context banner */}
        {keywordsVoorDezeSectie.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ Je wil deze keywords toevoegen aan <strong>{huidigeSectie.naam}</strong>
            </p>
            <ul className="space-y-1">
              {keywordsVoorDezeSectie.map((keyword, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <span className="text-amber-500 flex-shrink-0 mt-0.5">→</span>
                  <span><strong>{keyword}</strong></span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analyseer + overslaan knoppen */}
        {!sectieAnalyse && !loading && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => slaOpEnVerder(huidigeSectie.originele_tekst)}
              className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Sla sectie over →
            </button>
            <button
              onClick={analyseerSectie}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyseer deze sectie
            </button>
          </div>
        )}

        {/* Laad indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-gray-500 text-sm">Claude analyseert...</p>
          </div>
        )}

        {/* Foutmelding */}
        {fout && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{fout}</p>
          </div>
        )}

        {/* ── Analyse resultaten ── */}
        {sectieAnalyse && (
          <div className="space-y-5">

            {/* Sterke punten + verbeterpunten */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Analyse</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase mb-2">Sterke punten</p>
                  <ul className="space-y-1">
                    {(sectieAnalyse.analyse?.sterke_punten || sectieAnalyse.sterkePunten || []).map((punt, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-500 flex-shrink-0">✓</span>{punt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase mb-2">Verbeterpunten</p>
                  <ul className="space-y-1">
                    {(sectieAnalyse.analyse?.zwakke_punten || sectieAnalyse.verbeterpunten || []).map((punt, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-red-400 flex-shrink-0">→</span>{punt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {(sectieAnalyse.analyse?.redenering || sectieAnalyse.relevantie) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-700 uppercase mb-1">Redenering</p>
                  <p className="text-sm text-blue-800">
                    {sectieAnalyse.analyse?.redenering || sectieAnalyse.relevantie}
                  </p>
                </div>
              )}
            </div>

            {/* ── Keuzes ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Wat wil je doen?</h3>
              <div className="space-y-4">

                {/* Optie 1: Ongewijzigd */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => slaOpEnVerder(huidigeSectie.originele_tekst)}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-medium text-gray-700">① Ongewijzigd laten</p>
                    <p className="text-xs text-gray-400 mt-1">Huidige tekst behouden en doorgaan</p>
                  </button>
                </div>

                {/* Optie 2: Verbeterde versie van Claude — als CV-preview */}
                {(sectieAnalyse.herschreven || sectieAnalyse.varianten?.[0]?.tekst) && (() => {
                  const verbeterdeTekst = sectieAnalyse.herschreven || sectieAnalyse.varianten?.[0]?.tekst
                  return (
                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
                      <p className="text-sm font-medium text-blue-800">② Verbeterde versie</p>

                      {/* Layout feedback als die er is */}
                      <LayoutFeedbackBadge items={sectieAnalyse.layout_tips} />

                      {/* CV-preview van de verbeterde tekst */}
                      <CvSectiePreview
                        naam={huidigeSectie.naam}
                        tekst={verbeterdeTekst}
                        highlight={true}
                      />

                      <button
                        onClick={() => {
                          setAangepasteTekst(verbeterdeTekst)
                          setToonBewerken(false)
                        }}
                        className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Gebruik deze versie →
                      </button>
                    </div>
                  )
                })()}

                {/* Optie 3: Eigen instructie */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => setToonEigenInstructie(!toonEigenInstructie)}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-medium text-gray-700">③ Anders, namelijk...</p>
                    <p className="text-xs text-gray-400 mt-1">Geef eigen instructies aan Claude</p>
                  </button>
                  {toonEigenInstructie && (
                    <div className="mt-3">
                      <textarea
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bijv: Maak het compacter en voeg mijn certificeringen toe..."
                        value={eigenInstructie}
                        onChange={(e) => setEigenInstructie(e.target.value)}
                      />
                      <button
                        onClick={verwerkEigenInstructie}
                        disabled={!eigenInstructie || loading}
                        className="mt-2 px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        Verwerk instructie
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── Bewerkbare preview (na keuze ② of ③) ── */}
            {aangepasteTekst && (
              <div className="bg-white rounded-xl border border-green-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-800">Bewerken & opslaan</h3>
                  <button
                    onClick={() => setToonBewerken(!toonBewerken)}
                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {toonBewerken ? 'Verberg teksteditor' : '✏️ Tekst aanpassen'}
                  </button>
                </div>

                {/* CV-preview van de gekozen tekst */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
                  <CvSectiePreview naam={huidigeSectie.naam} tekst={aangepasteTekst} />
                </div>

                {/* Teksteditor — optioneel zichtbaar */}
                {toonBewerken && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">
                      Pas de tekst aan. Gebruik enters voor nieuwe regels, begin een regel met • voor bullets.
                    </p>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                      style={{
                        minHeight: `${Math.max(120, (aangepasteTekst.split('\n').length + 4) * 22)}px`
                      }}
                      value={aangepasteTekst}
                      onChange={(e) => setAangepasteTekst(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => slaOpEnVerder(aangepasteTekst)}
                    className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {isLaatsteSectie ? 'Opslaan en afronden ✓' : 'Opslaan en volgende sectie →'}
                  </button>
                  <button
                    onClick={() => { setAangepasteTekst(''); setToonBewerken(false) }}
                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

export default SectieReview
