import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import SectieReview from './SectieReview'
import CVPreview from './CVPreview'
import KeywordFeedback from './KeywordFeedback'
import AdminBranding from './AdminBranding'
import { BrandingProvider, useBranding } from './BrandingContext'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScherm from './LoginScherm'
import HoeWerktHet from './HoeWerktHet'
import RichTextEditor from './RichTextEditor'
import Security from './Security'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

const MAX_CV_TEKENS = 12000
const MAX_VACATURE_TEKENS = 6000

function isDonker(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 150
}

function Header() {
  const { branding } = useBranding()
  const { gebruiker, uitloggen, isAdmin } = useAuth()
  const navigate = useNavigate()

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
      <button
            onClick={() => window.open('/hoe-werkt-het', '_blank')}
            title="Hoe werkt het?"
            className="w-8 h-8 flex items-center justify-center text-base bg-white bg-opacity-20 text-white rounded-full hover:bg-opacity-30 transition-colors"
          >
            ?
          </button>
          <button
            onClick={() => navigate('/security')}
            className="px-3 py-1 text-sm bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors flex items-center gap-1"
            title="Privacy & Beveiliging"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Beveiliging
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin-branding')}
              className="px-3 py-1 text-sm bg-white bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-colors"
            >
              🎨 Huisstijl
            </button>
          )}
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

  const { branding } = useBranding()
  const orgBalkKleur = branding.organisatiebalk_kleur || '#FFFFFF'
  const orgTekstKleur = isDonker(orgBalkKleur) ? '#F9FAFB' : '#374151'
  const orgBorderKleur = isDonker(orgBalkKleur) ? '#374151' : '#F3F4F6'

  return (
    <div
      className="flex items-center gap-2 px-6 py-2 border-b"
      style={{ backgroundColor: orgBalkKleur, borderColor: orgBorderKleur }}
    >
      <label className="text-xs" style={{ color: orgTekstKleur }}>Organisatie (admin):</label>
      <select
        value={gekozenId}
        onChange={handleChange}
        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={{
          backgroundColor: isDonker(orgBalkKleur) ? '#1F2937' : '#FFFFFF',
          color: isDonker(orgBalkKleur) ? '#F9FAFB' : '#374151',
          borderColor: isDonker(orgBalkKleur) ? '#4B5563' : '#D1D5DB'
        }}
      >
        <option value="default">Standaard CV Optimizer</option>
        {organisaties.map(org => (
          <option key={org.id} value={org.id}>{org.naam}</option>
        ))}
      </select>
    </div>
  )
}

