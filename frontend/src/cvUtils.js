// cvUtils.js — gedeelde CV render utilities
// Gebruikt door CVPreview.jsx en SectieReview.jsx

// ─── Tekst opschonen ────────────────────────────────────────────────────────

export function stripMarkdown(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

export function vervangDashes(tekst) {
  if (!tekst) return ''
  return tekst
    .replace(/^[\s]*[-–—]+\s*/gm, '• ')
    .replace(/\n[\s]*[-–—]+\s*/g, '\n• ')
}

export function verwerkTekst(tekst) {
  if (!tekst) return ''
  return vervangDashes(stripMarkdown(tekst))
}

// ─── Regel-type detectie ────────────────────────────────────────────────────
// Detecteert het type van een enkele regel op basis van inhoud/patroon

export function detecteerRegelType(regel) {
  const r = regel.trim()
  if (!r) return 'leeg'

  // Bullet punt
  if (r.startsWith('•') || r.startsWith('-') || r.startsWith('–') || r.startsWith('—')) {
    return 'bullet'
  }

  // Subkop: korte regel (<= 60 tekens), eindigt NIET op leesteken, geen lowercase begin
  // Patronen: "Functietitel — Bedrijf", "2018 – 2022", "Senior Engineer | Blacktang"
  const isKort = r.length <= 70
  const eindigtOpLeesteken = /[.,;]$/.test(r)
  const heeftJarenPatroon = /\b(19|20)\d{2}\b/.test(r)
  const heeftScheidingsteken = /[|•·–—\/]/.test(r)

  if (isKort && !eindigtOpLeesteken && (heeftJarenPatroon || heeftScheidingsteken)) {
    return 'subkop'
  }

  // Alles hoofdletters + kort = subkop (bijv. "MICROSOFT AZURE")
  if (r === r.toUpperCase() && r.length <= 50 && /[A-Z]/.test(r)) {
    return 'subkop'
  }

  return 'tekst'
}

// ─── Tekst → blokken ────────────────────────────────────────────────────────
// Converteert een platte tekst string naar een array van getypeerde blokken

export function tekst2Blokken(tekst) {
  if (!tekst) return []
  const verwerkt = verwerkTekst(tekst)
  const regels = verwerkt.split('\n')
  const blokken = []

  for (let i = 0; i < regels.length; i++) {
    const regel = regels[i]
    const type = detecteerRegelType(regel)

    if (type === 'leeg') {
      // Alleen een witregel toevoegen als de vorige ook geen witregel was
      if (blokken.length > 0 && blokken[blokken.length - 1].type !== 'witregel') {
        blokken.push({ type: 'witregel' })
      }
      continue
    }

    blokken.push({
      type,
      tekst: type === 'bullet'
        ? regel.trim().replace(/^[•\-–—]\s*/, '') // prefix weghalen, renderen doen we zelf
        : stripMarkdown(regel.trim())
    })
  }

  // Trailing witregels weghalen
  while (blokken.length > 0 && blokken[blokken.length - 1].type === 'witregel') {
    blokken.pop()
  }

  return blokken
}

// ─── CV Header parser ───────────────────────────────────────────────────────
// Pakt de regels bovenaan het CV die vóór de eerste sectienaam staan

export function parseHeader(cvTekst, secties) {
  if (!cvTekst || !secties?.length) return []
  const regels = cvTekst.split('\n')
  const sectieNamen = secties.map(s => s.naam.toUpperCase())
  const headerRegels = []

  for (const regel of regels) {
    const r = regel.trim()
    if (!r) continue
    if (sectieNamen.includes(r.toUpperCase())) break
    headerRegels.push(r)
  }

  return headerRegels
}

// ─── React render helpers ───────────────────────────────────────────────────
// Rendert een array van blokken als React elementen
// Gebruik: import { renderBlokken } from './cvUtils'

export function renderBlokken(blokken, stijl = 'preview') {
  // stijl = 'preview' (in SectieReview) of 'document' (in CVPreview)
  const isDocument = stijl === 'document'

  return blokken.map((blok, i) => {
    if (blok.type === 'witregel') {
      return (
        <div
          key={i}
          style={{ height: isDocument ? '6px' : '8px' }}
          aria-hidden="true"
        />
      )
    }

    if (blok.type === 'bullet') {
      return (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: isDocument ? '8px' : '10px',
            paddingLeft: isDocument ? '4px' : '6px',
            marginBottom: isDocument ? '2px' : '3px',
            fontSize: isDocument ? '9.5px' : '13px',
            lineHeight: isDocument ? '1.5' : '1.6',
            color: isDocument ? '#2d3748' : '#374151',
          }}
        >
          <span style={{ color: '#1a3a5c', flexShrink: 0, marginTop: '1px' }}>•</span>
          <span>{blok.tekst}</span>
        </div>
      )
    }

    if (blok.type === 'subkop') {
      return (
        <div
          key={i}
          style={{
            fontSize: isDocument ? '9.5px' : '13px',
            fontWeight: '600',
            color: isDocument ? '#1a3a5c' : '#1e3a5f',
            marginTop: isDocument ? '6px' : '8px',
            marginBottom: isDocument ? '2px' : '3px',
            lineHeight: isDocument ? '1.4' : '1.5',
          }}
        >
          {blok.tekst}
        </div>
      )
    }

    // type === 'tekst'
    return (
      <div
        key={i}
        style={{
          fontSize: isDocument ? '9.5px' : '13px',
          lineHeight: isDocument ? '1.6' : '1.65',
          color: isDocument ? '#2d3748' : '#374151',
          marginBottom: isDocument ? '1px' : '2px',
        }}
      >
        {blok.tekst}
      </div>
    )
  })
}

// ─── DOCX blokken builder ───────────────────────────────────────────────────
// Converteert blokken naar docx Paragraph objecten
// Import: { Paragraph, TextRun, AlignmentType, BorderStyle } from 'docx'

export function blokken2DocxParagraphs(blokken, docxLib) {
  const { Paragraph, TextRun } = docxLib
  const paragraphs = []

  for (const blok of blokken) {
    if (blok.type === 'witregel') {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }))
      continue
    }

    if (blok.type === 'bullet') {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({ text: '• ', color: '1a3a5c', size: 19 }),
          new TextRun({ text: blok.tekst, size: 19, color: '2d3748' })
        ],
        indent: { left: 200 },
        spacing: { after: 40 }
      }))
      continue
    }

    if (blok.type === 'subkop') {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: blok.tekst, bold: true, size: 19, color: '1a3a5c' })],
        spacing: { before: 120, after: 40 }
      }))
      continue
    }

    // tekst
    paragraphs.push(new Paragraph({
      children: [new TextRun({ text: blok.tekst, size: 19, color: '2d3748' })],
      spacing: { after: 40 }
    }))
  }

  return paragraphs
}
