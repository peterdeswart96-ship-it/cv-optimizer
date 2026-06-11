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

  // Nooit subkop: regels die beginnen met ( zijn certificaten/codes
  // bijv. "(SC-401) Information Security Administrator Associate — Apr 2027"
  if (r.startsWith('(')) {
    return 'tekst'
  }

  // Nooit subkop: lange regels (> 80 tekens) zijn altijd gewone tekst
  if (r.length > 80) {
    return 'tekst'
  }

  const eindigtOpLeesteken = /[.,;]$/.test(r)
  const heeftJarenPatroon  = /\b(19|20)\d{2}\b/.test(r)
  const heeftScheidingsteken = /[|·–—]/.test(r)

  // Functietitel + periode: heeft jaar én scheidingsteken
  // Maar alleen als het deel VOOR het scheidingsteken kort is (<= 5 woorden)
  // "Senior Engineer — Blacktang 2022" = subkop
  // "Get started with identities and access using Microsoft Entra — Feb 2026" = GEEN subkop
  if (!eindigtOpLeesteken && heeftJarenPatroon && heeftScheidingsteken) {
    const deelVoorScheidingsteken = r.split(/[|·–—]/)[0].trim()
    const aantalWoorden = deelVoorScheidingsteken.split(/\s+/).length
    if (aantalWoorden <= 6) {
      return 'subkop'
    }
  }

  // Categorie-label: kort (<= 40 tekens), geen leesteken, begint met hoofdletter,
  // geen cijfers, geen haakjes — bijv. "Microsoft 365 & Cloud", "Azure"
  const isCategorie = r.length <= 40
    && !eindigtOpLeesteken
    && /^[A-Z]/.test(r)
    && !/\d/.test(r)
    && !/[()[\]]/.test(r)

  if (isCategorie) {
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


// ─── HTML → blokken ─────────────────────────────────────────────────────────
// Converteert mammoth HTML naar getypeerde blokken
// Bewaart de originele structuur van het DOCX bestand exact
// Wordt alleen gebruikt als er HTML beschikbaar is (DOCX upload)

export function html2Blokken(html) {
  if (!html) return []

  const blokken = []

  // Verwijder de outer wrapper als die er is
  const schone = html.trim()

  // Splits op HTML block-elementen
  // We verwerken regel voor regel door de HTML te parsen
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${schone}</div>`, 'text/html')
  const root = doc.querySelector('div')

  function verwerkNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const tekst = node.textContent.trim()
      if (tekst) {
        blokken.push({ type: 'tekst', tekst })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const tag = node.tagName.toLowerCase()
    const tekst = node.textContent.trim()

    if (!tekst) {
      // Lege block-elementen = witregel
      if (['p', 'div', 'br'].includes(tag)) {
        if (blokken.length > 0 && blokken[blokken.length - 1].type !== 'witregel') {
          blokken.push({ type: 'witregel' })
        }
      }
      return
    }

    // Headings → subkop
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      blokken.push({ type: 'subkop', tekst })
      return
    }

    // Lijstitems → bullet
    if (tag === 'li') {
      blokken.push({ type: 'bullet', tekst })
      return
    }

    // ul/ol → verwerk kinderen (de li's)
    if (tag === 'ul' || tag === 'ol') {
      for (const kind of node.children) {
        verwerkNode(kind)
      }
      return
    }

    // Paragraaf of div
    if (tag === 'p' || tag === 'div') {
      // Check of de paragraaf alleen bold/strong tekst bevat → subkop
      const heeftAlleenBold = node.children.length > 0 &&
        Array.from(node.children).every(k => ['strong', 'b', 'em'].includes(k.tagName.toLowerCase())) &&
        node.children.length === node.childNodes.length

      // Of de gehele paragraaf is omhuld door strong/b
      const isVetGedrukt = (tag === 'p' && node.querySelector('strong, b') &&
        node.querySelector('strong, b').textContent.trim() === tekst)

      if (heeftAlleenBold || isVetGedrukt) {
        blokken.push({ type: 'subkop', tekst })
      } else {
        // Verwerk inline elementen — extraheer gewoon de tekst
        blokken.push({ type: 'tekst', tekst })
      }

      // Witregel na elke paragraaf als de volgende ook een paragraaf is
      // (dit bewaart de originele regelafstand)
      return
    }

    // strong/b/em als standalone (niet in p) → subkop
    if (['strong', 'b'].includes(tag)) {
      blokken.push({ type: 'subkop', tekst })
      return
    }

    // Alles anders: verwerk kinderen
    for (const kind of node.childNodes) {
      verwerkNode(kind)
    }
  }

  for (const kind of root.childNodes) {
    verwerkNode(kind)
  }

  // Trailing witregels weghalen
  while (blokken.length > 0 && blokken[blokken.length - 1].type === 'witregel') {
    blokken.pop()
  }

  return blokken
}

// ─── Universele blokken parser ───────────────────────────────────────────────
// Kiest automatisch html2Blokken of tekst2Blokken op basis van beschikbare data

export function maakBlokken(tekst, html) {
  if (html && html.trim().length > 0) {
    return html2Blokken(html)
  }
  return tekst2Blokken(tekst)
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
