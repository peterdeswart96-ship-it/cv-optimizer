import { createContext, useContext, useEffect, useState } from 'react'

const BACKEND = 'https://func-cv-optimizer-linux.azurewebsites.net/api'

const defaultBranding = {
  companyId: 'default',
  bedrijfsnaam: 'CV Optimizer',
  welkomsttekst: 'Analyseer je CV ten opzichte van een vacature',
  logo_url: null,
  primaire_kleur: '#6366F1',
  achtergrondkleur: '#F8FAFC'
}

const BrandingContext = createContext(defaultBranding)

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(defaultBranding)
  const [companyId, setCompanyId] = useState(localStorage.getItem('companyId') || 'default')

  useEffect(() => {
    fetch(`${BACKEND}/branding?companyId=${companyId}`)
      .then(res => res.json())
      .then(data => {
        setBranding(data)
        // CSS custom properties dynamisch zetten zodat Tailwind ze kan gebruiken
        document.documentElement.style.setProperty('--kleur-primair', data.primaire_kleur)
        document.documentElement.style.setProperty('--kleur-achtergrond', data.achtergrondkleur)
        // Achtergrondkleur op de body zetten
        document.body.style.backgroundColor = data.achtergrondkleur
      })
      .catch(() => {
        // Bij fout: standaard branding behouden
      })
  }, [companyId])

  return (
    <BrandingContext.Provider value={{ branding, companyId, setCompanyId }}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
