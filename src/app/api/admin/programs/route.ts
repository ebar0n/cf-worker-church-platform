import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { DEPARTMENTS } from '@/lib/constants';

// GET /api/admin/programs - Get all programs with enrollment counts
export async function GET() {
  const { env } = getCloudflareContext();

  try {
    // Get all programs with enrollment counts
    const programs = await env.DB.prepare(
      `
      SELECT
        p.*,
        COUNT(e.id) as enrollmentCount
      FROM Program p
      LEFT JOIN Enrollment e ON p.id = e.programId
      GROUP BY p.id
      ORDER BY p.createdAt DESC
    `
    ).all();

    const programsWithCounts = programs.results.map((program: any) => ({
      id: program.id,
      title: program.title,
      department: program.department,
      content: program.content,
      isActive: program.isActive === 1,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      _count: {
        enrollments: program.enrollmentCount,
      },
    }));

    return NextResponse.json(programsWithCounts);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  }
}

// POST /api/admin/programs - Create new program
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const body = (await request.json()) as {
      title: string;
      department: string;
      content?: string;
      isActive: boolean;
    };
    const { title, department, content, isActive } = body;

    // Validate required fields
    if (!title || !department) {
      return NextResponse.json({ error: 'Title and department are required' }, { status: 400 });
    }

    // Validate department exists in constants
    const validDepartment = DEPARTMENTS.find((dept) => dept.code === department);
    if (!validDepartment) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Insert new program
    const result = await env.DB.prepare(
      'INSERT INTO Program (title, department, content, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(title, department, content || null, isActive ? 1 : 0, now, now)
      .run();

    // Get the newly created program
    const newProgram = await env.DB.prepare('SELECT * FROM Program WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    if (!newProgram) {
      return NextResponse.json({ error: 'Failed to retrieve created program' }, { status: 500 });
    }

    const programWithCount = {
      id: newProgram.id,
      title: newProgram.title,
      department: newProgram.department,
      content: newProgram.content,
      isActive: newProgram.isActive === 1,
      createdAt: newProgram.createdAt,
      updatedAt: newProgram.updatedAt,
      _count: { enrollments: 0 },
    };

    return NextResponse.json(programWithCount, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  }
}
