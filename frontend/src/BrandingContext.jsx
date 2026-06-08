import { createContext, useContext, useEffect, useState } from 'react'

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

  const effectiefCompanyId = (isAdmin && localStorage.getItem('companyId')) || companyId

  useEffect(() => {
    fetch(`${BACKEND}/branding?companyId=${effectiefCompanyId}`)
      .then(res => res.json())
      .then(data => {
        setBranding(data)
        document.documentElement.style.setProperty('--kleur-primair', data.primaire_kleur)
        document.documentElement.style.setProperty('--kleur-achtergrond', data.achtergrondkleur)
        document.body.style.backgroundColor = data.achtergrondkleur
      })
      .catch(() => {})
  }, [effectiefCompanyId])

  return (
    <BrandingContext.Provider value={{ branding }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
