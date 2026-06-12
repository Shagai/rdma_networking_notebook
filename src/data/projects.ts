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

export type LearningProject = {
  order: number
  title: string
  folder: string
  status: MilestoneStatus
  summary: string
  concepts: string[]
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
    title: 'Project workspace skeleton',
    status: 'done',
    date: '2026-06-06',
    summary: 'Added numbered project folders, a reusable template, starter areas, checkpoints, verification notes, and experiment notebooks.',
  },
  {
    title: 'First project implementation',
    status: 'active',
    date: 'Next',
    summary: 'Implement the RDMA ping-pong project from the new starter workspace, with object lifetime diagrams and command output notes.',
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

export const learningProjects: LearningProject[] = [
  {
    order: 1,
    title: 'RDMA Ping-Pong',
    folder: 'projects/01-rdma-pingpong',
    status: 'active',
    summary: 'Build the first two-peer send/receive application and validate one request/response round trip.',
    concepts: ['Device setup', 'Memory registration', 'Queue pair states', 'Completion polling'],
    nextStep: 'Fill the starter with client and server command skeletons.',
  },
  {
    order: 2,
    title: 'Zero-Copy File Transfer',
    folder: 'projects/02-zero-copy-file-transfer',
    status: 'planned',
    summary: 'Move file contents between hosts while making chunking, buffer ownership, and correctness checks explicit.',
    concepts: ['Chunking', 'Flow control', 'Registered buffers', 'Checksum validation'],
    nextStep: 'Start from a fixed in-memory buffer before adding file I/O.',
  },
  {
    order: 3,
    title: 'RDMA Key-Value Store',
    folder: 'projects/03-rdma-key-value-store',
    status: 'planned',
    summary: 'Map application-level put, get, and delete operations onto RDMA request and response movement.',
    concepts: ['Protocol design', 'Store layout', 'Repeated operations', 'Error statuses'],
    nextStep: 'Define the request and response protocol before wiring transport.',
  },
  {
    order: 4,
    title: 'Throughput And Latency Benchmark',
    folder: 'projects/04-throughput-latency-benchmark',
    status: 'planned',
    summary: 'Measure RDMA latency and throughput with reproducible workload parameters and recorded environment context.',
    concepts: ['Benchmark design', 'Payload sweeps', 'Queue depth', 'Result export'],
    nextStep: 'Implement explicit workload parameters and a latency mode first.',
  },
  {
    order: 5,
    title: 'Mini RDMA Runtime',
    folder: 'projects/05-mini-rdma-runtime',
    status: 'planned',
    summary: 'Extract repeated resource setup and cleanup into a small runtime without hiding the learning-critical details.',
    concepts: ['API design', 'Resource ownership', 'Error modeling', 'Project reuse'],
    nextStep: 'Inventory duplicated setup code after the first projects exist.',
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
