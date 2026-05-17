import { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function CVPreview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { secties, definitieveTeksten, naam } = location.state || {}
  const cvRef = useRef(null)

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

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const element = cvRef.current
    const opt = {
      margin: [15, 15, 15, 15],
      filename: 'cv-verbeterd.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  const downloadDOCX = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx')

    const children = []

    // Naam als titel
    if (naam) {
      children.push(new Paragraph({
        children: [new TextRun({ text: naam.toUpperCase(), bold: true, size: 32, color: '1a1a2e' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }))
    }

    // Secties
    for (const sectie of secties) {
      const tekst = definitieveTeksten[sectie.naam] || sectie.originele_tekst

      // Sectie heading
      children.push(new Paragraph({
        children: [new TextRun({ text: sectie.naam.toUpperCase(), bold: true, size: 22, color: '2c3e50' })],
        spacing: { before: 300, after: 100 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'cccccc' }
        }
      }))

      // Sectie tekst per regel
      const regels = tekst.split('\n').filter(r => r.trim())
      for (const regel of regels) {
        children.push(new Paragraph({
          children: [new TextRun({ text: regel.trim(), size: 20 })],
          spacing: { after: 80 }
        }))
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }]
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cv-verbeterd.docx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CV Preview</h1>
            <p className="text-xs text-gray-500 mt-0.5">Controleer je CV en download</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Terug
            </button>
            <button
              onClick={downloadDOCX}
              className="px-4 py-2 border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50 transition-colors"
            >
              ↓ Word (.docx)
            </button>
            <button
              onClick={downloadPDF}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              ↓ PDF downloaden
            </button>
          </div>
        </div>
      </div>

      {/* CV Preview */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">

          {/* CV Document */}
          <div ref={cvRef} className="p-12" style={{ fontFamily: 'Georgia, serif', minHeight: '297mm' }}>

            {/* Naam header */}
            {naam && (
              <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  {naam}
                </h1>
              </div>
            )}

            {/* Secties */}
            {secties.map((sectie, i) => {
              const tekst = definitieveTeksten[sectie.naam] || sectie.originele_tekst
              const regels = tekst.split('\n').filter(r => r.trim())

              return (
                <div key={i} className="mb-6">
                  {/* Sectie titel */}
                  <div style={{ borderBottom: '1.5px solid #2c3e50', marginBottom: '8px', paddingBottom: '4px' }}>
                    <h2 style={{ fontSize: '11px', fontWeight: 'bold', color: '#2c3e50', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                      {sectie.naam}
                    </h2>
                  </div>

                  {/* Sectie tekst */}
                  <div style={{ fontSize: '10.5px', color: '#333', lineHeight: '1.6' }}>
                    {regels.map((regel, j) => (
                      <p key={j} style={{ margin: '0 0 4px 0' }}>{regel}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Tip: gebruik de PDF download voor de beste opmaak
        </p>
      </div>
    </div>
  )
}

export default CVPreview
