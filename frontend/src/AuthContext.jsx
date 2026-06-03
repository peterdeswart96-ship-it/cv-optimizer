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
      // Accounts checken bij laden
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        setGebruiker(accounts[0])
      }

      // Redirect afhandelen na login
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

  // companyId en rol uit token lezen — Entra External ID gebruikt extension_ prefix
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
