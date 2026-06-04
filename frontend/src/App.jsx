import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import SectieReview from './SectieReview'
import CVPreview from './CVPreview'
import KeywordFeedback from './KeywordFeedback'
import { BrandingProvider, useBranding } from './BrandingContext'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScherm from './LoginScherm'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

const MAX_CV_TEKENS = 12000
const MAX_VACATURE_TEKENS = 6000

function Header() {
  const { branding } = useBranding()
  const { gebruiker, uitloggen } = useAuth()

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
          <h1 className="text-2xl font-bold text-white">{branding.bedrijfsnaam}</h1>
          <p className="text-sm text-white opacity-80 mt-0.5">{branding.welkomsttekst}</p>
        </div>
      </div>
      {gebruiker && (
        <div className="flex items-center gap-3">
          <span className="text-white text-sm opacity-80">
            {gebruiker.name || gebruiker.username}
          </span>
          <button
            onClick={uitloggen}
            className="px-3 py-1 text-sm bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors"
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  )
}

function OrganisatieSelector() {
  const { isAdmin, companyId } = useAuth()
  const [organisaties, setOrganisaties] = useState([])
  const [gekozenId, setGekozenId] = useState(companyId)

  useEffect(() => {
    if (!isAdmin) return
    fetch(`${BACKEND}/organisaties`)
      .then(res => res.json())
      .then(data => setOrganisaties(data))
      .catch(() => {})
  }, [isAdmin])

  if (!isAdmin) return null

  const handleChange = (e) => {
    const nieuwId = e.target.value
    setGekozenId(nieuwId)
    localStorage.setItem('companyId', nieuwId)
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2 px-6 py-2 bg-white border-b border-gray-100">
      <label className="text-xs text-gray-500">Organisatie (admin):</label>
      <select
        value={gekozenId}
        onChange={handleChange}
        className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="default">Standaard CV Optimizer</option>
        {organisaties.map(org => (
          <option key={org.id} value={org.id}>{org.naam}</option>
        ))}
      </select>
    </div>
  )
}

function Analyse() {
  const [cvTekst, setCvTekst] = useState('')
  const [vacatureTekst, setVacatureTekst] = useState('')
  const [analyse, setAnalyse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fout, setFout] = useState(null)
  const navigate = useNavigate()
  const { branding } = useBranding()
  const { getToken } = useAuth()

  const analyseer = async () => {
    if (cvTekst.length > MAX_CV_TEKENS) {
      setFout(`Je CV is te lang (${cvTekst.length} tekens). Het maximum is ${MAX_CV_TEKENS} tekens.`)
      return
    }
    if (vacatureTekst.length > MAX_VACATURE_TEKENS) {
      setFout(`De vacaturetekst is te lang (${vacatureTekst.length} tekens). Het maximum is ${MAX_VACATURE_TEKENS} tekens.`)
      return
    }

    setLoading(true)
    setFout(null)
    setAnalyse(null)

    try {
      const token = await getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${BACKEND}/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cv_tekst: cvTekst, vacature_tekst: vacatureTekst })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Er ging iets mis')
      setAnalyse(data)

    } catch (err) {
      if (err instanceof SyntaxError) {
        setFout('De analyse is mislukt omdat de tekst te lang is. Verkort je CV of vacature en probeer opnieuw.')
      } else {
        setFout(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const scoreKleur = (score) => {
    if (score >= 75) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const scoreRingKleur = (score) => {
    if (score >= 75) return 'border-green-500'
    if (score >= 50) return 'border-yellow-500'
    return 'border-red-500'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: branding.achtergrondkleur }}>
      <Header />
      <OrganisatieSelector />

      <div className="max-w-5xl mx-auto px-6 py-8">

        {!analyse && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jouw CV</label>
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Plak hier je CV tekst..."
                value={cvTekst}
                onChange={(e) => setCvTekst(e.target.value)}
              />
              <p className={`text-xs mt-1 text-right ${cvTekst.length > MAX_CV_TEKENS ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {cvTekst.length} / {MAX_CV_TEKENS} tekens
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vacature</label>
              <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Plak hier de vacaturetekst..."
                value={vacatureTekst}
                onChange={(e) => setVacatureTekst(e.target.value)}
              />
              <p className={`text-xs mt-1 text-right ${vacatureTekst.length > MAX_VACATURE_TEKENS ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                {vacatureTekst.length} / {MAX_VACATURE_TEKENS} tekens
              </p>
            </div>
          </div>
        )}

        {!analyse && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={analyseer}
              disabled={loading || !cvTekst || !vacatureTekst || cvTekst.length > MAX_CV_TEKENS || vacatureTekst.length > MAX_VACATURE_TEKENS}
              className="px-8 py-3 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: branding.primaire_kleur }}
            >
              {loading ? 'Analyseren...' : 'Analyseer mijn CV'}
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-8 text-center">
            <div
              className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${branding.primaire_kleur} transparent transparent transparent` }}
            ></div>
            <p className="mt-3 text-gray-500 text-sm">Claude analyseert je CV...</p>
          </div>
        )}

        {fout && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{fout}</p>
          </div>
        )}

        {analyse && (
          <div className="space-y-6">
            <button onClick={() => setAnalyse(null)} className="text-sm hover:underline" style={{ color: branding.primaire_kleur }}>
              ← Nieuw CV analyseren
            </button>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Match Score</h2>
              <div className="flex items-center gap-6">
                <div className={`w-24 h-24 rounded-full border-8 ${scoreRingKleur(analyse.match_score)} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-2xl font-bold ${scoreKleur(analyse.match_score)}`}>{analyse.match_score}%</span>
                </div>
                <p className="text-gray-600 text-sm flex-1">{analyse.match_toelichting}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Ontbrekende keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {analyse.ontbrekende_keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-200">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Aanwezige keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {analyse.aanwezige_keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tone of Voice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Vacature</p>
                  <p className="text-sm text-gray-700">{analyse.tone_of_voice_vacature}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Jouw CV</p>
                  <p className="text-sm text-gray-700">{analyse.tone_of_voice_cv}</p>
                </div>
              </div>
              <div className="rounded-lg p-4" style={{ backgroundColor: `${branding.primaire_kleur}15` }}>
                <p className="text-xs font-medium uppercase mb-1" style={{ color: branding.primaire_kleur }}>Aanbeveling</p>
                <p className="text-sm text-gray-800">{analyse.tone_aanbeveling}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">CV Secties</h2>
              <div className="space-y-3">
                {analyse.secties.map((sectie, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700">{sectie.naam}</p>
                    <p className="text-xs text-gray-400 mt-1 font-mono">{sectie.originele_tekst.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: `${branding.primaire_kleur}10`, borderColor: `${branding.primaire_kleur}40` }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Klaar om je CV te verbeteren?</h2>
              <p className="text-sm text-gray-600 mb-4">Ga sectie voor sectie door je CV en laat Claude concrete verbeteringsvoorstellen genereren.</p>
              <button
                onClick={() => navigate('/keyword-feedback', { state: { analyse, cvTekst, vacatureTekst } })}
                className="px-8 py-3 text-white font-medium rounded-lg transition-colors"
                style={{ backgroundColor: branding.primaire_kleur }}
              >
                Verbeter mijn CV per sectie →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AppInhoud() {
  const { gebruiker, loading, companyId } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!gebruiker) return <LoginScherm />

  return (
    <BrandingProvider companyId={companyId}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Analyse />} />
          <Route path="/keyword-feedback" element={<KeywordFeedback />} />
          <Route path="/sectie-review" element={<SectieReview />} />
          <Route path="/cv-preview" element={<CVPreview />} />
        </Routes>
      </BrowserRouter>
    </BrandingProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppInhoud />
    </AuthProvider>
  )
}

export default App
