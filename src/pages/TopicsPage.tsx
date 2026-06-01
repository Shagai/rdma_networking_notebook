import { topicCategories, topics } from '../data/topics'

const statusLabels = {
  seeded: 'Seeded',
  next: 'Next',
  research: 'Research',
  project: 'Project',
}

export default function TopicsPage() {
  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Knowledge map</p>
        <h1>RDMA and NVIDIA networking topics</h1>
        <p className="lede">
          Each topic has learning goals and experiments so notes can turn into reproducible understanding.
        </p>
      </header>

      <div className="topic-groups">
        {topicCategories.map((category) => (
          <section className="topic-group" key={category}>
            <div className="section-heading compact">
              <p className="eyebrow">{category}</p>
              <h2>{category}</h2>
            </div>
            <div className="topic-grid">
              {topics
                .filter((topic) => topic.category === category)
                .map((topic) => (
                  <article className="topic-card detailed" id={topic.slug} key={topic.slug}>
                    <div className="card-topline">
                      <span className={`status-pill ${topic.status}`}>{statusLabels[topic.status]}</span>
                      <span>{topic.layer}</span>
                    </div>
                    <h3>{topic.title}</h3>
                    <p>{topic.summary}</p>
                    <div className="detail-columns">
                      <div>
                        <strong>Learn</strong>
                        <ul>
                          {topic.learningGoals.map((goal) => (
                            <li key={goal}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong>Experiments</strong>
                        <ul>
                          {topic.experiments.map((experiment) => (
                            <li key={experiment}>{experiment}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
