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
  slug: string
  title: string
  folder: string
  status: MilestoneStatus
  summary: string
  concepts: string[]
  nextStep: string
}

export type ProjectReport = {
  title: string
  status: MilestoneStatus
  folder: string
  summary: string
  artifacts: string[]
  flow: string[]
  commands: { label: string; command: string }[]
  nextChecks: string[]
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
    status: 'done',
    date: '2026-06-12',
    summary: 'Completed the RDMA ping-pong starter with verbs resource setup, TCP metadata exchange, payload validation, tests, and project notes.',
  },
  {
    title: 'RXE reproducible lab',
    status: 'active',
    date: 'Next',
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
    slug: '01-rdma-pingpong',
    title: 'RDMA Ping-Pong',
    folder: 'projects/01-rdma-pingpong',
    status: 'done',
    summary: 'Implemented the first two-peer RC send/receive application with a TCP control plane and validated payload round trip.',
    concepts: ['libibverbs', 'RC queue pairs', 'TCP metadata exchange', 'Completion polling'],
    nextStep: 'Run the same commands on RXE or physical RDMA devices and capture command output.',
  },
  {
    order: 2,
    slug: '02-zero-copy-file-transfer',
    title: 'Zero-Copy File Transfer',
    folder: 'projects/02-zero-copy-file-transfer',
    status: 'planned',
    summary: 'Move file contents between hosts while making chunking, buffer ownership, and correctness checks explicit.',
    concepts: ['Chunking', 'Flow control', 'Registered buffers', 'Checksum validation'],
    nextStep: 'Start from a fixed in-memory buffer before adding file I/O.',
  },
  {
    order: 3,
    slug: '03-rdma-key-value-store',
    title: 'RDMA Key-Value Store',
    folder: 'projects/03-rdma-key-value-store',
    status: 'planned',
    summary: 'Map application-level put, get, and delete operations onto RDMA request and response movement.',
    concepts: ['Protocol design', 'Store layout', 'Repeated operations', 'Error statuses'],
    nextStep: 'Define the request and response protocol before wiring transport.',
  },
  {
    order: 4,
    slug: '04-throughput-latency-benchmark',
    title: 'Throughput And Latency Benchmark',
    folder: 'projects/04-throughput-latency-benchmark',
    status: 'planned',
    summary: 'Measure RDMA latency and throughput with reproducible workload parameters and recorded environment context.',
    concepts: ['Benchmark design', 'Payload sweeps', 'Queue depth', 'Result export'],
    nextStep: 'Implement explicit workload parameters and a latency mode first.',
  },
  {
    order: 5,
    slug: '05-mini-rdma-runtime',
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
    status: 'done',
    artifact: 'Implemented RESET to INIT to RTR to RTS transitions in Project 01',
    nextStep: 'Turn the code path into a visual sequence once the RXE run is captured.',
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
    status: 'active',
    artifact: 'Runbook with cleanup steps',
    nextStep: 'Use Project 01 as the application-level smoke test after ibv_rc_pingpong.',
  },
]

export const projectReports: ProjectReport[] = [
  {
    title: 'Project 01: RDMA Ping-Pong',
    status: 'done',
    folder: 'projects/01-rdma-pingpong',
    summary:
      'A one-shot reliable-connected verbs application: the server posts a receive, the client sends rdma-ping, the server validates it, and the client validates rdma-pong.',
    artifacts: [
      'Client and server binaries in starter/bin after make.',
      'Shared endpoint parser and payload validator in starter/src/protocol.c.',
      'Verbs setup, QP transitions, posting, polling, and cleanup in starter/src/common.c.',
      'Hardware-independent parser tests in starter/tests/test_protocol.c.',
    ],
    flow: [
      'Open device, query port, allocate protection domain, create CQs and one RC QP.',
      'Register fixed send and receive buffers with local-write access.',
      'Exchange LID, QPN, PSN, GID index, and GID over the TCP control channel.',
      'Move both QPs through INIT, RTR, and RTS, then synchronize with READY.',
      'Post receives before sends, poll completions, validate payloads, and clean up in reverse ownership order.',
    ],
    commands: [
      {
        label: 'Build',
        command: 'make -C projects/01-rdma-pingpong/starter',
      },
      {
        label: 'Tests',
        command: 'make -C projects/01-rdma-pingpong/starter test',
      },
      {
        label: 'Server',
        command:
          './projects/01-rdma-pingpong/starter/bin/rdma-pingpong-server --device <device> --ib-port 1 --tcp-port 7471 --debug',
      },
      {
        label: 'Client',
        command:
          './projects/01-rdma-pingpong/starter/bin/rdma-pingpong-client --server <server-ip> --device <device> --ib-port 1 --tcp-port 7471 --debug',
      },
    ],
    nextChecks: [
      'Capture a full RXE run because the current local environment exposes no usable RDMA device list.',
      'Add a multi-message mode only after the one-shot run is recorded.',
      'Use the repeated setup code as input for Project 05, not as an abstraction inside Project 01.',
    ],
  },
]
