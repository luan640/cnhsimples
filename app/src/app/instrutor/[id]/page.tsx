import { notFound, redirect } from 'next/navigation'

import { InstructorBookingView } from '@/components/instructor/InstructorBookingView'
import { getPublicInstructorDetail } from '@/lib/instructors/detail'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function InstructorDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login/aluno?next=${encodeURIComponent(`/instrutor/${id}`)}`)
  }

  const [instructor, profileResult] = await Promise.all([
    getPublicInstructorDetail(id),
    supabase
      .from('student_profiles')
      .select('latitude, longitude')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!instructor) {
    notFound()
  }

  const studentLat = profileResult.data?.latitude ?? null
  const studentLon = profileResult.data?.longitude ?? null

  return (
    <InstructorBookingView
      instructor={instructor}
      studentLat={studentLat}
      studentLon={studentLon}
    />
  )
}
