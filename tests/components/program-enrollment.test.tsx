import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProgramEnrollmentClient, {
  FileCapture,
} from '@/app/program/[id]/components/ProgramEnrollmentClient';

vi.mock('@/app/components/PdfFilePreview', () => ({
  default: ({ source, label }: { source: string; label: string }) => (
    <canvas title={`Vista previa: ${label}`} data-source={source} />
  ),
}));

function expandPreview(text: string) {
  const details = screen.getByText(text).closest('details')!;
  details.open = true;
  fireEvent(details, new Event('toggle'));
}

const dad = {
  name: 'Andrés QA',
  documentID: '9900192601',
  phone: '3000001901',
  birthDate: '1988-04-12',
  gender: 'M',
  relationship: 'father',
  bloodType: 'O+',
  eps: 'Salud QA',
  allergies: 'Penicilina',
  conditions: 'Asma',
  medications: 'Medicamento QA',
  photoUrl: '/api/admin/files/enrollments/foto.png',
  idDocumentUrl: '/api/admin/files/enrollments/doc.png',
  epsCertificateUrl: '/api/admin/files/enrollments/eps.pdf',
  isSelf: true,
};
const mother = {
  ...dad,
  name: 'María QA',
  documentID: '9900192602',
  gender: 'F',
  relationship: 'mother',
  isSelf: false,
};
let finalized = false;
let partialConsent = false;
let requests: Array<{ url: string; init?: RequestInit }>;

beforeEach(() => {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:test-document');
      static revokeObjectURL = vi.fn();
    }
  );
  finalized = false;
  partialConsent = false;
  requests = [];
  window.turnstile = {
    render: (_container, options) => options.callback?.('test-token'),
    reset: () => {},
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      requests.push({ url: input, init });
      let data: unknown = { success: true };
      if (input === '/api/turnstile-config') data = { siteKey: 'test-key' };
      if (input.endsWith('/consent')) finalized = true;
      if (input.endsWith('/lookup'))
        data = {
          found: true,
          adult: {
            ...dad,
            dataTreatmentAcceptedAt: finalized || partialConsent ? '2026-09-19T15:00:00Z' : null,
            participationConfirmedAt: finalized ? '2026-09-20T15:00:00Z' : null,
          },
          adults: [dad, mother],
          children: [
            { ...dad, name: 'José QA', documentID: '9900192603', birthDate: '2024-03-05' },
            { ...dad, name: 'Lucía QA', documentID: '9900192604', birthDate: '2021-02-10' },
          ],
        };
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    })
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function enter() {
  render(
    <ProgramEnrollmentClient
      programId={1}
      programTitle="Club QA"
      programContent={null}
      programColor="#4b207f"
      departmentName="Aventureros"
      departmentImage="/logo.png"
    />
  );
  fireEvent.change(screen.getByLabelText('Documento del adulto responsable *'), {
    target: { value: dad.documentID },
  });
  await waitFor(() =>
    expect((screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement).disabled).toBe(
      false
    )
  );
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByRole('heading', { name: 'Tu grupo familiar' });
}

