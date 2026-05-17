import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function KeywordFeedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { analyse, cvTekst, vacatureTekst } = location.state || {}

  const [geselecteerdeKeywords, setGeselecteerdeKeywords] = useState([])
  const [keywordContext, setKeywordContext] = useState({})
  const [keywordSecties, setKeywordSecties] = useState({})

  if (!analyse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Geen analyse gevonden. Doe eerst een analyse.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ← Terug naar analyse
          </button>
        </div>
      </div>
    )
  }

  const sectieNamen = analyse.secties.map(s => s.naam)

  const toggleKeyword = (keyword) => {
    setGeselecteerdeKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    )
  }

  const updateContext = (keyword, tekst) => {
    setKeywordContext(prev => ({ ...prev, [keyword]: tekst }))
  }

  const toggleSectieVoorKeyword = (keyword, sectieNaam) => {
    setKeywordSecties(prev => {
      const huidigeSectiesVoorKeyword = prev[keyword] || []
      const nieuweSecties = huidigeSectiesVoorKeyword.includes(sectieNaam)
        ? huidigeSectiesVoorKeyword.filter(s => s !== sectieNaam)
        : [...huidigeSectiesVoorKeyword, sectieNaam]
      return { ...prev, [keyword]: nieuweSecties }
    })
  }

  const gaVerder = () => {
    // Bouw keyword context samen inclusief sectie-instructies
    const keywordContextSamenvatting = geselecteerdeKeywords
      .filter(k => keywordContext[k])
      .map(k => {
        const secties = keywordSecties[k] || []
        const sectieInstructie = secties.length > 0
          ? ` Voeg dit ALLEEN toe aan de volgende secties: ${secties.join(', ')}. Voeg het NIET toe aan andere secties.`
          : ''
        return `${k}: ${keywordContext[k]}${sectieInstructie}`
      })
      .join('\n')

    navigate('/sectie-review', {
      state: {
        analyse,
        cvTekst,
        vacatureTekst,
        keywordContext: keywordContextSamenvatting,
        geselecteerdeKeywords,
        keywordSecties
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV Optimizer</h1>
            <p className="text-sm text-gray-500 mt-1">Stap 1 van 2 — Keywords controleren</p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">
            ← Terug naar analyse
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Uitleg */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Heb je ervaring met deze ontbrekende keywords?
          </h2>
          <p className="text-sm text-blue-800">
            Vink aan welke keywords je wél hebt, vertel Claude er meer over, en kies in welke secties je ze wilt toevoegen.
            Claude gebruikt deze informatie om gerichte suggesties te geven — alleen in de secties die jij aanwijst.
          </p>
        </div>

        {/* Ontbrekende keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Ontbrekende keywords</h3>
          <div className="space-y-4">
            {analyse.ontbrekende_keywords.map((keyword, i) => (
              <div key={i} className={`border rounded-lg p-4 transition-colors ${geselecteerdeKeywords.includes(keyword) ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>

                {/* Keyword checkbox */}
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id={`keyword-${i}`}
                    checked={geselecteerdeKeywords.includes(keyword)}
                    onChange={() => toggleKeyword(keyword)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <label htmlFor={`keyword-${i}`} className="text-sm font-medium text-gray-800 cursor-pointer">
                    {keyword}
                  </label>
                  {geselecteerdeKeywords.includes(keyword) && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Geselecteerd</span>
                  )}
                </div>

                {/* Context + sectie selectie verschijnt als keyword geselecteerd is */}
                {geselecteerdeKeywords.includes(keyword) && (
                  <div className="mt-3 ml-7 space-y-4">

                    {/* Context tekstveld */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Vertel Claude meer over jouw ervaring
                      </label>
                      <textarea
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        placeholder={`Bijv. waar, wanneer, hoe lang je ${keyword} hebt gebruikt...`}
                        value={keywordContext[keyword] || ''}
                        onChange={(e) => updateContext(keyword, e.target.value)}
                      />
                    </div>

                    {/* Sectie selectie */}
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-2">
                        In welke secties wil je dit keyword toevoegen?
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
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {sectieNaam}
                            </button>
                          )
                        })}
                      </div>
                      {(keywordSecties[keyword] || []).length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Geen sectie geselecteerd — Claude voegt dit keyword toe waar hij het relevant vindt
                        </p>
                      )}
                      {(keywordSecties[keyword] || []).length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Wordt alleen toegevoegd aan: {(keywordSecties[keyword] || []).join(', ')}
                        </p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Samenvatting */}
        {geselecteerdeKeywords.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-1">
              ✓ {geselecteerdeKeywords.length} keyword{geselecteerdeKeywords.length > 1 ? 's' : ''} geselecteerd
            </p>
            {geselecteerdeKeywords.map(k => (
              <p key={k} className="text-xs text-green-700">
                <span className="font-medium">{k}</span>
                {(keywordSecties[k] || []).length > 0
                  ? ` → ${(keywordSecties[k] || []).join(', ')}`
                  : ' → alle relevante secties'
                }
              </p>
            ))}
          </div>
        )}

        {/* Knoppen */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={() => navigate('/sectie-review', {
              state: { analyse, cvTekst, vacatureTekst, keywordContext: '', geselecteerdeKeywords: [], keywordSecties: {} }
            })}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Overslaan — direct naar sectie review
          </button>
          <button
            onClick={gaVerder}
            disabled={geselecteerdeKeywords.length > 0 && geselecteerdeKeywords.some(k => !keywordContext[k])}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Doorgaan naar sectie review →
          </button>
        </div>

        {geselecteerdeKeywords.length > 0 && geselecteerdeKeywords.some(k => !keywordContext[k]) && (
          <p className="text-xs text-center text-amber-600">
            Vul voor elk geselecteerd keyword een toelichting in om door te gaan
          </p>
        )}

      </div>
    </div>
  )
}

export default KeywordFeedback
