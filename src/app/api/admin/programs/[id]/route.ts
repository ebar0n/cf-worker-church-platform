import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { DEPARTMENTS } from '@/lib/constants';

// PUT /api/admin/programs/[id] - Update program
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();

  try {
    const { id } = await params;
    const programId = parseInt(id);
    const body = (await request.json()) as {
      title: string;
      department: string;
      content?: string;
      isActive: boolean;
    };
    const { title, department, content, isActive } = body;

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

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

    // Update the program
    await env.DB.prepare(
      'UPDATE Program SET title = ?, department = ?, content = ?, isActive = ?, updatedAt = ? WHERE id = ?'
    )
      .bind(title, department, content || null, isActive ? 1 : 0, now, programId)
      .run();

    // Get the updated program
    const updatedProgram = (await env.DB.prepare('SELECT * FROM Program WHERE id = ?')
      .bind(programId)
      .first()) as any;

    if (!updatedProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const programWithCount = {
      id: updatedProgram.id,
      title: updatedProgram.title,
      department: updatedProgram.department,
      content: updatedProgram.content,
      isActive: updatedProgram.isActive === 1,
      createdAt: updatedProgram.createdAt,
      updatedAt: updatedProgram.updatedAt,
      _count: { enrollments: 0 }, // This would need to be calculated separately if needed
    };

    return NextResponse.json(programWithCount);
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  }
}

// DELETE /api/admin/programs/[id] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const programId = parseInt(id);

    if (isNaN(programId)) {
      return NextResponse.json({ error: 'Invalid program ID' }, { status: 400 });
    }

    // This will be implemented once Prisma client is generated
    console.log('Deleting program:', programId);

    return NextResponse.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
