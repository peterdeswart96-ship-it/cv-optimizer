import { createContext, useContext, useState, useEffect } from 'react'
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalConfig, loginRequest } from './authConfig'

// ─── MSAL instantie (buiten component zodat hij niet herinitialiseerd wordt) ──
const msalInstance = new PublicClientApplication(msalConfig)
await msalInstance.initialize()
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// Extension attribute voor companyId — zelfde naam als in de backend
const COMPANY_ID_CLAIM = 'extension_6248a5e084184d4796919f8b07dc5723_companyId'

function getCompanyIdUitToken(account) {
  if (!account) return null
  // Probeer de claim uit idTokenClaims (meest betrouwbaar)
  const claims = account.idTokenClaims || {}
  return claims[COMPANY_ID_CLAIM] || claims['extn.companyId'] || null
}

function getIsAdminUitToken(account) {
  if (!account) return false
  const claims = account.idTokenClaims || {}
  // Controleer of het een admin-account is op basis van specifieke gebruikers-IDs
  const adminIds = [
    '6b736f58-cd68-430f-9acd-f7e07fe2fc4e' // Peter de Swart
  ]
  return adminIds.includes(account.localAccountId) || adminIds.includes(claims.oid)
}

export function AuthProvider({ children }) {
  const [gebruiker, setGebruiker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verwerk terugkeer van redirect login
    msalInstance.handleRedirectPromise()
      .then((result) => {
        if (result?.account) {
          msalInstance.setActiveAccount(result.account)
        }
        const account = msalInstance.getActiveAccount()
          || msalInstance.getAllAccounts()[0]
          || null
        setGebruiker(account)
      })
      .catch((err) => {
        console.error('MSAL redirect fout:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const inloggen = async () => {
    try {
      await msalInstance.loginRedirect(loginRequest)
    } catch (err) {
      console.error('Inloggen mislukt:', err)
    }
  }

  const uitloggen = () => {
    // ── Security: verwijder alle lokale state bij uitloggen ──────────────────
    // localStorage companyId cleanup — voorkomt dat admin-override zichtbaar
    // blijft voor de volgende gebruiker op hetzelfde apparaat
    localStorage.removeItem('companyId')
    // ────────────────────────────────────────────────────────────────────────

    const account = msalInstance.getActiveAccount()
    msalInstance.logoutRedirect({
      account,
      postLogoutRedirectUri: window.location.origin
    })
  }

  const getToken = async () => {
    const account = msalInstance.getActiveAccount()
      || msalInstance.getAllAccounts()[0]
    if (!account) return null

    try {
      const result = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account
      })
      return result.accessToken
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Token verlopen of interactie vereist — redirect naar login
        await msalInstance.acquireTokenRedirect({ ...loginRequest, account })
      }
      console.error('Token ophalen mislukt:', err)
      return null
    }
  }

  // companyId bepalen:
  // 1. Als admin: localStorage override (voor switchen tussen organisaties)
  // 2. Anders: altijd uit JWT-token (voorkomt manipulatie door gewone gebruikers)
  const isAdmin = getIsAdminUitToken(gebruiker)
  const companyIdUitToken = getCompanyIdUitToken(gebruiker)

  let companyId
  if (isAdmin) {
    // Admins mogen localStorage gebruiken voor de org-switcher
    companyId = localStorage.getItem('companyId') || companyIdUitToken || 'default'
  } else {
    // Gewone gebruikers: ALTIJD uit token, localStorage wordt genegeerd
    companyId = companyIdUitToken || 'default'
  }

  return (
    <AuthContext.Provider value={{
      gebruiker,
      loading,
      inloggen,
      uitloggen,
      getToken,
      isAdmin,
      companyId
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden')
  }
  return context
}
