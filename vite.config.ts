import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const inferredGitHubPagesBase =
  process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith('.github.io')
    ? `/${repositoryName}/`
    : '/'

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? inferredGitHubPagesBase,
  plugins: [mdx({ include: /\.mdx$/ }), react()],
})
