import { experiments, milestones } from '../data/projects'

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
        <h1>Open-source project progress and experiments</h1>
        <p className="lede">
          A lightweight local tracker for turning reading notes into labs, diagrams, benchmark runs, and public writeups.
        </p>
      </header>

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
