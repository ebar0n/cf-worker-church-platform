import React from 'react';
import MDEditor, { commands } from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DEPARTMENTS } from '@/lib/constants';
import DepartmentSelector from './DepartmentSelector';
import styles from './AnnouncementModal.module.css';

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
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          className="relative mx-2 w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:p-6 lg:p-8">
            <h3 className="text-2xl font-bold text-[#4b207f]">
              {editingAnnouncement ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Top Row - Title and Date */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Título *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
                  placeholder="Título del anuncio"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Fecha del Anuncio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.announcementDate}
                  onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#4b207f] focus:outline-none focus:ring-2 focus:ring-[#4b207f]/20"
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

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-[#4b207f] focus:ring-[#4b207f]"
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
                                <div className="rounded-lg border border-gray-300 focus-within:border-[#4b207f] focus-within:ring-2 focus-within:ring-[#4b207f]/20">
                  {/* Custom Toolbar with original icons */}
                  <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm italic hover:bg-gray-200"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm line-through hover:bg-gray-200"
                      title="Strikethrough"
                    >
                      S
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n## ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Heading"
                    >
                      T
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Quote"
                    >
                      "
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Code"
                    >
                      &lt;/&gt;
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
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
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Link"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n![alt text](image-url)' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Image"
                    >
                      🖼️
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n- ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Unordered List"
                    >
                      •
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n1. ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Ordered List"
                    >
                      1.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n- [ ] ' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Checklist"
                    >
                      ☑️
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.querySelector('.w-md-editor-text textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const before = text.substring(0, start);
                          const after = text.substring(start);
                          const newText = before + '\n| Header | Header |\n| ------ | ------ |\n| Cell | Cell |' + after;
                          setFormData({ ...formData, content: newText });
                        }
                      }}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Table"
                    >
                      ⊞
                    </button>
                    <div className="mx-1 h-4 w-px bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => setShowHelp(true)}
                      className="rounded px-2 py-1 text-sm hover:bg-gray-200"
                      title="Ayuda de Markdown"
                    >
                      ?
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
                    className="border-0"
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
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  Vista previa del contenido:
                </h4>
                <div className="max-h-48 overflow-y-auto rounded bg-white p-4 text-sm">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Customize link styling
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-[#4b207f] underline transition-colors duration-200 hover:text-[#e36520]"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        // Customize heading styles
                        h1: ({ node, ...props }) => (
                          <h1 {...props} className="mb-2 text-lg font-bold text-[#4b207f]" />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 {...props} className="mb-2 text-base font-bold text-[#4b207f]" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6 {...props} className="mb-2 text-sm font-bold text-[#4b207f]" />
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
                            className="mb-2 border-l-4 border-[#4b207f] bg-gray-50 pl-3 text-sm italic text-gray-700"
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
                        img: ({ node, ...props }) => {
                          const [imageError, setImageError] = React.useState(false);
                          const [imageLoading, setImageLoading] = React.useState(true);

                          if (imageError) {
                            return (
                              <div className="mb-2 flex items-center justify-center rounded bg-gray-100 p-3 text-xs text-gray-500">
                                <svg
                                  className="mr-1 h-3 w-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Imagen no disponible
                              </div>
                            );
                          }

                          return (
                            <div className="relative mb-2">
                              {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#4b207f] border-t-transparent"></div>
                                </div>
                              )}
                              <img
                                {...props}
                                className={`max-w-full rounded shadow-sm transition-opacity duration-200 ${
                                  imageLoading ? 'opacity-0' : 'opacity-100'
                                }`}
                                loading="lazy"
                                onLoad={() => setImageLoading(false)}
                                onError={() => {
                                  setImageLoading(false);
                                  setImageError(true);
                                }}
                                style={{ maxHeight: '200px', objectFit: 'contain' }}
                              />
                            </div>
                          );
                        },
                      }}
                    >
                      {formData.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-[#4b207f] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4b207f]/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Guardando...
                  </div>
                ) : editingAnnouncement ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#4b207f]">Guía de Markdown</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="rounded p-1 hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Títulos</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    # Título principal<br/>
                    ## Subtítulo<br/>
                    ### Sub-subtítulo<br/>
                    #### Título nivel 4<br/>
                    ##### Título nivel 5<br/>
                    ###### Título nivel 6
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Formato de texto</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    **Texto en negrita**<br/>
                    *Texto en cursiva*<br/>
                    ***Texto en negrita y cursiva***<br/>
                    ~~Texto tachado~~<br/>
                    `código en línea`<br/>
                    ==Texto resaltado==
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Enlaces</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    [Texto del enlace](https://ejemplo.com)<br/>
                    [Enlace con título](https://ejemplo.com "Título del enlace")<br/>
                    &lt;https://ejemplo.com&gt;<br/>
                    [Enlace de referencia][id]<br/>
                    [id]: https://ejemplo.com "Título opcional"
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Imágenes</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    ![Texto alternativo](url-imagen)<br/>
                    ![Texto alternativo](url-imagen "Título de la imagen")<br/>
                    ![Imagen con enlace](url-imagen)<br/>
                    [![Imagen clickeable](url-imagen)](https://ejemplo.com)
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Listas</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    - Lista con viñetas<br/>
                    * Lista con asteriscos<br/>
                    + Lista con plus<br/>
                    1. Lista numerada<br/>
                    2. Segundo elemento<br/>
                    - [ ] Tarea pendiente<br/>
                    - [x] Tarea completada<br/>
                    - Lista anidada<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;- Subelemento
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Citas y bloques</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    &gt; Cita simple<br/>
                    &gt; Cita con **formato**<br/>
                    &gt; Cita multilínea<br/>
                    &gt; que continúa aquí<br/>
                    <br/>
                    ```javascript<br/>
                    // Bloque de código<br/>
                    function ejemplo() {'{'}<br/>
                    &nbsp;&nbsp;return "Hola mundo";<br/>
                    {'}'}<br/>
                    ```
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Tablas</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    | Encabezado 1 | Encabezado 2 | Encabezado 3 |<br/>
                    |:-------------|:------------:|-------------:|<br/>
                    | Alineado izq | Centrado | Alineado der |<br/>
                    | Celda normal | **Negrita** | *Cursiva* |<br/>
                    | [Enlace](url) | `código` | ![Imagen](url) |
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Elementos especiales</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    --- (Línea horizontal)<br/>
                    *** (Línea horizontal)<br/>
                    ___ (Línea horizontal)<br/>
                    <br/>
                    ^Texto^ (Superíndice)<br/>
                    ~Texto~ (Subíndice)<br/>
                    <br/>
                    [^1]: Nota al pie<br/>
                    Texto con nota[^1]
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-gray-800">Escape de caracteres</h4>
                  <div className="rounded bg-gray-50 p-3 font-mono text-sm">
                    \*Texto con asteriscos\*<br/>
                    \[Enlace no clickeable\]<br/>
                    \`código no formateado\`<br/>
                    \# Título no formateado<br/>
                    \- Lista no formateada
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="rounded bg-[#4b207f] px-4 py-2 text-white hover:bg-[#4b207f]/90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
