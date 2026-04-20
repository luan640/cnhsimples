import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const INSTRUCTOR_ROUTES = ['/painel', '/agenda', '/carteira', '/perfil/instrutor']
const STUDENT_ROUTES = ['/minhas-aulas', '/perfil/aluno']
const ADMIN_ROUTES = ['/admin']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const isInstructorRoute = INSTRUCTOR_ROUTES.some(r => path.startsWith(r))
  const isStudentRoute = STUDENT_ROUTES.some(r => path.startsWith(r))
  const isAdminRoute = ADMIN_ROUTES.some(r => path.startsWith(r))

  if ((isInstructorRoute || isStudentRoute) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/login/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
