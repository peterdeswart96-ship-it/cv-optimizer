import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY

function SectieReview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { analyse, cvTekst, vacatureTekst, keywordContext, geselecteerdeKeywords } = location.state || {}

  const [huidigeSectieIndex, setHuidigeSectieIndex] = useState(0)
  const [sectieAnalyse, setSectieAnalyse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState(null)
  const [aangepasteTekst, setAangepasteTekst] = useState('')
  const [eigenInstructie, setEigenInstructie] = useState('')
  const [toonEigenInstructie, setToonEigenInstructie] = useState(false)
  const [definitieveTeksten, setDefinitieveTeksten] = useState({})
  const [klaar, setKlaar] = useState(false)

  // Als er geen analyse data is, stuur terug naar home
  if (!analyse) {
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

  // Analyseer de huidige sectie via Claude
  const analyseerSectie = async () => {
    setLoading(true)
    setFout(null)
    setSectieAnalyse(null)
    setAangepasteTekst('')
    setToonEigenInstructie(false)
    setEigenInstructie('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system: `Je bent een professionele loopbaancoach en recruitment specialist met 15 jaar ervaring.
Gedraag je als een eerlijke, constructieve coach — niet als een PR-bureau.
Retourneer ALLEEN geldige JSON, geen markdown, geen inleiding, geen uitleg buiten de JSON.`,
          messages: [{
            role: 'user',
            content: `Je hebt eerder al het CV en de vacature geanalyseerd.
Nu ga je sectie "${huidigeSectie.naam}" uitgebreid analyseren.

Originele sectietekst:
<sectie>
${huidigeSectie.originele_tekst}
</sectie>

Vacature context:
<vacature>
${vacatureTekst}
</vacature>

Eerder vastgestelde ontbrekende keywords: ${analyse.ontbrekende_keywords.join(', ')}
Tone-of-voice aanbeveling: ${analyse.tone_aanbeveling}
${keywordContext ? `\nExtra context van de gebruiker over ontbrekende keywords:\n${keywordContext}\n\nGebruik deze context om gerichte suggesties te geven als deze sectie relevant is voor de genoemde keywords.` : ''}

Retourneer ALLEEN geldige JSON:
{
  "sectie_naam": "${huidigeSectie.naam}",
  "analyse": {
    "sterke_punten": ["punt 1", "punt 2"],
    "zwakke_punten": ["punt 1", "punt 2"],
    "redenering": "uitgebreide uitleg in 3-5 zinnen waarom aanpassingen nodig zijn",
    "vacature_relevantie": "hoe sluit deze sectie aan op de vacature, specifiek"
  },
  "varianten": [
    {
      "variant_nummer": 1,
      "label": "korte beschrijving variant 1",
      "tekst": "volledige herschreven sectietekst variant 1"
    },
    {
      "variant_nummer": 2,
      "label": "korte beschrijving variant 2",
      "tekst": "volledige herschreven sectietekst variant 2"
    }
  ],
  "tips": ["concrete tip 1", "concrete tip 2"]
}`
          }]
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Er ging iets mis')

      const rawText = data.content[0].text
      const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      setSectieAnalyse(JSON.parse(cleanText))

    } catch (err) {
      setFout(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Vrije aanpassing via eigen instructie
  const verwerkEigenInstructie = async () => {
    setLoading(true)
    setFout(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: `Je bent een professionele loopbaancoach. Retourneer ALLEEN geldige JSON, geen markdown.`,
          messages: [{
            role: 'user',
            content: `De gebruiker wil sectie "${huidigeSectie.naam}" aanpassen met de volgende instructie:

<instructie>
${eigenInstructie}
</instructie>

Originele sectietekst:
<sectie>
${huidigeSectie.originele_tekst}
</sectie>

Herschrijf de sectie exact volgens de instructie van de gebruiker.
Behoud de originele feiten — verzin niets bij.
Retourneer ALLEEN geldige JSON:
{
  "herschreven_tekst": "de herschreven sectietekst",
  "toelichting": "korte uitleg wat je hebt gedaan"
}`
          }]
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'Er ging iets mis')

      const rawText = data.content[0].text
      const cleanText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      const resultaat = JSON.parse(cleanText)
      setAangepasteTekst(resultaat.herschreven_tekst)

    } catch (err) {
      setFout(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Sla de definitieve tekst op en ga naar volgende sectie
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
      setEigenInstructie('')
    }
  }

  // Samenvatting scherm
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
            <div className="space-y-4">
              {secties.map((sectie, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">{sectie.naam}</p>
                    {definitieveTeksten[sectie.naam] && definitieveTeksten[sectie.naam] !== sectie.originele_tekst ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Aangepast</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Ongewijzigd</span>
                    )}
                  </div>
                  {definitieveTeksten[sectie.naam] && (
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {(definitieveTeksten[sectie.naam] || sectie.originele_tekst).substring(0, 120)}...
                    </p>
                  )}
                </div>
              ))}
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
                state: {
                  secties,
                  definitieveTeksten,
                  naam: secties[0]?.originele_tekst?.split('\n')[0] || 'Mijn CV'
                }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CV Sectie Review</h1>
            <p className="text-sm text-gray-500 mt-1">Sectie {huidigeSectieIndex + 1} van {totaalSecties}</p>
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
              <span key={i} className={`text-xs ${i === huidigeSectieIndex ? 'text-blue-600 font-medium' : i < huidigeSectieIndex ? 'text-green-600' : 'text-gray-400'}`}>
                {i < huidigeSectieIndex ? '✓' : sectie.naam.substring(0, 8)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Huidige sectie */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{huidigeSectie.naam}</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Huidige tekst</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{huidigeSectie.originele_tekst}</p>
          </div>
        </div>

        {/* Keyword context tip — als sectie relevant is */}
        {keywordContext && geselecteerdeKeywords && geselecteerdeKeywords.some(k =>
          huidigeSectie.originele_tekst.toLowerCase().includes(k.toLowerCase()) ||
          huidigeSectie.naam.toLowerCase().includes(k.toLowerCase())
        ) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs font-medium text-amber-700 uppercase mb-1">💡 Keyword context beschikbaar</p>
            <p className="text-sm text-amber-800">Claude heeft extra context over ontbrekende keywords voor deze sectie.</p>
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
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500 text-sm">Claude analyseert...</p>
          </div>
        )}

        {/* Foutmelding */}
        {fout && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{fout}</p>
          </div>
        )}

        {/* Sectie analyse resultaten */}
        {sectieAnalyse && (
          <div className="space-y-6">

            {/* Analyse */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Analyse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase mb-2">Sterke punten</p>
                  <ul className="space-y-1">
                    {sectieAnalyse.analyse.sterke_punten.map((punt, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-500 flex-shrink-0">✓</span>{punt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 uppercase mb-2">Verbeterpunten</p>
                  <ul className="space-y-1">
                    {sectieAnalyse.analyse.zwakke_punten.map((punt, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-red-400 flex-shrink-0">→</span>{punt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-blue-700 uppercase mb-1">Redenering</p>
                <p className="text-sm text-blue-800">{sectieAnalyse.analyse.redenering}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-xs font-medium text-amber-700 uppercase mb-1">Vacature relevantie</p>
                <p className="text-sm text-amber-800">{sectieAnalyse.analyse.vacature_relevantie}</p>
              </div>
            </div>

            {/* Keuzes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Wat wil je doen?</h3>
              <div className="space-y-4">

                {/* Optie 1: Ongewijzigd */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <button
                    onClick={() => slaOpEnVerder(huidigeSectie.originele_tekst)}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-medium text-gray-700">① Ongewijzigd laten</p>
                    <p className="text-xs text-gray-400 mt-1">Huidige tekst behouden en doorgaan naar de volgende sectie</p>
                  </button>
                </div>

                {/* Varianten */}
                {sectieAnalyse.varianten.map((variant) => (
                  <div key={variant.variant_nummer} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      ② Variant {variant.variant_nummer}: {variant.label}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white rounded p-3 mb-3">
                      {variant.tekst}
                    </p>
                    <button
                      onClick={() => {
                        setAangepasteTekst(variant.tekst)
                      }}
                      className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Gebruik variant {variant.variant_nummer}
                    </button>
                  </div>
                ))}

                {/* Optie: eigen instructie */}
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

            {/* Bewerkbare preview na keuze */}
            {aangepasteTekst && (
              <div className="bg-white rounded-xl border border-green-200 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Bewerkbare preview</h3>
                <p className="text-xs text-gray-500 mb-2">Pas de tekst nog aan indien gewenst</p>
                <textarea
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={aangepasteTekst}
                  onChange={(e) => setAangepasteTekst(e.target.value)}
                />
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => slaOpEnVerder(aangepasteTekst)}
                    className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {isLaatsteSectie ? 'Opslaan en afronden ✓' : 'Opslaan en volgende sectie →'}
                  </button>
                  <button
                    onClick={() => setAangepasteTekst('')}
                    className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            )}

            {/* Tips */}
            {sectieAnalyse.tips && sectieAnalyse.tips.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Tips</h3>
                <ul className="space-y-2">
                  {sectieAnalyse.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-blue-500 flex-shrink-0">💡</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

export default SectieReview
