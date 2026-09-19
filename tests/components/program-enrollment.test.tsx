import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProgramEnrollmentClient from '@/app/program/[id]/components/ProgramEnrollmentClient';

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
let requests: Array<{ url: string; init?: RequestInit }>;

beforeEach(() => {
  finalized = false;
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
            dataTreatmentAcceptedAt: finalized ? '2026-09-19' : null,
            participationConfirmedAt: finalized ? '2026-09-19' : null,
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

describe('family dashboard saving', () => {
  it('editing health preserves existing answers and never silently accepts consent', async () => {
    await enter();
    const row = screen.getByText(dad.name).closest('li')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Editar' }));
    const modal = screen.getByRole('dialog');
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
    expect(body.has('acceptDataTreatment')).toBe(false);
    expect(body.has('confirmParticipation')).toBe(false);
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    fireEvent.click(screen.getByRole('checkbox', { name: /Autorizo el tratamiento/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo la inscripción/ }));
    expect(screen.queryAllByRole('link', { name: /Descargar/ })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y habilitar descargas' }));
    await waitFor(() => expect(screen.getAllByRole('link', { name: /Descargar/ })).toHaveLength(4));
    const consent = JSON.parse(
      requests.find((r) => r.url.endsWith('/consent'))!.init!.body as string
    );
    expect(consent).toMatchObject({
      documentID: dad.documentID,
      acceptDataTreatment: true,
      confirmParticipation: true,
    });
  });

  it('restores confirmed downloads and keeps unsaved changes when closing is cancelled', async () => {
    finalized = true;
    await enter();
    expect(screen.getAllByRole('link', { name: /Descargar/ })).toHaveLength(4);
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
