import { useBranding } from './BrandingContext'
import { useAuth } from './AuthContext'
import { BrandingProvider } from './BrandingContext'
import { AuthProvider } from './AuthContext'

const stappen = [
  {
    nummer: 1,
    icoon: '🔐',
    titel: 'Toegang aanvragen & inloggen',
    beschrijving: 'CV Optimizer is een besloten tool. Vraag toegang aan via peter@pdscloud.nl. Je ontvangt een e-mail met inloggegevens. Ga naar cv-optimizer.pdscloud.nl en log in met je e-mailadres en wachtwoord.',
    tips: [
      'Bij je eerste login moet je een nieuw wachtwoord instellen',
      'Je ziet automatisch de huisstijl van jouw organisatie',
    ],
    screenshot: null
  },
  {
    nummer: 2,
    icoon: '📄',
    titel: 'CV uploaden of plakken',
    beschrijving: 'Upload je CV als PDF of DOCX via de knop "Upload een CV (DOCX of PDF)", of plak de tekst direct in het tekstveld. Na het uploaden kun je het CV direct opslaan als favoriet zodat je het de volgende keer niet opnieuw hoeft te uploaden.',
    tips: [
      'Je kunt maximaal 5 CV\'s opslaan als favoriet',
      'Klik op "⭐ Opgeslagen CV\'s" om een eerder opgeslagen CV te selecteren',
      'De tekst mag maximaal 12.000 tekens zijn',
    ],
    screenshot: null
  },
  {
    nummer: 3,
    icoon: '🔍',
    titel: 'Vacature invullen',
    beschrijving: 'Plak de volledige vacaturetekst in het vacatureveld. Hoe meer details de vacature bevat, hoe beter de analyse. Kopieer de volledige tekst inclusief functie-eisen, taken en bedrijfsinformatie.',
    tips: [
      'Kopieer de volledige vacaturetekst, niet alleen de samenvatting',
      'De vacaturetekst mag maximaal 6.000 tekens zijn',
      'Werkt voor zowel Nederlandse als Engelstalige vacatures',
    ],
    screenshot: null
  },
  {
    nummer: 4,
    icoon: '🤖',
    titel: 'Analyse starten',
    beschrijving: 'Klik op "Analyseer mijn CV". Claude analyseert je CV ten opzichte van de vacature en geeft je een match score (0-100%), een overzicht van ontbrekende en aanwezige keywords, en een tone-of-voice analyse.',
    tips: [
      'De analyse duurt 5-15 seconden',
      'Een score boven 75% is uitstekend',
      'Let op de ontbrekende keywords — die zijn het meest waardevol',
    ],
    screenshot: null
  },
  {
    nummer: 5,
    icoon: '✏️',
    titel: 'Sectie-review doorlopen',
    beschrijving: 'Na de analyse kun je per CV-sectie (Over mij, Werkervaring, Vaardigheden etc.) concrete verbeteringsvoorstellen ontvangen van Claude. Je krijgt twee herschrijfvarianten per sectie met een uitgebreide redenering. Kies de variant die het beste bij je past, of geef een eigen instructie.',
    tips: [
      'Lees de redenering goed — dat is het leerzame deel',
      'Je kunt ook kiezen voor "Anders, namelijk..." en je eigen instructie geven',
      'Je kunt altijd teruggaan naar een eerdere sectie',
    ],
    screenshot: null
  },
  {
    nummer: 6,
    icoon: '⬇️',
    titel: 'CV downloaden',
    beschrijving: 'Na de sectie-review kun je je verbeterde CV downloaden als DOCX (bewerkbaar) of PDF (print-ready). Het DOCX-bestand kun je verder bewerken in Microsoft Word.',
    tips: [
      'DOCX is handig als je nog kleine aanpassingen wilt maken',
      'PDF is het meest geschikt voor sollicitaties',
      'De opmaak blijft netjes behouden in beide formaten',
    ],
    screenshot: null
  }
]

