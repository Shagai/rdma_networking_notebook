import { Link } from 'react-router-dom'
import { HomeTopologyFigure, ProtocolPathFigure } from '../components/InteractiveFigures'
import { articles } from '../data/articles'
import { milestones } from '../data/projects'
import { topics } from '../data/topics'

export default function HomePage() {
  const seededTopics = topics.filter((topic) => topic.status === 'seeded')
  const nextTopics = topics.filter((topic) => topic.status === 'next').slice(0, 4)
  const activeMilestone = milestones.find((milestone) => milestone.status === 'active')

  return (
    <div className="page">
      <section className="home-intro">
        <div className="intro-copy">
          <p className="eyebrow">Personal research notebook</p>
          <h1>RDMA and NVIDIA networking, explained from first principles to lab evidence.</h1>
          <p className="lede">
            A static knowledge base for learning RDMA fundamentals, InfiniBand, RoCE, RXE, verbs,
            RDMA CM, benchmarks, UCX, libfabric, NVMe-oF, GPUDirect RDMA, NCCL, DOCA, and project work.
          </p>
          <div className="action-row">
            <Link className="button primary" to="/articles/rdma-fundamentals">
              Read the first article
            </Link>
            <Link className="button" to="/topics">
              Browse the map
            </Link>
          </div>
        </div>
        <HomeTopologyFigure />
      </section>

      <section className="reader-section">
        <div className="section-heading">
          <p className="eyebrow">Start here</p>
          <h2>Learning path</h2>
          <p>Begin with stable concepts, then attach concrete transports, APIs, and experiments.</p>
        </div>
        <div className="learning-path">
          {seededTopics.map((topic, index) => (
            <article className="topic-card" key={topic.slug}>
              <span className="step-number">{index + 1}</span>
              <p className="card-kicker">{topic.layer}</p>
              <h3>{topic.title}</h3>
              <p>{topic.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wide-section">
        <ProtocolPathFigure />
      </section>

      <section className="reader-section split-section">
        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Articles</p>
            <h2>Long-form notes</h2>
          </div>
          <div className="article-list">
            {articles.map((article) => (
              <Link className="article-row" key={article.slug} to={article.route}>
                <span>{article.section}</span>
                <strong>{article.title}</strong>
                <small>{article.subtitle}</small>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading compact">
            <p className="eyebrow">Project pulse</p>
            <h2>Current work</h2>
          </div>
          <div className="progress-panel">
            <span className="status-pill active">Active</span>
            <h3>{activeMilestone?.title}</h3>
            <p>{activeMilestone?.summary}</p>
            <Link className="text-link" to="/projects">
              Open project tracker
            </Link>
          </div>
        </div>
      </section>

      <section className="reader-section">
        <div className="section-heading">
          <p className="eyebrow">Queue</p>
          <h2>Next concepts to deepen</h2>
        </div>
        <div className="compact-grid">
          {nextTopics.map((topic) => (
            <article className="mini-card" key={topic.slug}>
              <strong>{topic.title}</strong>
              <p>{topic.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
