import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// GET /api/admin/courses/[id] - Get single course with enrollment counts
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    const course = await env.DB.prepare(
      `
      SELECT
        c.*,
        COUNT(ce.id) as enrollmentCount,
        SUM(CASE WHEN ce.status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN ce.status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount,
        SUM(CASE WHEN ce.status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON c.id = ce.courseId
      WHERE c.id = ?
      GROUP BY c.id
    `
    )
      .bind(id)
      .first();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseWithCount = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      content: course.content,
      imageUrl: course.imageUrl,
      color: course.color,
      cost: course.cost,
      startDate: course.startDate,
      endDate: course.endDate,
      capacity: course.capacity,
      isActive: course.isActive === 1,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      _count: {
        enrollments: course.enrollmentCount || 0,
        pending: course.pendingCount || 0,
        confirmed: course.confirmedCount || 0,
        rejected: course.rejectedCount || 0,
      },
    };

    return NextResponse.json(courseWithCount);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// PUT /api/admin/courses/[id] - Update course
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      content?: string;
      imageUrl?: string | null;
      color?: string;
      cost?: number;
      startDate?: string | null;
      endDate?: string | null;
      capacity?: number | null;
      isActive?: boolean;
    };

    // Check if course exists
    const existingCourse = await env.DB.prepare('SELECT * FROM Course WHERE id = ?')
      .bind(id)
      .first();

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const {
      title = existingCourse.title as string,
      description = existingCourse.description as string,
      content = existingCourse.content as string,
      imageUrl = existingCourse.imageUrl,
      color = existingCourse.color as string,
      cost = existingCourse.cost as number,
      startDate = existingCourse.startDate,
      endDate = existingCourse.endDate,
      capacity = existingCourse.capacity,
      isActive = existingCourse.isActive === 1,
    } = body;

    // Validate color format
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex format: #RRGGBB' }, { status: 400 });
    }

    // Validate cost
    if (cost < 0) {
      return NextResponse.json({ error: 'Cost cannot be negative' }, { status: 400 });
    }

    // Generate new slug if title changed
    let slug = existingCourse.slug as string;
    if (title !== existingCourse.title) {
      let newSlug = generateSlug(title);
      let slugSuffix = 0;
      let uniqueSlug = newSlug;

      // Check for existing slug (excluding current course)
      while (true) {
        const existingWithSlug = await env.DB.prepare('SELECT id FROM Course WHERE slug = ? AND id != ?')
          .bind(uniqueSlug, id)
          .first();

        if (!existingWithSlug) break;

        slugSuffix++;
        uniqueSlug = `${newSlug}-${slugSuffix}`;
      }

      slug = uniqueSlug;
    }

    const now = new Date().toISOString();

    // Update course
    await env.DB.prepare(
      `UPDATE Course SET
        title = ?,
        slug = ?,
        description = ?,
        content = ?,
        imageUrl = ?,
        color = ?,
        cost = ?,
        startDate = ?,
        endDate = ?,
        capacity = ?,
        isActive = ?,
        updatedAt = ?
      WHERE id = ?`
    )
      .bind(
        title,
        slug,
        description,
        content,
        imageUrl || null,
        color,
        cost,
        startDate || null,
        endDate || null,
        capacity || null,
        isActive ? 1 : 0,
        now,
        id
      )
      .run();

    // Get updated course with counts
    const updatedCourse = await env.DB.prepare(
      `
      SELECT
        c.*,
        COUNT(ce.id) as enrollmentCount,
        SUM(CASE WHEN ce.status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN ce.status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount,
        SUM(CASE WHEN ce.status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON c.id = ce.courseId
      WHERE c.id = ?
      GROUP BY c.id
    `
    )
      .bind(id)
      .first();

    const courseWithCount = {
      id: updatedCourse!.id,
      title: updatedCourse!.title,
      slug: updatedCourse!.slug,
      description: updatedCourse!.description,
      content: updatedCourse!.content,
      imageUrl: updatedCourse!.imageUrl,
      color: updatedCourse!.color,
      cost: updatedCourse!.cost,
      startDate: updatedCourse!.startDate,
      endDate: updatedCourse!.endDate,
      capacity: updatedCourse!.capacity,
      isActive: updatedCourse!.isActive === 1,
      createdAt: updatedCourse!.createdAt,
      updatedAt: updatedCourse!.updatedAt,
      _count: {
        enrollments: updatedCourse!.enrollmentCount || 0,
        pending: updatedCourse!.pendingCount || 0,
        confirmed: updatedCourse!.confirmedCount || 0,
        rejected: updatedCourse!.rejectedCount || 0,
      },
    };

    return NextResponse.json(courseWithCount);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] - Delete course
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = getCloudflareContext();
  const { id } = await params;

  try {
    // Check if course exists
    const existingCourse = await env.DB.prepare('SELECT id FROM Course WHERE id = ?')
      .bind(id)
      .first();

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Delete course (enrollments will be cascade deleted)
    await env.DB.prepare('DELETE FROM Course WHERE id = ?').bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
