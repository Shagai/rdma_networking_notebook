import p01Checkpoints from '../../projects/01-rdma-pingpong/docs/checkpoints.md?raw'
import p01Design from '../../projects/01-rdma-pingpong/docs/design.md?raw'
import p01Verification from '../../projects/01-rdma-pingpong/docs/verification.md?raw'
import p01Notes from '../../projects/01-rdma-pingpong/notes/experiments.md?raw'
import p01Readme from '../../projects/01-rdma-pingpong/README.md?raw'
import p01Starter from '../../projects/01-rdma-pingpong/starter/README.md?raw'
import p02Checkpoints from '../../projects/02-zero-copy-file-transfer/docs/checkpoints.md?raw'
import p02Design from '../../projects/02-zero-copy-file-transfer/docs/design.md?raw'
import p02Verification from '../../projects/02-zero-copy-file-transfer/docs/verification.md?raw'
import p02Notes from '../../projects/02-zero-copy-file-transfer/notes/experiments.md?raw'
import p02Readme from '../../projects/02-zero-copy-file-transfer/README.md?raw'
import p02Starter from '../../projects/02-zero-copy-file-transfer/starter/README.md?raw'
import p03Checkpoints from '../../projects/03-rdma-key-value-store/docs/checkpoints.md?raw'
import p03Design from '../../projects/03-rdma-key-value-store/docs/design.md?raw'
import p03Verification from '../../projects/03-rdma-key-value-store/docs/verification.md?raw'
import p03Notes from '../../projects/03-rdma-key-value-store/notes/experiments.md?raw'
import p03Readme from '../../projects/03-rdma-key-value-store/README.md?raw'
import p03Starter from '../../projects/03-rdma-key-value-store/starter/README.md?raw'
import p04Checkpoints from '../../projects/04-throughput-latency-benchmark/docs/checkpoints.md?raw'
import p04Design from '../../projects/04-throughput-latency-benchmark/docs/design.md?raw'
import p04Verification from '../../projects/04-throughput-latency-benchmark/docs/verification.md?raw'
import p04Notes from '../../projects/04-throughput-latency-benchmark/notes/experiments.md?raw'
import p04Readme from '../../projects/04-throughput-latency-benchmark/README.md?raw'
import p04Starter from '../../projects/04-throughput-latency-benchmark/starter/README.md?raw'
import p05Checkpoints from '../../projects/05-mini-rdma-runtime/docs/checkpoints.md?raw'
import p05Design from '../../projects/05-mini-rdma-runtime/docs/design.md?raw'
import p05Verification from '../../projects/05-mini-rdma-runtime/docs/verification.md?raw'
import p05Notes from '../../projects/05-mini-rdma-runtime/notes/experiments.md?raw'
import p05Readme from '../../projects/05-mini-rdma-runtime/README.md?raw'
import p05Starter from '../../projects/05-mini-rdma-runtime/starter/README.md?raw'

export type ProjectDocSection = {
  id: string
  title: string
  sourcePath: string
  markdown: string
}

export type ProjectDocBundle = {
  slug: string
  sections: ProjectDocSection[]
}

const section = (id: string, title: string, sourcePath: string, markdown: string): ProjectDocSection => ({
  id,
  title,
  sourcePath,
  markdown,
})

export const projectDocs: ProjectDocBundle[] = [
  {
    slug: '01-rdma-pingpong',
    sections: [
      section('overview', 'Overview', 'projects/01-rdma-pingpong/README.md', p01Readme),
      section('design', 'Design', 'projects/01-rdma-pingpong/docs/design.md', p01Design),
      section('checkpoints', 'Checkpoints', 'projects/01-rdma-pingpong/docs/checkpoints.md', p01Checkpoints),
      section('verification', 'Verification', 'projects/01-rdma-pingpong/docs/verification.md', p01Verification),
      section('notes', 'Experiment Notes', 'projects/01-rdma-pingpong/notes/experiments.md', p01Notes),
      section('starter', 'Starter README', 'projects/01-rdma-pingpong/starter/README.md', p01Starter),
    ],
  },
  {
    slug: '02-zero-copy-file-transfer',
    sections: [
      section('overview', 'Overview', 'projects/02-zero-copy-file-transfer/README.md', p02Readme),
      section('design', 'Design', 'projects/02-zero-copy-file-transfer/docs/design.md', p02Design),
      section('checkpoints', 'Checkpoints', 'projects/02-zero-copy-file-transfer/docs/checkpoints.md', p02Checkpoints),
      section('verification', 'Verification', 'projects/02-zero-copy-file-transfer/docs/verification.md', p02Verification),
      section('notes', 'Experiment Notes', 'projects/02-zero-copy-file-transfer/notes/experiments.md', p02Notes),
      section('starter', 'Starter README', 'projects/02-zero-copy-file-transfer/starter/README.md', p02Starter),
    ],
  },
  {
    slug: '03-rdma-key-value-store',
    sections: [
      section('overview', 'Overview', 'projects/03-rdma-key-value-store/README.md', p03Readme),
      section('design', 'Design', 'projects/03-rdma-key-value-store/docs/design.md', p03Design),
      section('checkpoints', 'Checkpoints', 'projects/03-rdma-key-value-store/docs/checkpoints.md', p03Checkpoints),
      section('verification', 'Verification', 'projects/03-rdma-key-value-store/docs/verification.md', p03Verification),
      section('notes', 'Experiment Notes', 'projects/03-rdma-key-value-store/notes/experiments.md', p03Notes),
      section('starter', 'Starter README', 'projects/03-rdma-key-value-store/starter/README.md', p03Starter),
    ],
  },
  {
    slug: '04-throughput-latency-benchmark',
    sections: [
      section('overview', 'Overview', 'projects/04-throughput-latency-benchmark/README.md', p04Readme),
      section('design', 'Design', 'projects/04-throughput-latency-benchmark/docs/design.md', p04Design),
      section('checkpoints', 'Checkpoints', 'projects/04-throughput-latency-benchmark/docs/checkpoints.md', p04Checkpoints),
      section('verification', 'Verification', 'projects/04-throughput-latency-benchmark/docs/verification.md', p04Verification),
      section('notes', 'Experiment Notes', 'projects/04-throughput-latency-benchmark/notes/experiments.md', p04Notes),
      section('starter', 'Starter README', 'projects/04-throughput-latency-benchmark/starter/README.md', p04Starter),
    ],
  },
  {
    slug: '05-mini-rdma-runtime',
    sections: [
      section('overview', 'Overview', 'projects/05-mini-rdma-runtime/README.md', p05Readme),
      section('design', 'Design', 'projects/05-mini-rdma-runtime/docs/design.md', p05Design),
      section('checkpoints', 'Checkpoints', 'projects/05-mini-rdma-runtime/docs/checkpoints.md', p05Checkpoints),
      section('verification', 'Verification', 'projects/05-mini-rdma-runtime/docs/verification.md', p05Verification),
      section('notes', 'Experiment Notes', 'projects/05-mini-rdma-runtime/notes/experiments.md', p05Notes),
      section('starter', 'Starter README', 'projects/05-mini-rdma-runtime/starter/README.md', p05Starter),
    ],
  },
]

export function getProjectDocs(slug: string) {
  return projectDocs.find((project) => project.slug === slug)
}
