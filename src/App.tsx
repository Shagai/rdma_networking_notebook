import { Navigate, Route, Routes } from 'react-router-dom'
import RdmaFundamentals from './articles/rdma-fundamentals.mdx'
import Layout from './components/Layout'
import ArticlesPage from './pages/ArticlesPage'
import HomePage from './pages/HomePage'
import ProjectsPage from './pages/ProjectsPage'
import TopicsPage from './pages/TopicsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/rdma-fundamentals" element={<RdmaFundamentals />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
