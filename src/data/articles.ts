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
  {
    slug: 'libibverbs-infiniband-library',
    title: 'libibverbs: the InfiniBand verbs library we use',
    subtitle:
      'A code-grounded guide to the low-level RDMA library behind the ping-pong project: devices, protection domains, memory regions, queue pairs, work requests, and completions.',
    status: 'active',
    section: 'Programming',
    readingTime: '26 min',
    updated: '2026-06-12',
    route: '/articles/libibverbs-infiniband-library',
  },
]
