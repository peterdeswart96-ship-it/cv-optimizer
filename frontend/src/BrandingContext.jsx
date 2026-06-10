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
  const { getToken, companyId: companyIdUitAuth, gebruiker } = useAuth()

  // effectiefCompanyId: admin kan switchen via localStorage, anderen krijgen waarde uit token
  const effectiefCompanyId = (isAdmin && localStorage.getItem('companyId')) || companyId || companyIdUitAuth || 'default'

  useEffect(() => {
    // Wacht tot gebruiker geladen is voordat we branding ophalen
    if (!gebruiker) return

    const laadBranding = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const headers = {
          'Authorization': `Bearer ${token}`
        }

        // Stuur companyId altijd mee als header — backend gebruikt dit als fallback
        // omdat extension attributes alleen in idToken zitten, niet in access token
        if (effectiefCompanyId && effectiefCompanyId !== 'default') {
          headers['X-Company-Id'] = effectiefCompanyId
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
  }, [effectiefCompanyId, gebruiker])

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