function expectSavedConsent() {
  for (const name of [/Autorizo el tratamiento/, /Confirmo la inscripción/]) {
    const checkbox = screen.getByRole('checkbox', { name }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(false);
  }
  expect(screen.getByText('19 de septiembre de 2026')).toBeTruthy();
  expect(screen.getByText('20 de septiembre de 2026')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Guardar aceptación y confirmar inscripción' })
  ).toBeNull();
}

describe('family dashboard saving', () => {
  it('editing health preserves existing answers and never silently accepts consent', async () => {
    await enter();
    expect(screen.queryByText(/Guía Mayor/)).toBeNull();
    expect(screen.getAllByText(/Aventurero/).length).toBeGreaterThan(0);
    const row = screen.getByText(dad.name).closest('li')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Editar' }));
    const modal = screen.getByRole('dialog');
    expect(within(modal).queryByText(/Guía Mayor/)).toBeNull();
    expect(within(modal).getByText(/cédula de ciudadanía por ambas caras/)).toBeTruthy();
    expandPreview('Vista previa de certificado de afiliación a la eps');
    expect(
      within(modal)
        .getByTitle('Vista previa: Certificado de afiliación a la EPS')
        .getAttribute('data-source')
    ).toBe('/api/programs/1/file/enrollments/eps.pdf');
    const certificate = new File(['%PDF-test'], 'eps.pdf', { type: 'application/pdf' });
    fireEvent.change(within(modal).getByLabelText('Certificado de afiliación a la EPS'), {
      target: { files: [certificate] },
    });
    expect((within(modal).getByLabelText('Alergias') as HTMLInputElement).value).toBe('Penicilina');
    expect(
      (within(modal).getByLabelText('Medicamentos (si utiliza)') as HTMLInputElement).value
    ).toBe('Medicamento QA');
    fireEvent.change(within(modal).getByLabelText('Teléfono *'), {
      target: { value: '3000001999' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const body = requests.find((r) => r.url.endsWith('/join'))!.init!.body as FormData;
    expect(body.get('allergies')).toBe('Penicilina');
    expect(body.get('medications')).toBe('Medicamento QA');
    expect(body.get('epsCertificate')).toBe(certificate);
    expect(body.has('acceptDataTreatment')).toBe(false);
    expect(body.has('confirmParticipation')).toBe(false);
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo el tratamiento/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo la inscripción/ }));
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    fireEvent.click(
      screen.getByRole('button', { name: 'Guardar aceptación y confirmar inscripción' })
    );
    await screen.findByText(/Tu aceptación quedó guardada/);
    expectSavedConsent();
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    const consent = JSON.parse(
      requests.find((r) => r.url.endsWith('/consent'))!.init!.body as string
    );
    expect(consent).toMatchObject({
      documentID: dad.documentID,
      acceptDataTreatment: true,
      confirmParticipation: true,
    });
  });

  it('restores saved acceptance while allowing the remaining confirmation', async () => {
    partialConsent = true;
    await enter();
    const accepted = screen.getByRole('checkbox', {
      name: /Autorizo el tratamiento/,
    }) as HTMLInputElement;
    const confirmed = screen.getByRole('checkbox', {
      name: /Confirmo la inscripción/,
    }) as HTMLInputElement;
    expect(accepted.checked).toBe(true);
    expect(accepted.disabled).toBe(false);
    expect(confirmed.checked).toBe(false);
    expect(confirmed.disabled).toBe(false);
    const save = screen.getByRole('button', {
      name: 'Guardar aceptación y confirmar inscripción',
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.click(confirmed);
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await screen.findByText(/Tu aceptación quedó guardada/);
    expectSavedConsent();
    const body = JSON.parse(requests.find((r) => r.url.endsWith('/consent'))!.init!.body as string);
    expect(body).toMatchObject({ acceptDataTreatment: true, confirmParticipation: true });
  });

  it('allows unchecking saved consent, flags the unsaved change and never persists rejection', async () => {
    finalized = true;
    await enter();
    for (const name of [/Autorizo el tratamiento/, /Confirmo la inscripción/]) {
      const checkbox = screen.getByRole('checkbox', { name }) as HTMLInputElement;
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
      expect(checkbox.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByRole('alert').textContent).toContain('Debes marcar ambas casillas');
      expect(screen.getByText(/Cambio sin guardar/).textContent).toContain(
        'La aceptación registrada no se ha modificado'
      );
      const save = screen.getByRole('button', {
        name: 'Guardar aceptación y confirmar inscripción',
      }) as HTMLButtonElement;
      expect(save.disabled).toBe(true);
      fireEvent.click(save);
      expect(requests.some((r) => r.url.endsWith('/consent'))).toBe(false);
      fireEvent.click(checkbox);
      expect(screen.queryByText(/Cambio sin guardar/)).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expectSavedConsent();
    }
  });

  it('restores saved acceptance without public downloads and keeps unsaved changes when closing is cancelled', async () => {
    finalized = true;
    await enter();
    expectSavedConsent();
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    fireEvent.click(
      within(screen.getByText(mother.name, { selector: 'p' }).closest('li')!).getByRole('button', {
        name: 'Editar',
      })
    );
    const modal = screen.getByRole('dialog');
    fireEvent.change(within(modal).getByLabelText('Alergias'), {
      target: { value: 'Polen y ácaros' },
    });
    fireEvent.click(within(modal).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('alertdialog', { name: 'Cambios sin guardar' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect((within(modal).getByLabelText('Alergias') as HTMLInputElement).value).toBe(
      'Polen y ácaros'
    );
    fireEvent.click(within(modal).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios y cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(requests.some((r) => r.url.endsWith('/adults'))).toBe(false);
  });
});

describe('document preview', () => {
  it('previews a selected PDF and releases its object URL when removed', () => {
    const props = { label: 'Documento', accept: 'application/pdf', onChange: vi.fn() };
    const { rerender } = render(
      <FileCapture
        {...props}
        file={new File(['%PDF-test'], 'certificado.pdf', { type: 'application/pdf' })}
      />
    );
    expandPreview('Vista previa de documento');
    expect(screen.getByTitle('Vista previa: Documento').getAttribute('data-source')).toBe(
      'blob:test-document'
    );
    expect(screen.queryByRole('link', { name: /Abrir archivo seleccionado/ })).toBeNull();
    rerender(<FileCapture {...props} file={null} />);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-document');
    expect(screen.queryByTitle('Vista previa: Documento')).toBeNull();
  });

  it('shows a saved ID image at full size and preserves it when choosing an invalid file', () => {
    const onChange = vi.fn();
    render(
      <FileCapture
        label="Documento"
        accept="image/png,application/pdf"
        file={null}
        existingUrl="/api/admin/files/enrollments/id.png"
        viewUrl="/api/programs/1/file/enrollments/id.png"
        onChange={onChange}
      />
    );
    expect(screen.getByAltText('Documento completo: Documento').getAttribute('src')).toBe(
      '/api/programs/1/file/enrollments/id.png'
    );
    fireEvent.change(screen.getByLabelText('Documento'), {
      target: { files: [new File(['bad'], 'bad.exe', { type: 'application/octet-stream' })] },
    });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('explains the child identity document and allows adding their EPS certificate', async () => {
    await enter();
    fireEvent.click(screen.getByRole('button', { name: '+ Agregar niño' }));
    expect(
      screen.getByText('Para el niño o niña, adjunta el registro civil de nacimiento.')
    ).toBeTruthy();
    expect(screen.getByLabelText('Certificado de afiliación a la EPS')).toBeTruthy();
  });
});
