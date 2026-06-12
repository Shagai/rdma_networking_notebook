# RDMA Networking Notebook

A Vite, React, TypeScript, and MDX website for a personal RDMA / NVIDIA networking knowledge base and project tracker.

## What is included

- Vite static app with React Router navigation.
- MDX article support for long-form technical notes.
- A distill-inspired reading layout with sidenotes, wide figures, and interactive explanations.
- Local TypeScript data for topics, article metadata, milestones, and experiments.
- Initial coverage for RDMA fundamentals, InfiniBand, RoCEv2, RXE, libibverbs, RDMA CM, perftest, UCX, libfabric, SPDK NVMe-oF, GPUDirect RDMA, NCCL, DOCA, and project tracking.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```

## Content structure

- `src/articles/` contains MDX articles.
- `src/data/topics.ts` stores the learning map.
- `src/data/projects.ts` stores milestones and experiments.
- `projects/` contains buildable learning projects, starter workspaces, checkpoints, verification notes, and experiment notebooks.
- `src/components/InteractiveFigures.tsx` contains reusable interactive diagrams.

The app uses `HashRouter` so the static build can be deployed later to GitHub Pages, Netlify, or Vercel without needing server-side route rewrites.

## GitHub Pages

The repository includes a GitHub Actions workflow that runs CI on pull requests and pushes to `main`. On successful pushes to `main`, it builds the Vite app and deploys `dist/` to GitHub Pages.

In the GitHub repository settings, set **Pages** -> **Build and deployment** -> **Source** to **GitHub Actions**.