function HoeWerktHetInhoud() {
  const { branding } = useBranding()

  return (
    <div className="min-h-screen" style={{ backgroundColor: branding.achtergrondkleur }}>
      {/* Header met branding */}
      <div className="px-6 py-4 flex items-center gap-4" style={{ backgroundColor: branding.primaire_kleur }}>
        {branding.logo_url && (
          <img src={branding.logo_url} alt={branding.bedrijfsnaam} className="h-10 object-contain"
            onError={(e) => { e.target.style.display = 'none' }} />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{branding.bedrijfsnaam}</h1>
          <p className="text-sm text-white opacity-80">CV Optimizer — Gebruikshandleiding</p>
        </div>
      </div>

      {/* Gekleurde rand boven inhoud */}
      <div className="h-2" style={{ backgroundColor: branding.primaire_kleur, opacity: 0.3 }}></div>

      {/* Hoofdinhoud — wit veld in het midden */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Intro */}
          <div className="p-8 border-b border-gray-100" style={{ backgroundColor: `${branding.primaire_kleur}08` }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Hoe werkt CV Optimizer?</h2>
            <p className="text-gray-600">
              CV Optimizer helpt je om je CV te optimaliseren voor een specifieke vacature. 
              Met behulp van Claude AI krijg je concrete, sectie-specifieke verbeteringsvoorstellen 
              die je kansen op een sollicitatiegesprek vergroten.
            </p>
            <div className="mt-4 flex gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: branding.primaire_kleur }}>6</p>
                <p className="text-xs text-gray-500">stappen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: branding.primaire_kleur }}>&lt;15 min</p>
                <p className="text-xs text-gray-500">gemiddeld</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: branding.primaire_kleur }}>NL + EN</p>
                <p className="text-xs text-gray-500">talen</p>
              </div>
            </div>
          </div>

          {/* Stappen */}
          <div className="divide-y divide-gray-100">
            {stappen.map((stap, index) => (
              <div key={stap.nummer} className="p-8">
                <div className="flex gap-4">
                  {/* Nummer + icoon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                      style={{ backgroundColor: branding.primaire_kleur }}>
                      {stap.nummer}
                    </div>
                  </div>

                  {/* Inhoud */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {stap.icoon} {stap.titel}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{stap.beschrijving}</p>

                    {/* Screenshot placeholder */}
                    {stap.screenshot ? (
                      <img src={stap.screenshot} alt={`Stap ${stap.nummer}`}
                        className="w-full rounded-lg border border-gray-200 mb-4" />
                    ) : (
                      <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${branding.primaire_kleur}05` }}>
                        <p className="text-gray-400 text-sm">📸 Screenshot volgt</p>
                      </div>
                    )}

                    {/* Tips */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${branding.primaire_kleur}08` }}>
                      <p className="text-xs font-semibold uppercase mb-2" style={{ color: branding.primaire_kleur }}>
                        💡 Tips
                      </p>
                      <ul className="space-y-1">
                        {stap.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-gray-600 flex gap-2">
                            <span style={{ color: branding.primaire_kleur }}>→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 text-center" style={{ backgroundColor: `${branding.primaire_kleur}08` }}>
            <p className="text-gray-600 text-sm mb-4">Klaar om te beginnen?</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: branding.primaire_kleur }}
            >
              Terug naar CV Optimizer
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Vragen? Stuur een e-mail naar <a href="mailto:peter@pdscloud.nl" style={{ color: branding.primaire_kleur }}>peter@pdscloud.nl</a>
            </p>
          </div>
        </div>
      </div>

      {/* Gekleurde rand onder inhoud */}
      <div className="h-2" style={{ backgroundColor: branding.primaire_kleur, opacity: 0.3 }}></div>
    </div>
  )
}

export default function HoeWerktHet() {
  // Branding ophalen — companyId uit localStorage voor het geval de gebruiker ingelogd was
  const companyId = localStorage.getItem('companyId') || 'default'

  return (
    <AuthProvider>
      <BrandingProvider companyId={companyId}>
        <HoeWerktHetInhoud />
      </BrandingProvider>
    </AuthProvider>
  )
}
