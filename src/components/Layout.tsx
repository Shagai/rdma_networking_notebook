import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Articles', to: '/articles' },
  { label: 'Topics', to: '/topics' },
  { label: 'Projects', to: '/projects' },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="RDMA Networking Notebook home">
          <span className="brand-mark">RN</span>
          <span>
            <strong>RDMA Networking Notebook</strong>
            <small>NVIDIA, fabrics, storage, and GPU data paths</small>
          </span>
        </NavLink>
        <nav className="top-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>Static Vite knowledge base.</span>
        <span>Content lives in TypeScript data and MDX articles.</span>
      </footer>
    </div>
  )
}
