import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

const defaultBranding = {
  companyId: 'default',
  bedrijfsnaam: 'CV Optimizer',
  welkomsttekst: 'Analyseer je CV ten opzichte van een vacature',
  logo_url: null,
  primaire_kleur: '#111827',
  achtergrondkleur: '#0A0A0A',
  organisatiebalk_kleur: '#FFFFFF'
}

const BrandingContext = createContext(defaultBranding)

export function BrandingProvider({ children, companyId = 'default', isAdmin = false }) {
  const [branding, setBranding] = useState(defaultBranding)
  const { getToken, companyId: companyIdUitAuth } = useAuth()

  // effectiefCompanyId: admin kan switchen via localStorage, anderen krijgen waarde uit token
  const effectiefCompanyId = (isAdmin && localStorage.getItem('companyId')) || companyId

  useEffect(() => {
    const laadBranding = async () => {
      try {
        const token = await getToken()
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        // Stuur companyId mee als header — backend gebruikt dit als de JWT claim ontbreekt
        // Dit is nodig omdat extension attributes alleen in idToken zitten, niet in access token
        const cidVoorHeader = effectiefCompanyId || companyIdUitAuth || 'default'
        if (cidVoorHeader && cidVoorHeader !== 'default') {
          headers['X-Company-Id'] = cidVoorHeader
        }

        const res = await fetch(`${BACKEND}/branding`, { headers })
        if (!res.ok) return

        const data = await res.json()
        setBranding(data)
        document.documentElement.style.setProperty('--kleur-primair', data.primaire_kleur)
        document.documentElement.style.setProperty('--kleur-achtergrond', data.achtergrondkleur)
        document.body.style.backgroundColor = data.achtergrondkleur
      } catch {
        // Fallback naar default branding bij fout
      }
    }

    laadBranding()
  }, [effectiefCompanyId, companyIdUitAuth])

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
