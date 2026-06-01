import { Link } from 'react-router-dom'
import { articles } from '../data/articles'

export default function ArticlesPage() {
  return (
    <div className="page narrow-page">
      <header className="page-header">
        <p className="eyebrow">Long-form MDX</p>
        <h1>Articles</h1>
        <p className="lede">
          Progressive explanations with diagrams, sidenotes, and interactive figures. The first article establishes the vocabulary used across the rest of the notebook.
        </p>
      </header>
      <div className="article-list">
        {articles.map((article) => (
          <Link className="article-row large" key={article.slug} to={article.route}>
            <span>
              {article.section} · {article.readingTime}
            </span>
            <strong>{article.title}</strong>
            <small>{article.subtitle}</small>
            <em>{article.status}</em>
          </Link>
        ))}
      </div>
    </div>
  )
}
