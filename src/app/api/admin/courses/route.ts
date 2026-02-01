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

// GET /api/admin/courses - Get all courses with enrollment counts
export async function GET() {
  const { env } = getCloudflareContext();

  try {
    // Get all courses with enrollment counts
    const courses = await env.DB.prepare(
      `
      SELECT
        c.*,
        COUNT(ce.id) as enrollmentCount,
        SUM(CASE WHEN ce.status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        SUM(CASE WHEN ce.status = 'confirmed' THEN 1 ELSE 0 END) as confirmedCount,
        SUM(CASE WHEN ce.status = 'rejected' THEN 1 ELSE 0 END) as rejectedCount
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON c.id = ce.courseId
      GROUP BY c.id
      ORDER BY c.createdAt DESC
    `
    ).all();

    const coursesWithCounts = courses.results.map((course: any) => ({
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
    }));

    return NextResponse.json(coursesWithCounts);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/admin/courses - Create new course
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  try {
    const body = (await request.json()) as {
      title: string;
      description: string;
      content: string;
      imageUrl?: string;
      color?: string;
      cost?: number;
      startDate?: string;
      endDate?: string;
      capacity?: number;
      isActive?: boolean;
    };

    const {
      title,
      description,
      content,
      imageUrl,
      color = '#4b207f',
      cost = 0,
      startDate,
      endDate,
      capacity,
      isActive = true,
    } = body;

    // Validate required fields
    if (!title || !description || !content) {
      return NextResponse.json(
        { error: 'Title, description, and content are required' },
        { status: 400 }
      );
    }

    // Validate color format
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex format: #RRGGBB' }, { status: 400 });
    }

    // Validate cost
    if (cost < 0) {
      return NextResponse.json({ error: 'Cost cannot be negative' }, { status: 400 });
    }

    // Generate slug and ensure uniqueness
    let slug = generateSlug(title);
    let slugSuffix = 0;
    let uniqueSlug = slug;

    // Check for existing slug and append number if needed
    while (true) {
      const existingCourse = await env.DB.prepare('SELECT id FROM Course WHERE slug = ?')
        .bind(uniqueSlug)
        .first();

      if (!existingCourse) break;

      slugSuffix++;
      uniqueSlug = `${slug}-${slugSuffix}`;
    }

    const now = new Date().toISOString();

    // Insert new course
    const result = await env.DB.prepare(
      `INSERT INTO Course (title, slug, description, content, imageUrl, color, cost, startDate, endDate, capacity, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        title,
        uniqueSlug,
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
        now
      )
      .run();

    // Get the newly created course
    const newCourse = await env.DB.prepare('SELECT * FROM Course WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();

    if (!newCourse) {
      return NextResponse.json({ error: 'Failed to retrieve created course' }, { status: 500 });
    }

    const courseWithCount = {
      id: newCourse.id,
      title: newCourse.title,
      slug: newCourse.slug,
      description: newCourse.description,
      content: newCourse.content,
      imageUrl: newCourse.imageUrl,
      color: newCourse.color,
      cost: newCourse.cost,
      startDate: newCourse.startDate,
      endDate: newCourse.endDate,
      capacity: newCourse.capacity,
      isActive: newCourse.isActive === 1,
      createdAt: newCourse.createdAt,
      updatedAt: newCourse.updatedAt,
      _count: {
        enrollments: 0,
        pending: 0,
        confirmed: 0,
        rejected: 0,
      },
    };

    return NextResponse.json(courseWithCount, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
