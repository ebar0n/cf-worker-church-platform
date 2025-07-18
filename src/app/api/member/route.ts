import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

const memberSchema = z.object({
  documentID: z.string().min(1),
  name: z.string(),
  gender: z.string().optional(),
  phone: z.string().min(5),
  birthDate: z.string().optional(),
  maritalStatus: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  preferredContactMethod: z.string().optional(),
  baptismYear: z.number().nullable().optional(),
  ministry: z.string().optional(),
  areasToServe: z.string().optional(),
  willingToLead: z.boolean().optional(),
  suggestions: z.string().optional(),
  pastoralNotes: z.string().optional(),
  currentAcceptanceYear: z.number().nullable().optional(),
  currentAcceptanceMethod: z.string().optional(),
  currentMembershipChurch: z.string().optional(),
  transferAuthorization: z.boolean().optional(),
  currentOccupation: z.string().optional(),
  workOrStudyPlace: z.string().optional(),
  professionalArea: z.string().optional(),
  educationLevel: z.string().optional(),
  profession: z.string().optional(),
  workExperience: z.string().optional(),
  technicalSkills: z.string().optional(),
  softSkills: z.string().optional(),
  languages: z.string().optional(),
  medicalConditions: z.string().optional(),
  specialNeeds: z.string().optional(),
  interestsHobbies: z.string().optional(),
  volunteeringAvailability: z.string().optional(),
});

// Esquema específico para la creación inicial
const initialMemberSchema = z.object({
  documentID: z.string().min(1),
  name: z.string().min(2),
  phone: z.string().min(5),
});

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const { searchParams } = new URL(request.url);
  const documentID = searchParams.get('documentID');
  const turnstileToken = searchParams.get('cf-turnstile-response');

  if (!documentID) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  if (!turnstileToken) {
    return NextResponse.json({ error: 'Turnstile verification required' }, { status: 400 });
  }

  // Validar el token de Turnstile
  try {
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', turnstileToken);

    const turnstileResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const turnstileResult = (await turnstileResponse.json()) as { success: boolean };

    if (!turnstileResult.success) {
      return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error validating Turnstile:', error);
    return NextResponse.json({ error: 'Error validating Turnstile' }, { status: 500 });
  }

  try {
    const member = await env.DB.prepare('SELECT * FROM Member WHERE documentID = ?')
      .bind(documentID)
      .first();

    if (!member) {
      return NextResponse.json({ documentID: null }, { status: 200 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const data = (await request.json()) as Record<string, unknown>;
    const parse = initialMemberSchema.safeParse(data);

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parse.error.errors },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      `
      INSERT INTO Member (
        documentID, name, phone, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?)
    `
    )
      .bind(parse.data.documentID, parse.data.name, parse.data.phone, now, now)
      .run();

    const member = await env.DB.prepare('SELECT * FROM Member WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    if (!member) {
      return NextResponse.json({ error: 'Error retrieving created member' }, { status: 500 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Error creating member' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const data = await request.json();
    const parse = memberSchema.safeParse(data);

    if (!parse.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parse.error.errors },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Construir dinámicamente la consulta SQL basada en las propiedades presentes
    const updateFields: string[] = [];
    const bindValues: any[] = [];

    // Función helper para agregar campos a la actualización
    const addField = (field: string, value: any) => {
      if (field in parse.data) {
        updateFields.push(`${field} = ?`);
        bindValues.push(value);
      }
    };

    // Agregar campos dinámicamente
    addField('name', parse.data.name);
    addField('gender', parse.data.gender || null);
    addField('phone', parse.data.phone);
    addField('birthDate', parse.data.birthDate);
    addField('maritalStatus', parse.data.maritalStatus || null);
    addField('address', parse.data.address);
    addField('email', parse.data.email || null);
    addField('preferredContactMethod', parse.data.preferredContactMethod || null);
    addField('baptismYear', parse.data.baptismYear || null);
    addField('ministry', parse.data.ministry || null);
    addField('areasToServe', parse.data.areasToServe || null);
    addField('willingToLead', parse.data.willingToLead ? 1 : 0);
    addField('suggestions', parse.data.suggestions || null);
    addField('pastoralNotes', parse.data.pastoralNotes || null);
    addField('currentAcceptanceYear', parse.data.currentAcceptanceYear || null);
    addField('currentAcceptanceMethod', parse.data.currentAcceptanceMethod || null);
    addField('currentMembershipChurch', parse.data.currentMembershipChurch || null);
    addField('transferAuthorization', parse.data.transferAuthorization ? 1 : 0);
    addField('currentOccupation', parse.data.currentOccupation || null);
    addField('workOrStudyPlace', parse.data.workOrStudyPlace || null);
    addField('professionalArea', parse.data.professionalArea || null);
    addField('educationLevel', parse.data.educationLevel || null);
    addField('profession', parse.data.profession || null);
    addField('workExperience', parse.data.workExperience || null);
    addField('technicalSkills', parse.data.technicalSkills || null);
    addField('softSkills', parse.data.softSkills || null);
    addField('languages', parse.data.languages || null);
    addField('medicalConditions', parse.data.medicalConditions || null);
    addField('specialNeeds', parse.data.specialNeeds || null);
    addField('interestsHobbies', parse.data.interestsHobbies || null);
    addField('volunteeringAvailability', parse.data.volunteeringAvailability || null);

    // Siempre actualizar updatedAt
    updateFields.push('updatedAt = ?');
    bindValues.push(now);

    // Agregar documentID al final para la cláusula WHERE
    bindValues.push(parse.data.documentID);

    // Construir y ejecutar la consulta SQL
    const query = `
      UPDATE Member
      SET ${updateFields.join(', ')}
      WHERE documentID = ?
    `;

    await env.DB.prepare(query)
      .bind(...bindValues)
      .run();

    const member = await env.DB.prepare('SELECT * FROM Member WHERE documentID = ?')
      .bind(parse.data.documentID)
      .first();

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Error updating member' }, { status: 500 });
  }
}
