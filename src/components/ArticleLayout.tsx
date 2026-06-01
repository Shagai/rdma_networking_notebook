import { useEffect, useMemo, useState, type ReactNode } from 'react'

type TocItem = {
  href: string
  label: string
}

type ArticleLayoutProps = {
  kicker: string
  title: string
  subtitle: string
  updated: string
  readingTime: string
  toc: TocItem[]
  children: ReactNode
}

export default function ArticleLayout({
  kicker,
  title,
  subtitle,
  updated,
  readingTime,
  toc,
  children,
}: ArticleLayoutProps) {
  const tocItems = useMemo(
    () =>
      toc.map((item) => ({
        ...item,
        id: item.href.startsWith('#') ? item.href.slice(1) : item.href,
      })),
    [toc],
  )
  const [activeId, setActiveId] = useState(tocItems[0]?.id ?? '')

  useEffect(() => {
    const headings = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((heading): heading is HTMLElement => Boolean(heading))

    if (headings.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (visible?.target.id) {
          setActiveId(visible.target.id)
        }
      },
      {
        rootMargin: '-18% 0px -65% 0px',
        threshold: [0, 1],
      },
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [tocItems])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
  }

  return (
    <article className="article-frame">
      <header className="article-hero">
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        <p className="lede">{subtitle}</p>
        <dl className="article-meta">
          <div>
            <dt>Updated</dt>
            <dd>{updated}</dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>{readingTime}</dd>
          </div>
        </dl>
      </header>

      <div className="article-grid">
        <aside className="article-toc" aria-label="On this page">
          <strong>On this page</strong>
          {tocItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeId === item.id ? 'article-toc-link is-active' : 'article-toc-link'}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <div className="article-body">{children}</div>
      </div>
    </article>
  )
}
