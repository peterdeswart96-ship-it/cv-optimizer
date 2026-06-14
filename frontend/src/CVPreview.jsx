import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx'
import RichTextEditor from './RichTextEditor'
import {
  maakBlokken,
  renderBlokken,
  blokken2DocxParagraphs,
  parseHeader,
  tekst2Html
} from './cvUtils.jsx'

function CVPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { secties, definitieveTeksten, cvTekst, cvHtml } = location.state || {}
  const cvRef = useRef(null)

  // bewerkenIndex: welke sectie is nu inline aan het bewerken
  const [bewerkenIndex, setBewerkenIndex] = useState(null)

  // opgeslagen teksten per sectienaam (na opslaan in editor)
  const [bewerkTeksten, setBewerkTeksten] = useState({})

  // live HTML per sectie-index (tijdens bewerken)
  const [bewerkHtml, setBewerkHtml] = useState({})

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

  // ── Tekst ophalen per sectie ─────────────────────────────────────────────
  const getTekst = (sectie) => {
    return bewerkTeksten[sectie.naam]
      ?? definitieveTeksten?.[sectie.naam]
      ?? sectie.originele_tekst
      ?? ''
  }

  const getHtml = (sectie, i) => {
    // Als er een live HTML is tijdens bewerken, gebruik die
    if (bewerkHtml[i] !== undefined) return bewerkHtml[i]
    // Anders: converteer de opgeslagen tekst naar HTML voor de editor
    return tekst2Html(getTekst(sectie))
  }

  const headerRegels = parseHeader(cvTekst, secties)

  // ── Sectie bewerken starten ──────────────────────────────────────────────
  const startBewerken = (i, sectie) => {
    setBewerkenIndex(i)
    // Initialiseer de HTML voor de editor als die nog niet bestaat
    if (bewerkHtml[i] === undefined) {
      setBewerkHtml(prev => ({ ...prev, [i]: tekst2Html(getTekst(sectie)) }))
    }
  }

  // ── Sectie opslaan ───────────────────────────────────────────────────────
  const slaOp = (sectieNaam, i) => {
    // Sla de plain tekst op vanuit de huidige HTML
    const html = bewerkHtml[i] || ''
    // Converteer HTML terug naar plain tekst voor opslag en analyse
    const plainTekst = html
      .replace(/<h[1-6][^>]*>/gi, '')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    setBewerkTeksten(prev => ({ ...prev, [sectieNaam]: plainTekst }))
    setBewerkenIndex(null)
  }

  const annuleerBewerken = (i) => {
    // Reset de HTML naar de opgeslagen staat
    setBewerkHtml(prev => {
      const nieuw = { ...prev }
      delete nieuw[i]
      return nieuw
    })
    setBewerkenIndex(null)
  }

  // ── PDF download ─────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    // Zorg dat geen sectie in bewerkingsmodus staat bij download
    if (bewerkenIndex !== null) {
      alert('Sla de huidige bewerking eerst op voordat je downloadt.')
      return
    }
    const element = cvRef.current
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'cv-verbeterd.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }
    html2pdf().set(opt).from(element).save()
  }

  // ── DOCX download ────────────────────────────────────────────────────────
  const downloadDOCX = async () => {
    if (bewerkenIndex !== null) {
      alert('Sla de huidige bewerking eerst op voordat je downloadt.')
      return
    }
    const children = []

    if (headerRegels.length > 0) {
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
      const blokken = maakBlokken(tekst, null)
      children.push(new Paragraph({
        children: [new TextRun({ text: sectie.naam.toUpperCase(), bold: true, size: 20, color: '1a3a5c' })],
        spacing: { before: 300, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a3a5c' } }
      }))
      children.push(...blokken2DocxParagraphs(blokken, { Paragraph, TextRun }))
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

  return (
    <div className="min-h-screen bg-gray-200">

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CV Preview</h1>
            <p className="text-xs text-gray-500">
              {bewerkenIndex !== null
                ? `✏️ Bezig met bewerken: ${secties[bewerkenIndex]?.naam}`
                : 'Klik op ✏️ in een sectie om die te bewerken'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
              ← Terug
            </button>
            <button onClick={downloadDOCX} className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50">
              ↓ Word (.docx)
            </button>
            <button onClick={downloadPDF} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              ↓ PDF downloaden
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── CV Document — alleen dit blok naar PDF ── */}
        <div className="bg-white shadow-xl">
          <div ref={cvRef} style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", color: '#2d3748' }}>

            {/* Header — donkerblauw vlak */}
            {headerRegels.length > 0 && (
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
                  <div key={i} style={{ fontSize: '9px', color: '#7aaed0', marginBottom: '1px' }}>{regel}</div>
                ))}
              </div>
            )}

            {/* Secties */}
            <div style={{ padding: '16px 20px' }}>
              {secties.map((sectie, i) => {
                const isBezig = bewerkenIndex === i
                const tekst = getTekst(sectie)
                const blokken = maakBlokken(tekst, null)

                return (
                  <div key={i} style={{ marginBottom: '14px' }}>

                    {/* Sectie titel + bewerk knop */}
                    <div style={{
                      borderBottom: isBezig ? '1.5px solid #3b82f6' : '1.5px solid #1a3a5c',
                      marginBottom: '6px',
                      paddingBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: isBezig ? '#3b82f6' : '#1a3a5c',
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase'
                      }}>
                        {sectie.naam}
                      </span>

                      {/* Inline bewerk/opslaan knoppen */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {isBezig ? (
                          <>
                            <button
                              onClick={() => slaOp(sectie.naam, i)}
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Opslaan
                            </button>
                            <button
                              onClick={() => annuleerBewerken(i)}
                              style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                backgroundColor: 'transparent',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startBewerken(i, sectie)}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: 'transparent',
                              color: '#9ca3af',
                              border: '1px solid transparent',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.target.style.color = '#1a3a5c'
                              e.target.style.borderColor = '#1a3a5c'
                            }}
                            onMouseLeave={e => {
                              e.target.style.color = '#9ca3af'
                              e.target.style.borderColor = 'transparent'
                            }}
                          >
                            ✏️ bewerken
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sectie inhoud: editor of preview */}
                    {isBezig ? (
                      // ── Inline editor (buiten cvRef via pointer-events none op cvRef) ──
                      <div style={{ margin: '0 -4px' }}>
                        <RichTextEditor
                          content={getHtml(sectie, i)}
                          onChange={(html) => {
                            setBewerkHtml(prev => ({ ...prev, [i]: html }))
                          }}
                          minHeight={120}
                        />
                        <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', marginLeft: '2px' }}>
                          Gebruik B voor vet, H2/H3 voor tussenkopjes, • lijst voor bullets
                        </p>
                      </div>
                    ) : (
                      // ── Normale weergave ──
                      <div>
                        {renderBlokken(blokken, 'document')}
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {/* ── einde CV Document ── */}

        <p className="text-center text-xs text-gray-400 mt-3">
          Klik op ✏️ bewerken naast een sectietitel om die sectie aan te passen
        </p>
      </div>
    </div>
  )
}

export default CVPreview
