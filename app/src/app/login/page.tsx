import { redirect } from 'next/navigation'

type PageProps = {
  searchParams: Promise<{
    next?: string
    oauth?: string
  }>
}

function buildStudentLoginHref(params: Awaited<PageProps['searchParams']>) {
  const search = new URLSearchParams()

  if (params.next) {
    search.set('next', params.next)
  }

  if (params.oauth) {
    search.set('oauth', params.oauth)
  }

  const query = search.toString()

  return query ? `/login/aluno?${query}` : '/login/aluno'
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams

  redirect(buildStudentLoginHref(resolvedSearchParams))
}
