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

  const registreren = async () => {
    await msalInstance.loginRedirect({ ...loginRequest, prompt: 'create' })
  }

  const uitloggen = async () => {
    // localStorage clearen bij uitloggen — voorkomt verkeerde branding bij volgende gebruiker
    localStorage.removeItem('companyId')
    setGebruiker(null)
    await msalInstance.logoutRedirect()
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
  const claims = getClaims()

  const rol = (claims['extn.rol'] && claims['extn.rol'][0]) ||
              claims['extension_rol'] ||
              claims['rol'] ||
              'gebruiker'

  const isAdmin = rol === 'admin'

  // Voor admins: localStorage override wint van JWT claim (kunnen switchen tussen organisaties)
  // Voor gewone gebruikers: altijd JWT claim — nooit localStorage
  const companyIdUitJwt = (claims['extn.companyId'] && claims['extn.companyId'][0]) ||
                           claims['extension_companyId'] ||
                           claims['companyId'] ||
                           'default'

  const companyId = (isAdmin && localStorage.getItem('companyId')) || companyIdUitJwt

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
