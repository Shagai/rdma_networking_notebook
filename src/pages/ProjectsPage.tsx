import { Link } from 'react-router-dom'
import { experiments, learningProjects, milestones, projectReports } from '../data/projects'

const statusLabels = {
  done: 'Done',
  active: 'Active',
  planned: 'Planned',
}

export default function ProjectsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Execution tracker</p>
        <h1>Learning projects, progress, and experiments</h1>
        <p className="lede">
          A lightweight local tracker for turning reading notes into buildable RDMA projects, labs, diagrams,
          benchmark runs, and public writeups.
        </p>
      </header>

      <section className="reader-section">
        <div className="section-heading">
          <p className="eyebrow">Build path</p>
          <h2>Projects to complete in order</h2>
          <p>
            Each project has a folder with a starter workspace, design notes, checkpoints, verification commands,
            and an experiment notebook.
          </p>
        </div>

        <div className="project-track">
          {learningProjects.map((project) => (
            <article className="project-card" key={project.folder}>
              <div className="card-topline">
                <span className="project-number">{String(project.order).padStart(2, '0')}</span>
                <span className={`status-pill ${project.status}`}>{statusLabels[project.status]}</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <code>{project.folder}</code>
              <div className="concept-list" aria-label={`${project.title} concepts`}>
                {project.concepts.map((concept) => (
                  <span key={concept}>{concept}</span>
                ))}
              </div>
              <p>
                <strong>Next:</strong> {project.nextStep}
              </p>
              <Link className="text-link project-card-link" to={`/projects/${project.slug}`}>
                Open full documentation
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="reader-section">
        <div className="section-heading">
          <p className="eyebrow">Completed build</p>
          <h2>Project implementation notes</h2>
          <p>
            The tracker records what the completed starter now teaches, which commands verify it, and which lab
            evidence still needs to be captured on RDMA or RXE hardware.
          </p>
        </div>

        <div className="project-report-list">
          {projectReports.map((report) => (
            <article className="project-report" key={report.folder}>
              <div className="card-topline">
                <code>{report.folder}</code>
                <span className={`status-pill ${report.status}`}>{statusLabels[report.status]}</span>
              </div>
              <h3>{report.title}</h3>
              <p>{report.summary}</p>

              <div className="detail-columns">
                <div>
                  <strong>Artifacts</strong>
                  <ul>
                    {report.artifacts.map((artifact) => (
                      <li key={artifact}>{artifact}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Data path</strong>
                  <ul>
                    {report.flow.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="command-list">
                {report.commands.map((command) => (
                  <div key={command.label}>
                    <span>{command.label}</span>
                    <code>{command.command}</code>
                  </div>
                ))}
              </div>

              <div className="next-checks">
                <strong>Next checks</strong>
                <ul>
                  {report.nextChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="reader-section split-section">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Milestones</p>
            <h2>Project timeline</h2>
          </div>
          <div className="timeline">
            {milestones.map((milestone) => (
              <article className="timeline-item" key={milestone.title}>
                <span className={`status-pill ${milestone.status}`}>{statusLabels[milestone.status]}</span>
                <time>{milestone.date}</time>
                <h3>{milestone.title}</h3>
                <p>{milestone.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Experiments</p>
            <h2>Lab backlog</h2>
          </div>
          <div className="experiment-list">
            {experiments.map((experiment) => (
              <article className="experiment-card" key={experiment.title}>
                <div className="card-topline">
                  <span className={`status-pill ${experiment.status}`}>{statusLabels[experiment.status]}</span>
                  <span>{experiment.topic}</span>
                </div>
                <h3>{experiment.title}</h3>
                <p>
                  <strong>Artifact:</strong> {experiment.artifact}
                </p>
                <p>
                  <strong>Next:</strong> {experiment.nextStep}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
