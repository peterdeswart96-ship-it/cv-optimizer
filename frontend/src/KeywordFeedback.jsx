import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useBranding } from './BrandingContext'
import { useAuth } from './AuthContext'

function isDonker(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 150
}

// ─── Branding Header ──────────────────────────────────────────────────────────
function BrandingHeader({ gebruiker, uitloggen, branding }) {
  const primaireTekstKleur = isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827'
  return (
    <div
      className="border-b px-6 py-4 flex items-center justify-between"
      style={{ backgroundColor: branding.primaire_kleur }}
    >
      <div className="flex items-center gap-4">
        {branding.logo_url && (
          <img
            src={branding.logo_url}
            alt={branding.bedrijfsnaam}
            className="h-10 object-contain"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: primaireTekstKleur }}>{branding.bedrijfsnaam}</h1>
          <p className="text-sm opacity-80 mt-0.5" style={{ color: primaireTekstKleur }}>{branding.welkomsttekst}</p>
        </div>
      </div>
      {gebruiker && (
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80" style={{ color: primaireTekstKleur }}>
            {gebruiker.name || gebruiker.username}
          </span>
          <button
            onClick={uitloggen}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: primaireTekstKleur }}
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  )
}

function KeywordFeedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { branding } = useBranding()
  const { gebruiker, uitloggen } = useAuth()
  const { analyse, cvTekst, cvHtml, vacatureTekst } = location.state || {}

  const [geselecteerdeKeywords, setGeselecteerdeKeywords] = useState([])
  const [keywordContext, setKeywordContext] = useState({})
  const [keywordSecties, setKeywordSecties] = useState({})

  const primaireTekstKleur = isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827'
  const achtergrondKleur = branding.achtergrondkleur || '#F3F4F6'
  const isAchtergrondDonker = isDonker(achtergrondKleur)

  if (!analyse) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: achtergrondKleur }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: isAchtergrondDonker ? '#9CA3AF' : '#6B7280' }}>
            Geen analyse gevonden. Doe eerst een analyse.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg font-medium"
            style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
          >
            ← Terug naar analyse
          </button>
        </div>
      </div>
    )
  }

  const sectieNamen = analyse.secties.map(s => s.naam)

  const toggleKeyword = (keyword) => {
    setGeselecteerdeKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    )
  }

  const updateContext = (keyword, tekst) => {
    setKeywordContext(prev => ({ ...prev, [keyword]: tekst }))
  }

  const toggleSectieVoorKeyword = (keyword, sectieNaam) => {
    setKeywordSecties(prev => {
      const huidig = prev[keyword] || []
      return {
        ...prev,
        [keyword]: huidig.includes(sectieNaam)
          ? huidig.filter(s => s !== sectieNaam)
          : [...huidig, sectieNaam]
      }
    })
  }

  const gaVerder = () => {
    const keywordContextSamenvatting = geselecteerdeKeywords
      .filter(k => keywordContext[k])
      .map(k => {
        const secties = keywordSecties[k] || []
        const sectieInstructie = secties.length > 0
          ? ` Voeg dit ALLEEN toe aan: ${secties.join(', ')}.`
          : ''
        return `${k}: ${keywordContext[k]}${sectieInstructie}`
      })
      .join('\n')

    navigate('/sectie-review', {
      state: { analyse, cvTekst, cvHtml, vacatureTekst, keywordContext: keywordContextSamenvatting, geselecteerdeKeywords, keywordSecties }
    })
  }

  const kanVerder = geselecteerdeKeywords.length === 0 ||
    geselecteerdeKeywords.every(k => keywordContext[k]?.trim())

  return (
    <div className="min-h-screen" style={{ backgroundColor: achtergrondKleur }}>

      {/* Branding Header */}
      <BrandingHeader gebruiker={gebruiker} uitloggen={uitloggen} branding={branding} />

      {/* Nav-balk */}
      <div className="border-b px-6" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3 py-2.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors hover:opacity-80 flex-shrink-0"
            style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: 'white' }}
          >
            ← Terug
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-gray-600">Keywords controleren</span>
            <span className="text-xs text-gray-400 ml-2">· Stap 1 van 2</span>
          </div>
          <button
            onClick={gaVerder}
            disabled={!kanVerder}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
          >
            {geselecteerdeKeywords.length > 0
              ? `${geselecteerdeKeywords.length} keyword${geselecteerdeKeywords.length > 1 ? 's' : ''} toevoegen →`
              : 'Doorgaan →'
            }
          </button>
        </div>
      </div>

      {/* Inhoud */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Uitleg blok */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Welke ontbrekende keywords kun jij toevoegen?
          </h2>
          <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
            <p>
              Deze keywords worden gevraagd in de vacature maar worden (nog) niet genoemd in jouw CV.
              <strong className="text-gray-800"> Vink de keywords aan waarvan je denkt dat we ze alsnog kunnen noemen.</strong>
            </p>
            <p>
              Daarna gaan we kijken in welke sectie(s) we ze het beste kunnen plaatsen,
              en kun je wat extra toelichting geven over jouw ervaring ermee.
            </p>
            <p className="flex items-start gap-2 pt-1 text-xs text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              Claude AI geeft daarna concrete voorbeelden voor mogelijke verbetering per sectie.
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Ontbrekende keywords
          </h3>
          <div className="space-y-3">
            {analyse.ontbrekende_keywords.map((keyword, i) => {
              const geselecteerd = geselecteerdeKeywords.includes(keyword)
              return (
                <div key={i} className={`rounded-xl border transition-all ${
                  geselecteerd ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                }`}>
                  {/* Keyword rij */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => toggleKeyword(keyword)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      geselecteerd ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {geselecteerd && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${geselecteerd ? 'text-green-800' : 'text-gray-800'}`}>
                      {keyword}
                    </span>
                    {geselecteerd && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        Geselecteerd
                      </span>
                    )}
                  </div>

                  {/* Uitklap bij selectie */}
                  {geselecteerd && (
                    <div className="px-4 pb-4 ml-8 space-y-4 border-t border-green-200 pt-4">

                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                          Vertel Claude meer over jouw ervaring
                        </label>
                        <textarea
                          className="w-full h-20 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white resize-none"
                          placeholder={`Bijv. bij welk bedrijf, hoe lang, welk niveau...`}
                          value={keywordContext[keyword] || ''}
                          onChange={(e) => updateContext(keyword, e.target.value)}
                        />
                        {!keywordContext[keyword]?.trim() && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Vereist om door te gaan
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-2">
                          In welke sectie(s) wil je dit toevoegen?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {sectieNamen.map((sectieNaam, j) => {
                            const isGeselecteerd = (keywordSecties[keyword] || []).includes(sectieNaam)
                            return (
                              <button
                                key={j}
                                onClick={() => toggleSectieVoorKeyword(keyword, sectieNaam)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                  isGeselecteerd
                                    ? 'text-white border-transparent'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                                }`}
                                style={isGeselecteerd ? { backgroundColor: branding.primaire_kleur } : {}}
                              >
                                {sectieNaam}
                              </button>
                            )
                          })}
                        </div>
                        <p className={`text-xs mt-1.5 ${
                          (keywordSecties[keyword] || []).length > 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {(keywordSecties[keyword] || []).length > 0
                            ? `✓ Wordt toegevoegd aan: ${(keywordSecties[keyword] || []).join(', ')}`
                            : 'Geen sectie gekozen — Claude kiest zelf de beste plek'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Samenvatting */}
        {geselecteerdeKeywords.length > 0 && (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-green-800 mb-2">
              ✓ {geselecteerdeKeywords.length} keyword{geselecteerdeKeywords.length > 1 ? 's' : ''} geselecteerd
            </p>
            <div className="space-y-1">
              {geselecteerdeKeywords.map(k => (
                <p key={k} className="text-xs text-green-700">
                  <span className="font-medium">{k}</span>
                  {(keywordSecties[k] || []).length > 0
                    ? ` → ${(keywordSecties[k] || []).join(', ')}`
                    : ' → Claude kiest de beste sectie'
                  }
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Validatie hint */}
        {!kanVerder && (
          <p className="text-xs text-center text-amber-500 pb-2">
            Vul voor elk geselecteerd keyword een toelichting in om door te gaan
          </p>
        )}

      </div>
    </div>
  )
}

export default KeywordFeedback
