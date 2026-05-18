import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx'

function stripMarkdown(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

function vervangDashes(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/^[\s]*[–—]+\s*/gm, '• ')
    .replace(/\n[\s]*[–—]+\s*/g, '\n• ')
}

function verwerkTekst(tekst) {
  return vervangDashes(stripMarkdown(tekst))
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

  const downloadPDF = async () => {
    const element = cvRef.current
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'cv-verbeterd.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const downloadDOCX = async () => {
    const children = []

    if (headerRegels) {
      if (headerRegels[0]) children.push(new Paragraph({
        children: [new TextRun({ text: headerRegels[0], bold: true, size: 30, color: '1a3a5c' })],
        alignment: AlignmentType.LEFT, spacing: { after: 60 }
      }))
      if (headerRegels[1]) children.push(new Paragraph({
        children: [new TextRun({ text: headerRegels[1], size: 22, color: '4a5568' })],
        spacing: { after: 60 }
      }))
      for (let i = 2; i < headerRegels.length; i++) {
        children.push(new Paragraph({
          children: [new TextRun({ text: headerRegels[i], size: 18, color: '718096' })],
          spacing: { after: 30 }
        }))
      }
      children.push(new Paragraph({ spacing: { after: 200 } }))
    }

    for (const sectie of secties) {
      const tekst = getTekst(sectie)
      children.push(new Paragraph({
        children: [new TextRun({ text: sectie.naam.toUpperCase(), bold: true, size: 20, color: '1a3a5c' })],
        spacing: { before: 300, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a3a5c' } }
      }))
      for (const regel of tekst.split('\n').filter(r => r.trim())) {
        const isBullet = regel.trim().startsWith('•')
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

  const startBewerken = (i, tekst) => {
    setBewerkenIndex(i)
    setBewerkWaarden(prev => ({ ...prev, [i]: tekst }))
  }

  const slaOp = (sectieNaam, i) => {
    setBewerkTeksten(prev => ({ ...prev, [sectieNaam]: bewerkWaarden[i] }))
    setBewerkenIndex(null)
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CV Preview</h1>
            <p className="text-xs text-gray-500">Gebruik de bewerken knoppen hieronder voor aanpassingen</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">← Terug</button>
            <button onClick={downloadDOCX} className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50">↓ Word (.docx)</button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">↓ PDF downloaden</button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Bewerken panel — buiten cvRef */}
        {bewerkenIndex !== null && (
          <div className="bg-white border border-blue-300 rounded-xl p-4 mb-4 shadow">
            <p className="text-sm font-medium text-gray-700 mb-2">
              ✏️ Bewerken: <strong>{secties[bewerkenIndex]?.naam}</strong>
            </p>
            <textarea
              value={bewerkWaarden[bewerkenIndex] ?? ''}
              onChange={(e) => setBewerkWaarden(prev => ({ ...prev, [bewerkenIndex]: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minHeight: `${Math.max(120, ((bewerkWaarden[bewerkenIndex] ?? '').split('\n').length + 10) * 22)}px` }}
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
              <div style={{ backgroundColor: '#1a3a5c', padding: '16px 20px 14px 20px', color: 'white' }}>
                {headerRegels[0] && (
                  <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '3px', textTransform: 'uppercase' }}>
                    {headerRegels[0]}
                  </div>
                )}
                {headerRegels[1] && (
                  <div style={{ fontSize: '11px', color: '#a8c4e0', marginBottom: '5px' }}>
                    {headerRegels[1]}
                  </div>
                )}
                {headerRegels.slice(2).map((regel, i) => (
                  <div key={i} style={{ fontSize: '9px', color: '#7aaed0', marginBottom: '1px' }}>
                    {regel}
                  </div>
                ))}
              </div>
            )}

            {/* Alle secties onder elkaar */}
            <div style={{ padding: '16px 20px' }}>
              {secties.map((sectie, i) => {
                const tekst = getTekst(sectie)
                const regels = tekst.split('\n').filter(r => r.trim())

                return (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    {/* Sectie titel */}
                    <div style={{ borderBottom: '1.5px solid #1a3a5c', marginBottom: '6px', paddingBottom: '2px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1a3a5c', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        {sectie.naam}
                      </span>
                    </div>

                    {/* Sectie tekst */}
                    <div style={{ fontSize: '9.5px', lineHeight: '1.6', color: '#2d3748' }}>
                      {regels.map((regel, j) => {
                        const isBullet = regel.trim().startsWith('•')
                        return (
                          <div key={j} style={{
                            marginBottom: isBullet ? '2px' : '3px',
                            paddingLeft: isBullet ? '12px' : '0',
                          }}>
                            {stripMarkdown(regel.trim())}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
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
