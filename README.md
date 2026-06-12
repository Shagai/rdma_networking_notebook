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

The default dev server is only intended for the local machine. To view the site
from another computer on the same local network, bind Vite to all interfaces:

```bash
npm run dev -- --host 0.0.0.0
```

Then open the URL from the other computer using this machine's LAN address:

```text
http://<this-machine-lan-ip>:5173/
```

For example, if this machine is `192.168.1.42`, open
`http://192.168.1.42:5173/`. Because the app uses hash routing, direct routes
also work through the hash path, such as `http://192.168.1.42:5173/#/projects`.

For a production-like local-network check, build the static site and serve the
preview server on the network:

```bash
npm run build
npm run preview -- --host 0.0.0.0
```

If another computer cannot connect, confirm both machines are on the same
network and that the firewall allows inbound connections to the Vite port.

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
