import { createContext, useContext, useState, useEffect } from 'react'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig, loginRequest } from './authConfig'

const msalInstance = new PublicClientApplication(msalConfig)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [gebruiker, setGebruiker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    msalInstance.initialize().then(() => {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        setGebruiker(accounts[0])
      }

      msalInstance.handleRedirectPromise().then(response => {
        if (response?.account) {
          setGebruiker(response.account)
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    })
  }, [])

  const inloggen = async () => {
    await msalInstance.loginRedirect(loginRequest)
  }

  // Directe link naar sign-up pagina van Entra External ID
  const registreren = async () => {
    await msalInstance.loginRedirect({ ...loginRequest, prompt: 'create' })
  }

  const uitloggen = async () => {
    await msalInstance.logoutRedirect()
    setGebruiker(null)
  }

  const getToken = async () => {
    if (!gebruiker) return null
    try {
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: gebruiker
      })
      return response.idToken
    } catch {
      await msalInstance.acquireTokenRedirect(loginRequest)
      return null
    }
  }

  const getClaims = () => gebruiker?.idTokenClaims || {}

  const companyId = getClaims()['extension_companyId'] ||
                    getClaims()['companyId'] ||
                    localStorage.getItem('companyId') ||
                    'default'

  const rol = getClaims()['extension_rol'] ||
              getClaims()['rol'] ||
              'gebruiker'

  const isAdmin = rol === 'admin'

  return (
    <AuthContext.Provider value={{
      gebruiker,
      loading,
      inloggen,
      registreren,
      uitloggen,
      getToken,
      companyId,
      rol,
      isAdmin
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
