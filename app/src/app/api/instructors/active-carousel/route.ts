import { NextResponse } from 'next/server'

import { getInstructorSearchItems } from '@/lib/instructors/search'

export async function GET() {
  const instructors = await getInstructorSearchItems()

  const activeInstructors = instructors
    .filter((instructor) => {
      const activeCategories = Object.entries(instructor.individual_prices).filter(
        ([, price]) => typeof price === 'number' && price > 0
      )

      return instructor.status === 'active' && activeCategories.length > 0
    })
    .sort((a, b) => {
      if (b.lesson_count !== a.lesson_count) return b.lesson_count - a.lesson_count
      if (b.review_count !== a.review_count) return b.review_count - a.review_count
      return b.rating - a.rating
    })
    .slice(0, 12)

  return NextResponse.json(activeInstructors)
}
