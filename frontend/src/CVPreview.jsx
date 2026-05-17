import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Verwijder markdown opmaak zoals **tekst** en *tekst*
function stripMarkdown(tekst) {
  return tekst
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

function CVPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { secties, definitieveTeksten, cvTekst } = location.state || {}
  const cvRef = useRef(null)
  const [bewerkenIndex, setBewerkenIndex] = useState(null)
  const [bewerkTeksten, setBewerkTeksten] = useState({})

  if (!secties) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Geen CV data gevonden.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            ← Terug naar analyse
          </button>
        </div>
      </div>
    )
  }

  // Haal de definitieve tekst op voor een sectie
  const getTekst = (sectie) => {
    const tekst = bewerkTeksten[sectie.naam] ?? definitieveTeksten[sectie.naam] ?? sectie.originele_tekst
    return stripMarkdown(tekst)
  }

  // Parse de header (naam + contactgegevens) uit de originele cvTekst
  // De header zijn de regels VOOR de eerste sectienaam
  const parseHeader = () => {
    if (!cvTekst) return null
    const eersteSectieLijn = secties[0]?.naam?.toUpperCase()
    const regels = cvTekst.split('\n')
    const headerRegels = []
    for (const regel of regels) {
      const regelTrimmed = regel.trim()
      if (!regelTrimmed) continue
      // Stop als we een sectienaam tegenkomen
      if (secties.some(s => regelTrimmed.toUpperCase() === s.naam.toUpperCase())) break
      headerRegels.push(regelTrimmed)
    }
    return headerRegels.length > 0 ? headerRegels : null
  }

  const headerRegels = parseHeader()

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const element = cvRef.current
    const opt = {
      margin: [12, 12, 12, 12],
      filename: 'cv-verbeterd.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const downloadDOCX = async () => {
    const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx')
    const children = []

    // Header
    if (headerRegels) {
      if (headerRegels[0]) {
        children.push(new Paragraph({
          children: [new TextRun({ text: headerRegels[0], bold: true, size: 28, color: '1e3a5f' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 }
        }))
      }
      if (headerRegels[1]) {
        children.push(new Paragraph({
          children: [new TextRun({ text: headerRegels[1], size: 22, color: '4a5568' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 }
        }))
      }
      for (let i = 2; i < headerRegels.length; i++) {
        children.push(new Paragraph({
          children: [new TextRun({ text: headerRegels[i], size: 18, color: '718096' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 }
        }))
      }
      children.push(new Paragraph({ spacing: { after: 200 } }))
    }

    // Secties
    for (const sectie of secties) {
      const tekst = getTekst(sectie)
      children.push(new Paragraph({
        children: [new TextRun({ text: sectie.naam.toUpperCase(), bold: true, size: 20, color: '1e3a5f' })],
        spacing: { before: 300, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1e3a5f' } }
      }))
      const regels = tekst.split('\n').filter(r => r.trim())
      for (const regel of regels) {
        const isBullet = regel.trim().startsWith('-') || regel.trim().startsWith('–') || regel.trim().startsWith('•')
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMarkdown(regel.trim()), size: 19, color: '2d3748' })],
          indent: isBullet ? { left: 200 } : {},
          spacing: { after: 60 }
        }))
      }
    }

    const doc = new Document({ sections: [{ properties: {}, children }] })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cv-verbeterd.docx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const slaBewerkenOp = (sectieNaam, tekst) => {
    setBewerkTeksten(prev => ({ ...prev, [sectieNaam]: tekst }))
    setBewerkenIndex(null)
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CV Preview</h1>
            <p className="text-xs text-gray-500">Klik op ✏️ om een sectie te bewerken</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
              ← Terug
            </button>
            <button onClick={downloadDOCX} className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50 transition-colors">
              ↓ Word (.docx)
            </button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              ↓ PDF downloaden
            </button>
          </div>
        </div>
      </div>

      {/* CV Document */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-xl">
          <div ref={cvRef} style={{ padding: '20mm 18mm', fontFamily: "'Arial', sans-serif", color: '#2d3748', lineHeight: '1.5' }}>

            {/* Header — naam en contactgegevens */}
            {headerRegels && (
              <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #1e3a5f' }}>
                {headerRegels[0] && (
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '1px', marginBottom: '4px' }}>
                    {headerRegels[0]}
                  </div>
                )}
                {headerRegels[1] && (
                  <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '4px' }}>
                    {headerRegels[1]}
                  </div>
                )}
                {headerRegels.slice(2).map((regel, i) => (
                  <div key={i} style={{ fontSize: '10px', color: '#718096', marginBottom: '2px' }}>
                    {regel}
                  </div>
                ))}
              </div>
            )}

            {/* CV Secties */}
            {secties.map((sectie, i) => {
              const tekst = getTekst(sectie)
              const regels = tekst.split('\n').filter(r => r.trim())
              const isBewerken = bewerkenIndex === i

              return (
                <div key={i} style={{ marginBottom: '14px' }}>
                  {/* Sectie titel */}
                  <div style={{ borderBottom: '1.5px solid #1e3a5f', marginBottom: '6px', paddingBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      {sectie.naam}
                    </span>
                    {!isBewerken && (
                      <button
                        onClick={() => setBewerkenIndex(i)}
                        style={{ fontSize: '8px', color: '#718096', background: 'none', border: '1px solid #cbd5e0', borderRadius: '3px', padding: '1px 6px', cursor: 'pointer' }}
                        className="no-print"
                      >
                        ✏️ bewerken
                      </button>
                    )}
                  </div>

                  {/* Bewerkmodus */}
                  {isBewerken ? (
                    <div className="no-print">
                      <textarea
                        defaultValue={tekst}
                        id={`bewerk-${i}`}
                        style={{ width: '100%', minHeight: '120px', fontSize: '10px', fontFamily: 'monospace', padding: '8px', border: '1px solid #3b82f6', borderRadius: '4px', outline: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          onClick={() => slaBewerkenOp(sectie.naam, document.getElementById(`bewerk-${i}`).value)}
                          style={{ fontSize: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => setBewerkenIndex(null)}
                          style={{ fontSize: '10px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '9.5px', color: '#2d3748', lineHeight: '1.55' }}>
                      {regels.map((regel, j) => {
                        const isBullet = regel.trim().startsWith('-') || regel.trim().startsWith('–') || regel.trim().startsWith('•')
                        return (
                          <div key={j} style={{ marginBottom: '3px', paddingLeft: isBullet ? '12px' : '0' }}>
                            {stripMarkdown(regel.trim())}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Tip: gebruik de PDF download voor de beste opmaak • Klik ✏️ bewerken voor last-minute aanpassingen
        </p>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  )
}

export default CVPreview