// ─── CV Favorieten Panel ──────────────────────────────────────────────────────
function FavorietenPanel({ onSelecteer, cvTekst, onSluiten }) {
  const { gebruiker, getToken } = useAuth()
  const { branding } = useBranding()
  const [cvs, setCvs] = useState([])
  const [loading, setLoading] = useState(true)
  const [opslaanNaam, setOpslaanNaam] = useState('')
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [bericht, setBericht] = useState(null)

  const gebruikerId = gebruiker?.localAccountId || gebruiker?.homeAccountId?.split('.')[0] || 'onbekend'

  useEffect(() => { laadCvs() }, [])

  const laadCvs = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/cv-lijst?gebruiker_id=${gebruikerId}`, { headers })
      const data = await res.json()
      setCvs(Array.isArray(data) ? data : [])
    } catch {
      setCvs([])
    } finally {
      setLoading(false)
    }
  }

  const verwijder = async (blobNaam) => {
    if (!window.confirm('CV verwijderen?')) return
    try {
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      await fetch(`${BACKEND}/cv-lijst?gebruiker_id=${gebruikerId}&blob_naam=${encodeURIComponent(blobNaam)}`, {
        method: 'DELETE', headers
      })
      await laadCvs()
      setBericht({ type: 'succes', tekst: 'CV verwijderd' })
    } catch {
      setBericht({ type: 'fout', tekst: 'Kon CV niet verwijderen' })
    }
  }

  const slaOp = async () => {
    if (!cvTekst || !opslaanNaam.trim()) return
    setOpslaanBezig(true)
    try {
      const token = await getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/cv-opslaan`, {
        method: 'POST', headers,
        body: JSON.stringify({ cv_tekst: cvTekst, cv_naam: opslaanNaam.trim(), gebruiker_id: gebruikerId })
      })
      const data = await res.json()
      if (data.success) {
        setBericht({ type: 'succes', tekst: 'CV opgeslagen!' })
        setOpslaanNaam('')
        await laadCvs()
      } else {
        setBericht({ type: 'fout', tekst: data.error || 'Kon CV niet opslaan' })
      }
    } catch {
      setBericht({ type: 'fout', tekst: 'Fout bij opslaan' })
    } finally {
      setOpslaanBezig(false)
    }
  }

  const formatDatum = (iso) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between"
          style={{ backgroundColor: branding.primaire_kleur }}>
          <h2 className="text-lg font-semibold text-white">Mijn opgeslagen CV's</h2>
          <button onClick={onSluiten} className="text-white opacity-80 hover:opacity-100 text-xl">✕</button>
        </div>
        <div className="p-6">
          {cvTekst && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Huidig CV opslaan</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Naam voor dit CV..."
                  value={opslaanNaam}
                  onChange={(e) => setOpslaanNaam(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && slaOp()}
                />
                <button
                  onClick={slaOp}
                  disabled={opslaanBezig || !opslaanNaam.trim()}
                  className="px-4 py-2 text-sm rounded disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: branding.primaire_kleur, color: isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827' }}
                >
                  {opslaanBezig ? '...' : 'Opslaan'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Max 5 CV's per account</p>
            </div>
          )}
          {bericht && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${bericht.type === 'succes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {bericht.tekst}
            </div>
          )}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">Laden...</p>
          ) : cvs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nog geen CV's opgeslagen</p>
          ) : (
            <div className="space-y-2">
              {cvs.map((cv) => (
                <div key={cv.blob_naam}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cv.naam}</p>
                    <p className="text-xs text-gray-400">{formatDatum(cv.opgeslagen_op)} · {cv.tekst_lengte.toLocaleString()} tekens</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => { onSelecteer(cv.tekst); onSluiten() }}
                      className="px-3 py-1 text-xs rounded transition-colors"
                      style={{ backgroundColor: branding.primaire_kleur, color: isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827' }}
                    >
                      Gebruiken
                    </button>
                    <button
                      onClick={() => verwijder(cv.blob_naam)}
                      className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vacature Favorieten Panel ────────────────────────────────────────────────
function VacatureFavorietenPanel({ onSelecteer, vacatureTekst, onSluiten }) {
  const { gebruiker, getToken } = useAuth()
  const { branding } = useBranding()
  const [vacatures, setVacatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [opslaanNaam, setOpslaanNaam] = useState('')
  const [opslaanBezig, setOpslaanBezig] = useState(false)
  const [bericht, setBericht] = useState(null)

  const gebruikerId = gebruiker?.localAccountId || gebruiker?.homeAccountId?.split('.')[0] || 'onbekend'

  useEffect(() => { laadVacatures() }, [])

  const laadVacatures = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/vacature-lijst?gebruiker_id=${gebruikerId}`, { headers })
      const data = await res.json()
      setVacatures(Array.isArray(data) ? data : [])
    } catch {
      setVacatures([])
    } finally {
      setLoading(false)
    }
  }

  const verwijder = async (blobNaam) => {
    if (!window.confirm('Vacature verwijderen?')) return
    try {
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      await fetch(`${BACKEND}/vacature-lijst?gebruiker_id=${gebruikerId}&blob_naam=${encodeURIComponent(blobNaam)}`, {
        method: 'DELETE', headers
      })
      await laadVacatures()
      setBericht({ type: 'succes', tekst: 'Vacature verwijderd' })
    } catch {
      setBericht({ type: 'fout', tekst: 'Kon vacature niet verwijderen' })
    }
  }

  const slaOp = async () => {
    if (!vacatureTekst || !opslaanNaam.trim()) return
    setOpslaanBezig(true)
    try {
      const token = await getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/vacature-opslaan`, {
        method: 'POST', headers,
        body: JSON.stringify({ vacature_tekst: vacatureTekst, vacature_naam: opslaanNaam.trim(), gebruiker_id: gebruikerId })
      })
      const data = await res.json()
      if (data.success) {
        setBericht({ type: 'succes', tekst: 'Vacature opgeslagen!' })
        setOpslaanNaam('')
        await laadVacatures()
      } else {
        setBericht({ type: 'fout', tekst: data.error || 'Kon vacature niet opslaan' })
      }
    } catch {
      setBericht({ type: 'fout', tekst: 'Fout bij opslaan' })
    } finally {
      setOpslaanBezig(false)
    }
  }

  const formatDatum = (iso) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between"
          style={{ backgroundColor: branding.primaire_kleur }}>
          <h2 className="text-lg font-semibold text-white">Mijn opgeslagen vacatures</h2>
          <button onClick={onSluiten} className="text-white opacity-80 hover:opacity-100 text-xl">✕</button>
        </div>
        <div className="p-6">
          {vacatureTekst && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Huidige vacature opslaan</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Naam voor deze vacature..."
                  value={opslaanNaam}
                  onChange={(e) => setOpslaanNaam(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && slaOp()}
                />
                <button
                  onClick={slaOp}
                  disabled={opslaanBezig || !opslaanNaam.trim()}
                  className="px-4 py-2 text-sm rounded disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: branding.primaire_kleur, color: isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827' }}
                >
                  {opslaanBezig ? '...' : 'Opslaan'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Max 5 vacatures per account</p>
            </div>
          )}
          {bericht && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${bericht.type === 'succes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {bericht.tekst}
            </div>
          )}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">Laden...</p>
          ) : vacatures.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nog geen vacatures opgeslagen</p>
          ) : (
            <div className="space-y-2">
              {vacatures.map((vac) => (
                <div key={vac.blob_naam}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{vac.naam}</p>
                    <p className="text-xs text-gray-400">{formatDatum(vac.opgeslagen_op)} · {vac.tekst.length.toLocaleString()} tekens</p>
                  </div>
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={() => { onSelecteer(vac.tekst); onSluiten() }}
                      className="px-3 py-1 text-xs rounded transition-colors"
                      style={{ backgroundColor: branding.primaire_kleur, color: isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827' }}
                    >
                      Gebruiken
                    </button>
                    <button
                      onClick={() => verwijder(vac.blob_naam)}
                      className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Analyse() {
  const [cvTekst, setCvTekst] = useState('')
  const [cvHtml, setCvHtml] = useState(null)   // HTML structuur van DOCX upload
  const [vacatureTekst, setVacatureTekst] = useState('')
  const [analyse, setAnalyse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [toonOpslaanKnop, setToonOpslaanKnop] = useState(false)
  const [knipperend, setKnipperend] = useState(false)
  const [toonVacatureOpslaanKnop, setToonVacatureOpslaanKnop] = useState(false)
  const [vacatureKnipperend, setVacatureKnipperend] = useState(false)
  const [fout, setFout] = useState(null)
  const [toonFavorieten, setToonFavorieten] = useState(false)
  const [toonVacatureFavorieten, setToonVacatureFavorieten] = useState(false)
  const [toonVacatureInvoer, setToonVacatureInvoer] = useState(false)
  const fileInputRef = useRef(null)
  const vacatureRef = useRef(null)
  const navigate = useNavigate()
  const { branding } = useBranding()
  const { getToken } = useAuth()

  const labelKleur = isDonker(branding.achtergrondkleur) ? '#F9FAFB' : '#374151'
  const subTekstKleur = isDonker(branding.achtergrondkleur) ? '#9CA3AF' : '#6B7280'
  const knopBorderKleur = isDonker(branding.achtergrondkleur) ? '#6B7280' : '#D1D5DB'
  const knopTekstKleur = isDonker(branding.achtergrondkleur) ? '#E5E7EB' : '#4B5563'
  const primaireTekstKleur = isDonker(branding.primaire_kleur) ? '#FFFFFF' : '#111827'

  const toonOpslaanMelding = () => {
    setToonOpslaanKnop(true)
    setKnipperend(true)
    setTimeout(() => setKnipperend(false), 4000)
  }

  const toonVacatureOpslaanMelding = () => {
    setToonVacatureOpslaanKnop(true)
    setVacatureKnipperend(true)
    setTimeout(() => setVacatureKnipperend(false), 4000)
  }

  const uploadCv = async (bestand) => {
    setUploadLoading(true)
    setFout(null)
    try {
      const formData = new FormData()
      formData.append('bestand', bestand)
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${BACKEND}/upload`, { method: 'POST', headers, body: formData })
      const data = await res.json()
      if (data.tekst) {
        setCvTekst(data.tekst)
        setCvHtml(data.html || null)   // null bij PDF, HTML string bij DOCX
      } else {
        setFout(data.error || 'Kon bestand niet verwerken')
      }
    } catch {
      setFout('Fout bij uploaden bestand')
    } finally {
      setUploadLoading(false)
    }
  }

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
        method: 'POST', headers,
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

  const directBewerken = async () => {
    if (!cvTekst) {
      setFout('Voer eerst je CV in.')
      return
    }
    setLoading(true)
    setFout(null)
    try {
      const token = await getToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Stuur CV naar extract endpoint om secties te detecteren
      const response = await fetch(`${BACKEND}/extract`, {
        method: 'POST', headers,
        body: JSON.stringify({ cv_tekst: cvTekst })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Er ging iets mis')

      // Maak minimale analyse zonder match score
      const minimaleAnalyse = {
        taal: 'nl',
        match_score: null,
        ontbrekende_keywords: [],
        aanwezige_keywords: [],
        tone_aanbeveling: '',
        secties: data.secties || []
      }

      navigate('/sectie-review', {
        state: {
          analyse: minimaleAnalyse,
          cvTekst,
          cvHtml,
          vacatureTekst: vacatureTekst || '',
          keywordContext: null,
          geselecteerdeKeywords: [],
          keywordSecties: {}
        }
      })
    } catch (err) {
      setFout(err.message)
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

// NIEUWE RETURN voor het Analyse component
// Vervangt alles vanaf "return (" tot en met de sluitende "}" van Analyse()

  // ── Stap state ───────────────────────────────────────────────────────────
  // stap: 'cv' | 'actie' | 'vacature' | 'laden' | 'resultaat'
  const heeftCv = cvTekst.trim().length > 50

  return (
    <div className="min-h-screen" style={{ backgroundColor: branding.achtergrondkleur }}>
      <Header />
      <OrganisatieSelector />

      {/* Panels */}
      {toonFavorieten && (
        <FavorietenPanel
          cvTekst={cvTekst}
          onSelecteer={(tekst) => { setCvTekst(tekst); setCvHtml(null) }}
          onSluiten={() => setToonFavorieten(false)}
        />
      )}
      {toonVacatureFavorieten && (
        <VacatureFavorietenPanel
          vacatureTekst={vacatureTekst}
          onSelecteer={(tekst) => setVacatureTekst(tekst)}
          onSluiten={() => setToonVacatureFavorieten(false)}
        />
      )}

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* ── Analyse resultaat ── */}
        {analyse && (
          <div className="space-y-5">
            <button
              onClick={() => { setAnalyse(null); setVacatureTekst('') }}
              className="text-sm hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: primaireTekstKleur, backgroundColor: `${branding.primaire_kleur}CC` }}
            >
              ← Nieuw CV analyseren
            </button>

            {/* Match Score */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Match Score</h2>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full border-8 ${scoreRingKleur(analyse.match_score)} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xl font-bold ${scoreKleur(analyse.match_score)}`}>{analyse.match_score}%</span>
                </div>
                <p className="text-gray-600 text-sm flex-1">{analyse.match_toelichting}</p>
              </div>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Ontbrekende keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {analyse.ontbrekende_keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-3">Aanwezige keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {analyse.aanwezige_keywords.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tone of Voice */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Tone of Voice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Vacature</p>
                  <p className="text-sm text-gray-700">{analyse.tone_of_voice_vacature}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Jouw CV</p>
                  <p className="text-sm text-gray-700">{analyse.tone_of_voice_cv}</p>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ backgroundColor: `${branding.primaire_kleur}15` }}>
                <p className="text-xs font-medium uppercase mb-1" style={{ color: branding.primaire_kleur }}>Aanbeveling</p>
                <p className="text-sm" style={{ color: labelKleur }}>{analyse.tone_aanbeveling}</p>
              </div>
            </div>

            {/* CV Secties */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">CV Secties</h2>
              <div className="space-y-2">
                {analyse.secties.map((sectie, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-700">{sectie.naam}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                      {(sectie.originele_tekst || sectie.opmerking || '').substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border p-6 text-center" style={{ backgroundColor: `${branding.primaire_kleur}20`, borderColor: `${branding.primaire_kleur}50` }}>
              <h2 className="text-base font-semibold mb-1" style={{ color: labelKleur }}>Klaar om je CV te verbeteren?</h2>
              <p className="text-sm mb-4" style={{ color: subTekstKleur }}>Ga sectie voor sectie door je CV met concrete verbeteringsvoorstellen.</p>
              <button
                onClick={() => navigate('/keyword-feedback', { state: { analyse, cvTekst, cvHtml, vacatureTekst } })}
                className="px-8 py-3 font-medium rounded-xl transition-colors"
                style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
              >
                Verbeter mijn CV per sectie →
              </button>
            </div>
          </div>
        )}

        {/* ── Hoofdflow (geen analyse resultaat) ── */}
        {!analyse && (
          <>
            {/* ── CV invoer met fixed zijknoppen ── */}
            <div className="relative">

              {/* Linkerknoppen — fixed links in het scherm */}
              <div className="fixed left-4 top-24 flex flex-col gap-2 z-20">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 w-full"
                  style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                  title="Upload een PDF of Word bestand"
                >
                  {uploadLoading ? '⏳ Laden...' : '📎 Upload'}
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
                  onChange={(e) => e.target.files[0] && uploadCv(e.target.files[0])} />

                <button
                  onClick={() => setToonFavorieten(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90 w-full"
                  style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                  title="Kies een eerder opgeslagen CV"
                >
                  ⭐ Opgeslagen
                </button>

                {toonOpslaanKnop && cvTekst && (
                  <button
                    onClick={() => { setToonFavorieten(true); setToonOpslaanKnop(false) }}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90 w-full ${knipperend ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                    title="CV opslaan als favoriet"
                  >
                    💾 Opslaan
                  </button>
                )}
              </div>

              {/* CV Editor kaart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: branding.primaire_kleur }}>1</div>
                  <h2 className="text-sm font-semibold text-gray-700">Jouw CV</h2>
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: cvTekst.length > MAX_CV_TEKENS ? '#F87171' : '#9CA3AF' }}>
                    {cvTekst.length} / {MAX_CV_TEKENS}
                  </span>
                </div>
                <div className="p-4">
                  <RichTextEditor
                    content={cvHtml || cvTekst}
                    onChange={(html, tekst) => {
                      setCvHtml(html)
                      setCvTekst(tekst)
                      if (tekst.length > 100 && !toonOpslaanKnop) toonOpslaanMelding()
                    }}
                    placeholder="Plak hier je CV tekst, of upload een PDF/DOCX..."
                    minHeight={400}
                  />
                </div>
              </div>

              {/* Rechterknoppen — fixed rechts in het scherm */}
              <div className="fixed right-4 top-24 flex flex-col gap-2 z-20">
                {heeftCv ? (
                  <>
                    <button
                      onClick={directBewerken}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90 w-full"
                      style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                      title="Direct bewerken en downloaden als Word of PDF"
                    >
                      ✏️ Bewerken
                    </button>
                    <button
                      onClick={() => {
                        setToonVacatureInvoer(prev => !prev)
                        setTimeout(() => {
                          vacatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 50)
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90 w-full"
                      style={{
                        backgroundColor: toonVacatureInvoer ? `${branding.primaire_kleur}AA` : branding.primaire_kleur,
                        color: primaireTekstKleur
                      }}
                      title="CV analyseren en vergelijken met een vacature"
                    >
                      🔍 Analyseer
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <button disabled className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg opacity-40 cursor-not-allowed w-full"
                      style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}>
                      ✏️ Bewerken
                    </button>
                    <button disabled className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg opacity-40 cursor-not-allowed w-full"
                      style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}>
                      🔍 Analyseer
                    </button>
                    <p className="text-xs text-center mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Voer eerst CV in
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Vacature invoer (klapt uit na keuze analyseer) ── */}
            {heeftCv && toonVacatureInvoer && (
              <div ref={vacatureRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: branding.primaire_kleur }}>3</div>
                    <h2 className="text-sm font-semibold text-gray-800">Vacature</h2>
                  </div>
                  <button
                    onClick={() => setToonVacatureFavorieten(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg transition-colors"
                    style={{ borderColor: branding.primaire_kleur, color: branding.primaire_kleur }}
                  >
                    ⭐ Opgeslagen vacatures
                  </button>
                </div>

                <div className="p-4">
                  <textarea
                    className="w-full h-48 p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ borderColor: '#E5E7EB', color: '#111827', backgroundColor: '#FAFAFA' }}
                    placeholder="Plak hier de vacaturetekst..."
                    value={vacatureTekst}
                    onChange={(e) => {
                      setVacatureTekst(e.target.value)
                      if (e.target.value.length > 100 && !toonVacatureOpslaanKnop) toonVacatureOpslaanMelding()
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs" style={{ color: vacatureTekst.length > MAX_VACATURE_TEKENS ? '#F87171' : '#9CA3AF' }}>
                      {vacatureTekst.length} / {MAX_VACATURE_TEKENS} tekens
                    </p>
                    {toonVacatureOpslaanKnop && vacatureTekst && (
                      <button
                        onClick={() => { setToonVacatureFavorieten(true); setToonVacatureOpslaanKnop(false) }}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${vacatureKnipperend ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                      >
                        ⭐ Opslaan als favoriet
                      </button>
                    )}
                  </div>

                  {fout && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 text-sm">{fout}</p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={analyseer}
                      disabled={loading || !vacatureTekst || vacatureTekst.length > MAX_VACATURE_TEKENS || cvTekst.length > MAX_CV_TEKENS}
                      className="px-6 py-2.5 font-medium rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      style={{ backgroundColor: branding.primaire_kleur, color: primaireTekstKleur }}
                    >
                      {loading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analyseren...
                        </>
                      ) : 'Analyseer CV →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fout buiten vacature blok */}
            {fout && !toonVacatureInvoer && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm">{fout}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


function AppInhoud() {
  const { gebruiker, loading, companyId, isAdmin } = useAuth()

  // /security is publiek toegankelijk — ook zonder login (AVG vereiste)
  if (window.location.pathname === '/security') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/security" element={<Security />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!gebruiker) return <LoginScherm />

  return (
    <BrandingProvider companyId={companyId} isAdmin={isAdmin}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Analyse />} />
          <Route path="/keyword-feedback" element={<KeywordFeedback />} />
          <Route path="/sectie-review" element={<SectieReview />} />
          <Route path="/cv-preview" element={<CVPreview />} />
          <Route path="/hoe-werkt-het" element={<HoeWerktHet />} />
          <Route path="/admin-branding" element={<AdminBranding />} />
          <Route path="/security" element={<Security />} />
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
