import { useAuth } from './AuthContext'

export default function LoginScherm() {
  const { inloggen } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CV Optimizer</h1>
          <p className="text-gray-500 text-sm">
            Analyseer en verbeter je CV met behulp van AI
          </p>
        </div>
        <button
          onClick={inloggen}
          className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors mb-3"
        >
          Inloggen
        </button>
        <a
          href="mailto:peter@pdscloud.nl?subject=Toegang aanvragen CV Optimizer&body=Hoi Peter, ik wil graag toegang tot de CV Optimizer. Mijn naam: Mijn organisatie: Met vriendelijke groet"
          className="block w-full px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors mb-4 text-center"
        >
          Toegang aanvragen
        </a>
        <p className="text-xs text-gray-400">
          Je account wordt geactiveerd na goedkeuring van de beheerder.
        </p>
      </div>
    </div>
  )
}
