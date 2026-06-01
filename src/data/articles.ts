export type Article = {
  slug: string
  title: string
  subtitle: string
  status: 'seed' | 'active' | 'draft'
  section: string
  readingTime: string
  updated: string
  route: string
}

export const articles: Article[] = [
  {
    slug: 'rdma-fundamentals',
    title: 'RDMA Fundamentals',
    subtitle:
      'A deeper first-principles guide to RDMA object lifetimes, memory registration, queue pairs, work requests, completions, and measurement habits.',
    status: 'active',
    section: 'Foundations',
    readingTime: '32 min',
    updated: '2026-06-01',
    route: '/articles/rdma-fundamentals',
  },
]
