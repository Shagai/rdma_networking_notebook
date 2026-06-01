export type MilestoneStatus = 'done' | 'active' | 'planned'

export type Milestone = {
  title: string
  status: MilestoneStatus
  date: string
  summary: string
}

export type Experiment = {
  title: string
  topic: string
  status: MilestoneStatus
  artifact: string
  nextStep: string
}

export const milestones: Milestone[] = [
  {
    title: 'Website foundation',
    status: 'done',
    date: '2026-06-01',
    summary: 'Vite, React, TypeScript, React Router, MDX, global design system, local data files, and the first RDMA article.',
  },
  {
    title: 'First verbs lab',
    status: 'active',
    date: 'Next',
    summary: 'Create a minimal reliable-connected ping-pong walkthrough with object lifetime diagrams and command output notes.',
  },
  {
    title: 'RXE reproducible lab',
    status: 'planned',
    date: 'Planned',
    summary: 'Document a safe Soft-RoCE setup for local learning without requiring physical RDMA hardware.',
  },
  {
    title: 'Benchmark notebook',
    status: 'planned',
    date: 'Planned',
    summary: 'Collect perftest runs, topology notes, and configuration deltas in a reusable benchmark template.',
  },
]

export const experiments: Experiment[] = [
  {
    title: 'Queue pair state trace',
    topic: 'libibverbs',
    status: 'active',
    artifact: 'Annotated sequence diagram and code snippets',
    nextStep: 'Capture RESET to RTS transitions from a small RC example.',
  },
  {
    title: 'GID index inventory',
    topic: 'RoCE / RoCEv2',
    status: 'planned',
    artifact: 'Table of ports, GIDs, VLANs, and IP mappings',
    nextStep: 'Choose a host and record ibv_devinfo plus show_gids output.',
  },
  {
    title: 'RXE smoke test',
    topic: 'Soft-RoCE / RXE',
    status: 'planned',
    artifact: 'Runbook with cleanup steps',
    nextStep: 'Create a disposable VM recipe and validate ibv_rc_pingpong.',
  },
]
