// RichTextEditor.jsx — herbruikbare WYSIWYG editor
// Gebruikt door App.jsx, SectieReview.jsx en CVPreview.jsx
// Ondersteunt: bold, italic, underline, strike, headings H1-H3,
//              bullets, genummerde lijst, en HTML import/export

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect } from 'react'

// ─── Toolbar knop helper ────────────────────────────────────────────────────
function ToolbarKnop({ onClick, actief, children, title }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault() // voorkom focus verlies in editor
        onClick()
      }}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors select-none ${
        actief
          ? 'bg-blue-600 text-white'
          : 'bg-transparent text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Toolbar ────────────────────────────────────────────────────────────────
function Toolbar({ editor }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">

      {/* Tekststijlen */}
      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleBold().run()}
        actief={editor.isActive('bold')}
        title="Vet (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleItalic().run()}
        actief={editor.isActive('italic')}
        title="Cursief (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        actief={editor.isActive('underline')}
        title="Onderstrepen (Ctrl+U)"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleStrike().run()}
        actief={editor.isActive('strike')}
        title="Doorstrepen"
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </ToolbarKnop>

      <div className="w-px bg-gray-300 mx-1 self-stretch" />

      {/* Koppen */}
      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        actief={editor.isActive('heading', { level: 1 })}
        title="Kop 1"
      >
        H1
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        actief={editor.isActive('heading', { level: 2 })}
        title="Kop 2"
      >
        H2
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        actief={editor.isActive('heading', { level: 3 })}
        title="Kop 3"
      >
        H3
      </ToolbarKnop>

      <div className="w-px bg-gray-300 mx-1 self-stretch" />

      {/* Lijsten */}
      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        actief={editor.isActive('bulletList')}
        title="Opsommingslijst"
      >
        • Lijst
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        actief={editor.isActive('orderedList')}
        title="Genummerde lijst"
      >
        1. Lijst
      </ToolbarKnop>

      <div className="w-px bg-gray-300 mx-1 self-stretch" />

      {/* Overig */}
      <ToolbarKnop
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        actief={editor.isActive('blockquote')}
        title="Citaat"
      >
        ❝
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        actief={false}
        title="Horizontale lijn"
      >
        ─
      </ToolbarKnop>

      <div className="w-px bg-gray-300 mx-1 self-stretch" />

      {/* Ongedaan maken */}
      <ToolbarKnop
        onClick={() => editor.chain().focus().undo().run()}
        actief={false}
        title="Ongedaan maken (Ctrl+Z)"
      >
        ↩
      </ToolbarKnop>

      <ToolbarKnop
        onClick={() => editor.chain().focus().redo().run()}
        actief={false}
        title="Opnieuw (Ctrl+Y)"
      >
        ↪
      </ToolbarKnop>

    </div>
  )
}

// ─── Hoofd component ─────────────────────────────────────────────────────────
// Props:
//   content     — HTML string of plain tekst (initiële inhoud)
//   onChange    — callback(html, tekst) — wordt aangeroepen bij elke wijziging
//   placeholder — placeholder tekst als de editor leeg is
//   minHeight   — minimum hoogte in pixels (default: 200)
//   readonly    — alleen-lezen modus (default: false)
//   className   — extra CSS klassen voor de container
//   donkerThema — true voor donkere achtergrond (App.jsx dark mode)

