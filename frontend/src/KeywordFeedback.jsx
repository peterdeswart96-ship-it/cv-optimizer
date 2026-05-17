import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function KeywordFeedback() {
  const location = useLocation()
  const navigate = useNavigate()
  const { analyse, cvTekst, vacatureTekst } = location.state || {}

  const [geselecteerdeKeywords, setGeselecteerdeKeywords] = useState([])
  const [keywordContext, setKeywordContext] = useState({})

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

  const gaVerder = () => {
    // Bouw keyword context samen voor gebruik in sectie review
    const keywordContextSamenvatting = geselecteerdeKeywords
      .filter(k => keywordContext[k])
      .map(k => `${k}: ${keywordContext[k]}`)
      .join('\n')

    navigate('/sectie-review', {
      state: {
        analyse,
        cvTekst,
        vacatureTekst,
        keywordContext: keywordContextSamenvatting,
        geselecteerdeKeywords
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
            Uit de analyse blijkt dat de volgende keywords ontbreken in je CV. 
            Vink aan welke je wél hebt en vertel Claude er meer over. 
            Claude gebruikt deze informatie bij de sectie review om gerichte suggesties te geven.
          </p>
        </div>

        {/* Ontbrekende keywords */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Ontbrekende keywords</h3>
          <div className="space-y-4">
            {analyse.ontbrekende_keywords.map((keyword, i) => (
              <div key={i} className={`border rounded-lg p-4 transition-colors ${geselecteerdeKeywords.includes(keyword) ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
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

                {/* Context invulveld verschijnt als keyword geselecteerd is */}
                {geselecteerdeKeywords.includes(keyword) && (
                  <div className="mt-2 ml-7">
                    <textarea
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder={`Vertel Claude meer over jouw ervaring met ${keyword}... (bijv. waar, wanneer, hoe lang)`}
                      value={keywordContext[keyword] || ''}
                      onChange={(e) => updateContext(keyword, e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Claude gebruikt deze informatie om concrete suggesties te geven
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Samenvatting geselecteerde keywords */}
        {geselecteerdeKeywords.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              ✓ {geselecteerdeKeywords.length} keyword{geselecteerdeKeywords.length > 1 ? 's' : ''} geselecteerd
            </p>
            <p className="text-xs text-green-700">
              Claude houdt rekening met: {geselecteerdeKeywords.join(', ')}
            </p>
          </div>
        )}

        {/* Knoppen */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={() => navigate('/sectie-review', {
              state: { analyse, cvTekst, vacatureTekst, keywordContext: '', geselecteerdeKeywords: [] }
            })}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Overslaan — direct naar sectie review
          </button>
          <button
            onClick={gaVerder}
            className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Doorgaan naar sectie review →
          </button>
        </div>

      </div>
    </div>
  )
}

export default KeywordFeedback
