import { Link, Navigate, NavLink, useParams } from 'react-router-dom'
import MarkdownDocument from '../components/MarkdownDocument'
import { getProjectDocs } from '../data/projectDocs'
import { learningProjects } from '../data/projects'

const statusLabels = {
  done: 'Done',
  active: 'Active',
  planned: 'Planned',
}

export default function ProjectDetailPage() {
  const { slug } = useParams()
  const project = learningProjects.find((item) => item.slug === slug)
  const docs = slug ? getProjectDocs(slug) : undefined

  if (!slug || !project || !docs) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="page project-doc-page">
      <header className="page-header project-doc-hero">
        <p className="eyebrow">Project documentation</p>
        <h1>{project.title}</h1>
        <p className="lede">{project.summary}</p>
        <div className="project-doc-meta">
          <span className={`status-pill ${project.status}`}>{statusLabels[project.status]}</span>
          <code>{project.folder}</code>
        </div>
        <div className="concept-list" aria-label={`${project.title} concepts`}>
          {project.concepts.map((concept) => (
            <span key={concept}>{concept}</span>
          ))}
        </div>
      </header>

      <div className="project-doc-shell">
        <aside className="project-doc-nav" aria-label="Project documentation navigation">
          <Link className="text-link" to="/projects">
            Back to projects
          </Link>

          <div>
            <strong>Projects</strong>
            <nav>
              {learningProjects.map((item) => (
                <NavLink
                  key={item.slug}
                  to={`/projects/${item.slug}`}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                >
                  <span>{String(item.order).padStart(2, '0')}</span>
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            <strong>Sections</strong>
            <nav>
              {docs.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="project-doc-main">
          {docs.sections.map((section) => (
            <section className="project-doc-section" id={section.id} key={section.id}>
              <div className="project-doc-section-heading">
                <p className="eyebrow">{section.sourcePath}</p>
                <h2>{section.title}</h2>
              </div>
              <MarkdownDocument markdown={section.markdown} />
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
