import React from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DEPARTMENTS } from '@/lib/constants';
import DepartmentSelector from './DepartmentSelector';
import styles from './AnnouncementModal.module.css';
import { MarkdownImage } from '@/app/components/MarkdownImage';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Bold,
  CircleHelp,
  Code,
  Heading,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Quote,
  Strikethrough,
  Table,
  X,
} from 'lucide-react';

const TOOL_BUTTON =
  'text-ink flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-200';

interface Announcement {
  id: number;
  title: string;
  content: string;
  announcementDate: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    title: string;
    content: string;
    announcementDate: string;
    department: string;
    isActive: boolean;
  };
  setFormData: (data: any) => void;
  editingAnnouncement: Announcement | null;
  isLoading?: boolean;
}

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingAnnouncement,
  isLoading = false,
}: AnnouncementModalProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  // Custom toolbar with original icons but only essential editing commands
  const customCommands = [
    commands.bold,
    commands.italic,
    commands.strikethrough,
    commands.divider,
    commands.title,
    commands.quote,
    commands.code,
    commands.divider,
    commands.link,
    commands.image,
    commands.divider,
    commands.unorderedListCommand,
    commands.orderedListCommand,
    commands.checkedListCommand,
    commands.divider,
    commands.table,
    commands.divider,
    commands.help,
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="bg-ink/50 fixed inset-0 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="border-line relative mx-2 w-full max-w-5xl rounded-2xl border bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-line flex items-center justify-between border-b p-4 sm:p-6 lg:px-8">
            <h2 className="text-ink text-[28px] leading-tight">
              {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
              <X className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Top Row - Title and Date */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Título *</label>
                <Input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título del anuncio"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha del Anuncio *
                </label>
                <Input
                  type="date"
                  required
                  value={formData.announcementDate}
                  onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                />
              </div>
            </div>

            {/* Department and Active Status Row */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Departamento</label>
                <DepartmentSelector
                  selectedDepartment={formData.department}
                  onSelectDepartment={(department: string) =>
                    setFormData({ ...formData, department })
                  }
                />
              </div>

              <div className="flex items-center gap-3 md:pt-7">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="accent-ink h-5 w-5"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Anuncio activo
                </label>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contenido (Markdown) *
              </label>
              <div data-color-mode="light" className="markdown-editor-container">
                <div className="focus-within:border-denim focus-within:outline-denim/25 overflow-hidden rounded-xl border border-gray-300 focus-within:outline-2 focus-within:outline-offset-2">
                  {/* Custom Toolbar with original icons */}
                  <div className="border-line flex flex-wrap items-center gap-1 border-b bg-gray-50 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `**${selection}**` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `*${selection}*` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `~~${selection}~~` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Strikethrough"
                    >
                      <Strikethrough className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n## ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Heading"
                    >
                      <Heading className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `> ${selection}` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Quote"
                    >
                      <Quote className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `\`${selection}\`` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Code"
                    >
                      <Code className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const selection = text.substring(start, end);
                          const after = text.substring(end);
                          const newText = before + `[${selection}](url)` + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Link"
                    >
                      <LinkIcon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n![alt text](image-url)' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Image"
                    >
                      <ImageIcon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n- ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Unordered List"
                    >
                      <List className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n1. ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Ordered List"
                    >
                      <ListOrdered className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n- [ ] ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Checklist"
                    >
                      <ListChecks className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector(
                          '.w-md-editor-text textarea'
                        ) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText =
                            before +
                            '\n| Header | Header |\n| ------ | ------ |\n| Cell | Cell |' +
                            after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className={TOOL_BUTTON}
                      title="Table"
                    >
                      <Table className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => setShowHelp(true)}
                      className={TOOL_BUTTON}
                      title="Ayuda de Markdown"
                    >
                      <CircleHelp className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Editor without toolbar */}
                  <MDEditor
                    value={formData.content}
                    onChange={(value: string | undefined) =>
                      setFormData({ ...formData, content: value || '' })
                    }
                    height={300}
                    preview="edit"
                    hideToolbar={true}
                    className="rounded-none! border-0! shadow-none!"
                    textareaProps={{
                      placeholder:
                        'Escribe el contenido del anuncio usando Markdown...\n\n# Título principal\n## Subtítulo\n\n**Texto en negrita** y *texto en cursiva*\n\n[Enlaces](https://ejemplo.com)\n\n- Listas\n- Con viñetas',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Custom Preview */}
            {formData.content && (
              <div className="border-line rounded-2xl border bg-gray-50 p-4">
                <h4 className="text-ink-soft mb-3 font-sans text-sm font-medium tracking-normal">
                  Vista previa del contenido:
                </h4>
                <div className="border-line max-h-48 overflow-y-auto rounded-xl border bg-white p-4 text-sm">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Customize link styling
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-denim hover:text-ink underline transition-colors duration-200"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        // Customize heading styles
                        h1: ({ node, ...props }) => (
                          <h1 {...props} className="text-ink mb-2 text-lg font-bold" />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 {...props} className="text-ink mb-2 text-base font-bold" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 {...props} className="text-ink mb-2 text-sm font-bold" />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 {...props} className="text-ink mb-2 text-sm font-bold" />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5 {...props} className="text-ink mb-2 text-sm font-bold" />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6 {...props} className="text-ink mb-2 text-sm font-bold" />
                        ),
                        // Customize paragraph styling
                        p: ({ node, ...props }) => <p {...props} className="mb-2 text-sm" />,
                        // Customize strong/bold styling
                        strong: ({ node, ...props }) => <strong {...props} className="font-bold" />,
                        // Customize emphasis/italic styling
                        em: ({ node, ...props }) => <em {...props} className="italic" />,
                        // Customize list styling
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="mb-2 ml-4 list-disc space-y-1 text-sm" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="mb-2 ml-4 list-decimal space-y-1 text-sm" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="text-sm text-gray-700" />
                        ),
                        // Customize code styling
                        code: ({ node, inline, ...props }: any) => {
                          if (inline) {
                            return (
                              <code
                                {...props}
                                className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800"
                              />
                            );
                          }
                          return (
                            <code
                              {...props}
                              className="block overflow-x-auto rounded bg-gray-100 p-2 font-mono text-xs text-gray-800"
                            />
                          );
                        },
                        pre: ({ node, ...props }) => (
                          <pre
                            {...props}
                            className="mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs"
                          />
                        ),
                        // Customize blockquote styling
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            {...props}
                            className="border-warm mb-2 border-l-4 bg-gray-50 pl-3 text-sm italic text-gray-700"
                          />
                        ),
                        // Customize table styling
                        table: ({ node, ...props }) => (
                          <div className="mb-2 overflow-x-auto">
                            <table
                              {...props}
                              className="min-w-full border-collapse border border-gray-300 text-xs"
                            />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead {...props} className="bg-gray-100" />,
                        tbody: ({ node, ...props }) => <tbody {...props} />,
                        tr: ({ node, ...props }) => (
                          <tr {...props} className="border-b border-gray-300" />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            {...props}
                            className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold text-gray-700"
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            {...props}
                            className="border border-gray-300 px-2 py-1 text-xs text-gray-700"
                          />
                        ),
                        // Customize horizontal rule
                        hr: ({ node, ...props }) => (
                          <hr {...props} className="my-2 border-gray-300" />
                        ),
                        // Customize image styling
                        img: (props) => <MarkdownImage {...props} size="sm" />,
                      }}
                    >
                      {formData.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-line flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    Guardando...
                  </>
                ) : editingAnnouncement ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="bg-ink/50 fixed inset-0 z-50 flex items-center justify-center">
          <div className="border-line mx-4 max-w-2xl rounded-2xl border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-ink text-[28px] leading-tight">Guía de Markdown</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(false)}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="text-ink mb-2 text-lg">Títulos</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    # Título principal
                    <br />
                    ## Subtítulo
                    <br />
                    ### Sub-subtítulo
                    <br />
                    #### Título nivel 4<br />
                    ##### Título nivel 5<br />
                    ###### Título nivel 6
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Formato de texto</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    **Texto en negrita**
                    <br />
                    *Texto en cursiva*
                    <br />
                    ***Texto en negrita y cursiva***
                    <br />
                    ~~Texto tachado~~
                    <br />
                    `código en línea`
                    <br />
                    ==Texto resaltado==
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Enlaces</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    [Texto del enlace](https://ejemplo.com)
                    <br />
                    [Enlace con título](https://ejemplo.com &quot;Título del enlace&quot;)
                    <br />
                    &lt;https://ejemplo.com&gt;
                    <br />
                    [Enlace de referencia][id]
                    <br />
                    [id]: https://ejemplo.com &quot;Título opcional&quot;
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Imágenes</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    ![Texto alternativo](url-imagen)
                    <br />
                    ![Texto alternativo](url-imagen &quot;Título de la imagen&quot;)
                    <br />
                    ![Imagen con enlace](url-imagen)
                    <br />
                    [![Imagen clickeable](url-imagen)](https://ejemplo.com)
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Listas</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    - Lista con viñetas
                    <br />
                    * Lista con asteriscos
                    <br />
                    + Lista con plus
                    <br />
                    1. Lista numerada
                    <br />
                    2. Segundo elemento
                    <br />
                    - [ ] Tarea pendiente
                    <br />
                    - [x] Tarea completada
                    <br />
                    - Lista anidada
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;- Subelemento
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Citas y bloques</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    &gt; Cita simple
                    <br />
                    &gt; Cita con **formato**
                    <br />
                    &gt; Cita multilínea
                    <br />
                    &gt; que continúa aquí
                    <br />
                    <br />
                    ```javascript
                    <br />
                    {'// Bloque de código'}
                    <br />
                    function ejemplo() {'{'}
                    <br />
                    &nbsp;&nbsp;return &quot;Hola mundo&quot;;
                    <br />
                    {'}'}
                    <br />
                    ```
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Tablas</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    | Encabezado 1 | Encabezado 2 | Encabezado 3 |<br />
                    |:-------------|:------------:|-------------:|
                    <br />
                    | Alineado izq | Centrado | Alineado der |<br />
                    | Celda normal | **Negrita** | *Cursiva* |<br />| [Enlace](url) | `código` |
                    ![Imagen](url) |
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Elementos especiales</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    --- (Línea horizontal)
                    <br />
                    *** (Línea horizontal)
                    <br />
                    ___ (Línea horizontal)
                    <br />
                    <br />
                    ^Texto^ (Superíndice)
                    <br />
                    ~Texto~ (Subíndice)
                    <br />
                    <br />
                    [^1]: Nota al pie
                    <br />
                    Texto con nota[^1]
                  </div>
                </div>

                <div>
                  <h4 className="text-ink mb-2 text-lg">Escape de caracteres</h4>
                  <div className="border-line rounded-xl border bg-gray-50 p-3 font-mono text-sm">
                    \*Texto con asteriscos\*
                    <br />
                    \[Enlace no clickeable\]
                    <br />
                    \`código no formateado\`
                    <br />
                    \# Título no formateado
                    <br />
                    \- Lista no formateada
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowHelp(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
