import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// GET /api/courses/[slug] - Get public course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { env } = getCloudflareContext();
  const { slug } = await params;

  try {
    // Get course by slug (only active courses) with enrollment counts split by member status
    const course = await env.DB.prepare(
      `
      SELECT
        c.*,
        COUNT(ce.id) as enrollmentCount,
        SUM(CASE WHEN ce.isMember = 1 THEN 1 ELSE 0 END) as memberCount,
        SUM(CASE WHEN ce.isMember = 0 OR ce.isMember IS NULL THEN 1 ELSE 0 END) as nonMemberCount
      FROM Course c
      LEFT JOIN CourseEnrollment ce ON c.id = ce.courseId
      WHERE c.slug = ? AND c.isActive = 1
      GROUP BY c.id
    `
    )
      .bind(slug)
      .first();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Calculate capacity info with 50/50 split
    const capacity = course.capacity as number | null;
    const enrollmentCount = (course.enrollmentCount as number) || 0;
    const memberCount = (course.memberCount as number) || 0;
    const nonMemberCount = (course.nonMemberCount as number) || 0;

    let isFull = false;
    let memberQuota = null;
    let nonMemberQuota = null;
    let memberSpotsLeft = null;
    let nonMemberSpotsLeft = null;

    if (capacity) {
      memberQuota = Math.floor(capacity / 2);
      nonMemberQuota = capacity - memberQuota;
      memberSpotsLeft = Math.max(0, memberQuota - memberCount);
      nonMemberSpotsLeft = Math.max(0, nonMemberQuota - nonMemberCount);
      isFull = enrollmentCount >= capacity;
    }

    const formattedCourse = {
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
      enrollmentCount,
      memberCount,
      nonMemberCount,
      memberQuota,
      nonMemberQuota,
      memberSpotsLeft,
      nonMemberSpotsLeft,
      isFull,
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
