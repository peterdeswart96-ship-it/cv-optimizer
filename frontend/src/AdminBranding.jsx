import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBranding } from './BrandingContext'
import { useAuth } from './AuthContext'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

function isDonker(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return false
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 150
}

export default function AdminBranding() {
  const { branding } = useBranding()
  const { getToken, companyId, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [bedrijfsnaam, setBedrijfsnaam] = useState(branding.bedrijfsnaam || '')
  const [welkomsttekst, setWelkomsttekst] = useState(branding.welkomsttekst || '')
  const [primaireKleur, setPrimaireKleur] = useState(branding.primaire_kleur || '#2563EB')
  const [achtergrondkleur, setAchtergrondkleur] = useState(branding.achtergrondkleur || '#0A0A0A')
  const [organisatiebalkkKleur, setOrganisatiebalkKleur] = useState(branding.organisatiebalk_kleur || '#FFFFFF')
  const [logoPreview, setLogoPreview] = useState(branding.logo_url || null)
  const [logoBestand, setLogoBestand] = useState(null)
  const [footerPreview, setFooterPreview] = useState(branding.footer_url || null)
  const [footerBestand, setFooterBestand] = useState(null)
  const [opslaan, setOpslaan] = useState(false)
  const [bericht, setBericht] = useState(null)

  const logoRef = useRef(null)
  const footerRef = useRef(null)

  useEffect(() => {
    if (!isAdmin) navigate('/')
  }, [isAdmin])

  const handleLogo = (e) => {
    const bestand = e.target.files[0]
    if (!bestand) return
    if (bestand.size > 500 * 1024) {
      setBericht({ type: 'fout', tekst: 'Logo mag maximaal 500KB zijn.' })
      return
    }
    setLogoBestand(bestand)
    setLogoPreview(URL.createObjectURL(bestand))
  }

  const handleFooter = (e) => {
    const bestand = e.target.files[0]
    if (!bestand) return
    if (bestand.size > 2 * 1024 * 1024) {
      setBericht({ type: 'fout', tekst: 'Footerafbeelding mag maximaal 2MB zijn.' })
      return
    }
    setFooterBestand(bestand)
    setFooterPreview(URL.createObjectURL(bestand))
  }

  const slaOp = async () => {
    setOpslaan(true)
    setBericht(null)
    try {
      const token = await getToken()
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const formData = new FormData()
      formData.append('companyId', companyId)
      formData.append('bedrijfsnaam', bedrijfsnaam)
      formData.append('welkomsttekst', welkomsttekst)
      formData.append('primaire_kleur', primaireKleur)
      formData.append('achtergrondkleur', achtergrondkleur)
      formData.append('organisatiebalk_kleur', organisatiebalkkKleur)
      if (logoBestand) formData.append('logo', logoBestand)
      if (footerBestand) formData.append('footer', footerBestand)

      const res = await fetch(`${BACKEND}/branding-opslaan`, {
        method: 'POST',
        headers,
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setBericht({ type: 'succes', tekst: 'Branding opgeslagen! Pagina wordt herladen...' })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setBericht({ type: 'fout', tekst: data.error || 'Opslaan mislukt' })
      }
    } catch {
      setBericht({ type: 'fout', tekst: 'Fout bij opslaan' })
    } finally {
      setOpslaan(false)
    }
  }

  const primaireTekstKleur = isDonker(primaireKleur) ? '#FFFFFF' : '#111827'

  return (
    <div className="min-h-screen" style={{ backgroundColor: achtergrondkleur }}>

      {/* Preview header */}
      <div className="px-6 py-4 flex items-center gap-4" style={{ backgroundColor: primaireKleur }}>
        {logoPreview && (
          <img src={logoPreview} alt="Logo preview" className="h-10 object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: primaireTekstKleur }}>
            {bedrijfsnaam || 'Bedrijfsnaam'}
          </h1>
          <p className="text-sm opacity-80" style={{ color: primaireTekstKleur }}>
            {welkomsttekst || 'Welkomsttekst'}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1 text-sm rounded"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: primaireTekstKleur }}
          >
            ← Terug
          </button>
        </div>
      </div>

      {/* Formulier */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-xl font-semibold" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827' }}>
          🎨 Huisstijl beheren
        </h2>

        {bericht && (
          <div className={`p-4 rounded-lg text-sm ${bericht.type === 'succes' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {bericht.tekst}
          </div>
        )}

        {/* Bedrijfsnaam */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
            Bedrijfsnaam
          </label>
          <input
            type="text"
            value={bedrijfsnaam}
            onChange={(e) => setBedrijfsnaam(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: isDonker(achtergrondkleur) ? '#1F2937' : '#FFFFFF', color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827', borderColor: isDonker(achtergrondkleur) ? '#374151' : '#D1D5DB' }}
          />
        </div>

        {/* Welkomsttekst */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
            Welkomsttekst
          </label>
          <input
            type="text"
            value={welkomsttekst}
            onChange={(e) => setWelkomsttekst(e.target.value)}
            className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ backgroundColor: isDonker(achtergrondkleur) ? '#1F2937' : '#FFFFFF', color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827', borderColor: isDonker(achtergrondkleur) ? '#374151' : '#D1D5DB' }}
          />
        </div>

        {/* Kleuren */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
              Headerbalk kleur
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaireKleur}
                onChange={(e) => setPrimaireKleur(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={primaireKleur}
                onChange={(e) => setPrimaireKleur(e.target.value)}
                className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono"
                style={{ backgroundColor: isDonker(achtergrondkleur) ? '#1F2937' : '#FFFFFF', color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827', borderColor: isDonker(achtergrondkleur) ? '#374151' : '#D1D5DB' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
              Achtergrondkleur
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={achtergrondkleur}
                onChange={(e) => setAchtergrondkleur(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={achtergrondkleur}
                onChange={(e) => setAchtergrondkleur(e.target.value)}
                className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono"
                style={{ backgroundColor: isDonker(achtergrondkleur) ? '#1F2937' : '#FFFFFF', color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827', borderColor: isDonker(achtergrondkleur) ? '#374151' : '#D1D5DB' }}
              />
            </div>
          </div>
        </div>

        {/* Organisatiebalk kleur */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
            Organisatiebalk kleur
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={organisatiebalkkKleur}
              onChange={(e) => setOrganisatiebalkKleur(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={organisatiebalkkKleur}
              onChange={(e) => setOrganisatiebalkKleur(e.target.value)}
              className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none font-mono"
              style={{ backgroundColor: isDonker(achtergrondkleur) ? '#1F2937' : '#FFFFFF', color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#111827', borderColor: isDonker(achtergrondkleur) ? '#374151' : '#D1D5DB' }}
            />
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
            Logo
          </label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <img src={logoPreview} alt="Logo" className="h-12 object-contain rounded border border-gray-200 p-1 bg-white" />
            )}
            <button
              onClick={() => logoRef.current?.click()}
              className="px-4 py-2 text-sm border rounded-lg transition-colors"
              style={{ borderColor: primaireKleur, color: isDonker(achtergrondkleur) ? '#F9FAFB' : primaireKleur, backgroundColor: 'transparent' }}
            >
              📁 Kies logo
            </button>
            <input ref={logoRef} type="file" accept=".svg,.png" className="hidden" onChange={handleLogo} />
          </div>
          <p className="text-xs mt-2" style={{ color: isDonker(achtergrondkleur) ? '#9CA3AF' : '#6B7280' }}>
            Aanbevolen: <strong>SVG</strong> (oneindig schaalbaar) of <strong>PNG met transparante achtergrond</strong> · Minimaal 400×400px · Max 500KB
          </p>
        </div>

        {/* Footer upload */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: isDonker(achtergrondkleur) ? '#F9FAFB' : '#374151' }}>
            Footer afbeelding
          </label>
          <div className="flex items-center gap-4">
            {footerPreview && (
              <img src={footerPreview} alt="Footer" className="h-12 object-contain rounded border border-gray-200" />
            )}
            <button
              onClick={() => footerRef.current?.click()}
              className="px-4 py-2 text-sm border rounded-lg transition-colors"
              style={{ borderColor: primaireKleur, color: isDonker(achtergrondkleur) ? '#F9FAFB' : primaireKleur, backgroundColor: 'transparent' }}
            >
              📁 Kies footer afbeelding
            </button>
            <input ref={footerRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleFooter} />
          </div>
          <p className="text-xs mt-2" style={{ color: isDonker(achtergrondkleur) ? '#9CA3AF' : '#6B7280' }}>
            Aanbevolen: <strong>JPG</strong> voor foto's, <strong>PNG</strong> voor transparantie · Resolutie 1920×300px · Max 2MB
          </p>
        </div>

        {/* Footer preview */}
        {footerPreview && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <img src={footerPreview} alt="Footer preview" className="w-full object-cover max-h-32" />
          </div>
        )}

        {/* Opslaan knop */}
        <div className="flex justify-end pt-2">
          <button
            onClick={slaOp}
            disabled={opslaan}
            className="px-8 py-3 font-medium rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: primaireKleur, color: primaireTekstKleur }}
          >
            {opslaan ? 'Opslaan...' : '💾 Branding opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
