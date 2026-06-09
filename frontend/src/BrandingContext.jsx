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
  const { getToken } = useAuth()

  // companyId voor admin-switcher — de backend leest het altijd uit het JWT-token,
  // maar we gebruiken companyId hier als trigger om opnieuw te laden bij wisselen
  const effectiefCompanyId = (isAdmin && localStorage.getItem('companyId')) || companyId

  useEffect(() => {
    const laadBranding = async () => {
      try {
        const token = await getToken()
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        // Geen query parameter meer — backend leest companyId uit JWT-token
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
  }, [effectiefCompanyId])

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