export default function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Begin hier te typen...',
  minHeight = 200,
  readonly = false,
  className = '',
  donkerThema = false,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: content || '',
    editable: !readonly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML()
        const tekst = editor.getText()
        onChange(html, tekst)
      }
    },
  })

  // Update inhoud als content prop wijzigt van buiten
  // (bijv. als gebruiker een opgeslagen CV laadt)
  useEffect(() => {
    if (!editor) return
    // Alleen updaten als de content echt anders is (voorkom cursor reset)
    const huidig = editor.getHTML()
    if (content && content !== huidig) {
      // Zet content zonder cursor te resetten als het HTML is
      const isHtml = content.trim().startsWith('<')
      if (isHtml) {
        editor.commands.setContent(content, false)
      } else {
        // Plain tekst: converteer naar eenvoudige paragrafen
        const html = content
          .split('\n')
          .map(r => r.trim() ? `<p>${r}</p>` : '<p></p>')
          .join('')
        editor.commands.setContent(html, false)
      }
    }
  }, [content, editor])

  const containerKleur = donkerThema ? '#1F2937' : '#FFFFFF'
  const tekstKleur = donkerThema ? '#F9FAFB' : '#111827'
  const borderKleur = donkerThema ? '#374151' : '#D1D5DB'
  const toolbarBg = donkerThema ? '#111827' : '#F9FAFB'
  const toolbarBorder = donkerThema ? '#374151' : '#E5E7EB'
  const toolbarTekst = donkerThema ? '#D1D5DB' : '#374151'

  return (
    <div
      className={`border rounded-lg overflow-hidden ${className}`}
      style={{ borderColor: borderKleur }}
    >
      {/* Toolbar — verborgen in readonly modus */}
      {!readonly && (
        <div style={{ backgroundColor: toolbarBg, borderBottom: `1px solid ${toolbarBorder}` }}>
          <div className="flex flex-wrap gap-1 p-1.5">
            {editor && (
              <>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
                  className={`px-2 py-1 rounded text-sm font-bold transition-colors ${editor.isActive('bold') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('bold') ? 'white' : toolbarTekst }} title="Vet">B</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
                  className={`px-2 py-1 rounded text-sm italic transition-colors ${editor.isActive('italic') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('italic') ? 'white' : toolbarTekst }} title="Cursief">I</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }}
                  className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('underline') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('underline') ? 'white' : toolbarTekst, textDecoration: 'underline' }} title="Onderstrepen">U</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
                  className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('strike') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('strike') ? 'white' : toolbarTekst, textDecoration: 'line-through' }} title="Doorstrepen">S</button>

                <span style={{ color: toolbarBorder }} className="self-stretch mx-1">│</span>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() }}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('heading', { level: 1 }) ? 'white' : toolbarTekst }} title="Kop 1">H1</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('heading', { level: 2 }) ? 'white' : toolbarTekst }} title="Kop 2">H2</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() }}
                  className={`px-2 py-1 rounded text-xs font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('heading', { level: 3 }) ? 'white' : toolbarTekst }} title="Kop 3">H3</button>

                <span style={{ color: toolbarBorder }} className="self-stretch mx-1">│</span>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
                  className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('bulletList') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('bulletList') ? 'white' : toolbarTekst }} title="Bullets">• lijst</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
                  className={`px-2 py-1 rounded text-sm transition-colors ${editor.isActive('orderedList') ? 'bg-blue-600 text-white' : ''}`}
                  style={{ color: editor.isActive('orderedList') ? 'white' : toolbarTekst }} title="Genummerd">1. lijst</button>

                <span style={{ color: toolbarBorder }} className="self-stretch mx-1">│</span>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
                  className="px-2 py-1 rounded text-sm transition-colors hover:bg-gray-200"
                  style={{ color: toolbarTekst }} title="Ongedaan (Ctrl+Z)">↩</button>

                <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
                  className="px-2 py-1 rounded text-sm transition-colors hover:bg-gray-200"
                  style={{ color: toolbarTekst }} title="Opnieuw (Ctrl+Y)">↪</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor inhoud */}
      <EditorContent
        editor={editor}
        style={{
          backgroundColor: containerKleur,
          color: tekstKleur,
          minHeight: `${minHeight}px`,
          padding: '12px',
          fontSize: '14px',
          lineHeight: '1.6',
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          outline: 'none',
        }}
        className="tiptap-editor"
      />
    </div>
  )
}

// ─── Helper: HTML → plain tekst ──────────────────────────────────────────────
// Exporteer als utility voor andere componenten
export function htmlNaarPlainTekst(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
