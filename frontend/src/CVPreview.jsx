import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Verwijder markdown opmaak
function stripMarkdown(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

// Vervang em dashes en lange streepjes door bulletpoints
function vervangDashes(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/^[\s]*[–—-]+\s+/gm, '• ')
    .replace(/\n[\s]*[–—-]+\s+/g, '\n• ')
}

function verwerkTekst(tekst) {
  return vervangDashes(stripMarkdown(tekst))
}

// Bepaal of een sectie in de linker of rechter kolom hoort
function bepaalKolom(sectieNaam) {
  const naam = sectieNaam.toUpperCase()
  // Rechterkolom: certificeringen, tools, opleiding
  if (naam.includes('CERTIF') || naam.includes('TOOLS') || naam.includes('TECHNOLOG') || naam.includes('OPLEID')) {
    return 'rechts'
  }
  return 'links'
}

function CVPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { secties, definitieveTeksten, cvTekst } = location.state || {}
  const cvRef = useRef(null)
  const [bewerkenIndex, setBewerkenIndex] = useState(null)
  const [bewerkTeksten, setBewerkTeksten] = useState({})
  const [bewerkWaarden, setBewerkWaarden] = useState({})

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

  const getTekst = (sectie) => {
    const tekst = bewerkTeksten[sectie.naam] ?? definitieveTeksten[sectie.naam] ?? sectie.originele_tekst
    return verwerkTekst(tekst)
  }

  // Parse header uit cvTekst
  const parseHeader = () => {
    if (!cvTekst) return null
    const regels = cvTekst.split('\n')
    const headerRegels = []
    for (const regel of regels) {
      const r = regel.trim()
      if (!r) continue
      if (secties.some(s => r.toUpperCase() === s.naam.toUpperCase())) break
      headerRegels.push(r)
    }
    return headerRegels.length > 0 ? headerRegels : null
  }

  const headerRegels = parseHeader()

  // Splits secties in linker en rechter kolom
  const linksSects = secties.filter(s => bepaalKolom(s.naam) === 'links')
  const rechtsSects = secties.filter(s => bepaalKolom(s.naam) === 'rechts')

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const element = cvRef.current
    const opt = {
      margin: [8, 8, 8, 8],
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

    if (headerRegels) {
      if (headerRegels[0]) children.push(new Paragraph({
        children: [new TextRun({ text: headerRegels[0], bold: true, size: 30, color: 'FFFFFF' })],
        alignment: AlignmentType.LEFT, spacing: { after: 60 },
        shading: { fill: '1a3a5c' }
      }))
      for (let i = 1; i < headerRegels.length; i++) {
        children.push(new Paragraph({
          children: [new TextRun({ text: headerRegels[i], size: 18, color: 'CCDDEE' })],
          spacing: { after: 30 }
        }))
      }
      children.push(new Paragraph({ spacing: { after: 200 } }))
    }

    for (const sectie of secties) {
      const tekst = getTekst(sectie)
      children.push(new Paragraph({
        children: [new TextRun({ text: sectie.naam.toUpperCase(), bold: true, size: 22, color: '1a3a5c' })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a3a5c' } }
      }))
      for (const regel of tekst.split('\n').filter(r => r.trim())) {
        const isBullet = regel.trim().startsWith('•')
        children.push(new Paragraph({
          children: [new TextRun({ text: regel.trim(), size: 19, color: '2d3748' })],
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

  const startBewerken = (i, tekst) => {
    setBewerkenIndex(i)
    setBewerkWaarden(prev => ({ ...prev, [i]: tekst }))
  }

  const slaOp = (sectieNaam, i) => {
    setBewerkTeksten(prev => ({ ...prev, [sectieNaam]: bewerkWaarden[i] }))
    setBewerkenIndex(null)
  }

  // Render één sectie
  const renderSectie = (sectie, i) => {
    const tekst = getTekst(sectie)
    const regels = tekst.split('\n').filter(r => r.trim())

    return (
      <div key={i} style={{ marginBottom: '12px' }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1a3a5c', letterSpacing: '0.8px', textTransform: 'uppercase', borderBottom: '1px solid #1a3a5c', paddingBottom: '2px', display: 'inline-block', width: '100%' }}>
            {sectie.naam}
          </span>
        </div>
        <div style={{ fontSize: '8.5px', color: '#2d3748', lineHeight: '1.5' }}>
          {regels.map((regel, j) => {
            const isBullet = regel.trim().startsWith('•')
            const isVetRegel = regel.match(/^[A-Z][^•\n]{0,60}(–|-–|–\s)/) && !isBullet
            return (
              <div key={j} style={{
                marginBottom: isBullet ? '2px' : '3px',
                paddingLeft: isBullet ? '10px' : '0',
                fontWeight: (regel.includes('Expert') || regel.includes('Engineer') || regel.includes('Specialist') || regel.includes('Engineer')) && j === 0 ? 'bold' : 'normal'
              }}>
                {regel.trim()}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CV Preview</h1>
            <p className="text-xs text-gray-500">Twee-kolommen layout • Gebruik bewerken knoppen hieronder voor aanpassingen</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">← Terug</button>
            <button onClick={downloadDOCX} className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50">↓ Word (.docx)</button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">↓ PDF downloaden</button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Bewerken panel — buiten cvRef */}
        {bewerkenIndex !== null && (
          <div className="bg-white border border-blue-300 rounded-xl p-4 mb-4 shadow">
            <p className="text-sm font-medium text-gray-700 mb-2">
              ✏️ Bewerken: <strong>{secties[bewerkenIndex]?.naam}</strong>
            </p>
            <textarea
              value={bewerkWaarden[bewerkenIndex] ?? ''}
              onChange={(e) => setBewerkWaarden(prev => ({ ...prev, [bewerkenIndex]: e.target.value }))}
              className="w-full h-40 p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex gap-3 mt-2">
              <button onClick={() => slaOp(secties[bewerkenIndex].naam, bewerkenIndex)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Opslaan</button>
              <button onClick={() => setBewerkenIndex(null)} className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">Annuleren</button>
            </div>
          </div>
        )}

        {/* CV Document — alleen dit naar PDF */}
        <div className="bg-white shadow-xl">
          <div ref={cvRef} style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", color: '#2d3748' }}>

            {/* Header — donkerblauw vlak */}
            {headerRegels && (
              <div style={{ backgroundColor: '#1a3a5c', padding: '14px 16px 12px 16px', color: 'white' }}>
                {headerRegels[0] && (
                  <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '3px', textTransform: 'uppercase' }}>
                    {headerRegels[0]}
                  </div>
                )}
                {headerRegels[1] && (
                  <div style={{ fontSize: '10px', color: '#a8c4e0', marginBottom: '4px' }}>
                    {headerRegels[1]}
                  </div>
                )}
                {headerRegels.slice(2).map((regel, i) => (
                  <div key={i} style={{ fontSize: '8.5px', color: '#7aaed0', marginBottom: '1px' }}>
                    {regel}
                  </div>
                ))}
              </div>
            )}

            {/* Twee kolommen */}
            <div style={{ display: 'flex', gap: '0', padding: '0' }}>

              {/* Linker kolom — 55% */}
              <div style={{ flex: '0 0 55%', padding: '14px 12px 14px 16px', borderRight: '1px solid #e2e8f0' }}>
                {linksSects.map((sectie, i) => renderSectie(sectie, secties.indexOf(sectie)))}
              </div>

              {/* Rechter kolom — 45% */}
              <div style={{ flex: '0 0 45%', padding: '14px 16px 14px 12px' }}>
                {rechtsSects.map((sectie, i) => renderSectie(sectie, secties.indexOf(sectie)))}
              </div>

            </div>
          </div>
        </div>

        {/* Bewerken knoppen — buiten cvRef */}
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-3">Sectie bewerken (niet zichtbaar in PDF/Word)</p>
          <div className="flex flex-wrap gap-2">
            {secties.map((sectie, i) => (
              <button
                key={i}
                onClick={() => startBewerken(i, getTekst(sectie))}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${bewerkenIndex === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
              >
                ✏️ {sectie.naam}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Bewerken knoppen zijn niet zichtbaar in de PDF of Word download
        </p>
      </div>
    </div>
  )
}

export default CVPreview
