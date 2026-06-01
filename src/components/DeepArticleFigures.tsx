import { useState } from 'react'

type Operation = 'Send/Receive' | 'RDMA Write' | 'RDMA Read' | 'Atomic'

const operations: Record<
  Operation,
  {
    initiator: string
    remoteCpu: string
    remoteReceive: string
    needsRemoteKey: string
    completion: string
    path: string[]
  }
> = {
  'Send/Receive': {
    initiator: 'The sender posts a send work request.',
    remoteCpu: 'The remote CPU is not copying payload bytes, but the remote process must have posted receive buffers.',
    remoteReceive: 'Yes. A receive work request supplies the destination buffer.',
    needsRemoteKey: 'No remote key for the payload transfer.',
    completion: 'Both sides can observe completions: send completion locally and receive completion remotely.',
    path: ['SQ', 'RNIC', 'Fabric', 'Remote RQ', 'Remote CQ'],
  },
  'RDMA Write': {
    initiator: 'The local side pushes bytes into a remote memory region.',
    remoteCpu: 'The remote CPU is bypassed on the data path and may not get an immediate event unless the design adds one.',
    remoteReceive: 'No matching receive is consumed.',
    needsRemoteKey: 'Yes. The initiator needs remote address and rkey.',
    completion: 'Local completion means the write operation reached the required transport completion point.',
    path: ['SQ', 'RNIC', 'Fabric', 'Remote MR', 'Local CQ'],
  },
  'RDMA Read': {
    initiator: 'The local side pulls bytes from a remote memory region.',
    remoteCpu: 'The remote CPU is bypassed on the data path, but remote memory permissions still govern access.',
    remoteReceive: 'No matching receive is consumed.',
    needsRemoteKey: 'Yes. The initiator needs remote address and rkey with read permission.',
    completion: 'Local completion means the requested bytes are available in the local destination buffer.',
    path: ['SQ', 'RNIC', 'Fabric', 'Remote MR', 'Local MR'],
  },
  Atomic: {
    initiator: 'The local side issues a small hardware-mediated update such as compare-and-swap or fetch-and-add.',
    remoteCpu: 'The remote CPU is bypassed for the operation, but correctness depends on memory ordering assumptions.',
    remoteReceive: 'No matching receive is consumed.',
    needsRemoteKey: 'Yes. The remote memory region must allow atomic access.',
    completion: 'Local completion returns the result for operations that produce one.',
    path: ['SQ', 'RNIC', 'Fabric', 'Remote word', 'Local CQ'],
  },
}

const lifecycleSteps = [
  {
    name: 'Discover',
    detail: 'Open the RDMA device, query ports, and choose the protection boundary that will own the objects.',
  },
  {
    name: 'Register',
    detail: 'Pin or map memory so the RNIC can translate virtual addresses and enforce access with lkey/rkey values.',
  },
  {
    name: 'Connect',
    detail: 'Exchange queue pair numbers, packet sequence numbers, MTU, addressing data, and remote memory metadata.',
  },
  {
    name: 'Post',
    detail: 'Put receive buffers or send/read/write requests onto queues that the RNIC can consume asynchronously.',
  },
  {
    name: 'Poll',
    detail: 'Read completion queues, interpret status codes, recycle buffers, and decide whether the operation is safe to reuse.',
  },
  {
    name: 'Teardown',
    detail: 'Drain outstanding work, destroy QPs/CQs, deregister memory, and close the device context in dependency order.',
  },
] as const

export function WorkRequestFigure() {
  const [selected, setSelected] = useState<Operation>('RDMA Write')
  const operation = operations[selected]

  return (
    <figure className="interactive-figure operation-figure">
      <figcaption>
        <strong>Work request semantics</strong>
        <span>Choose an operation and compare what the remote side must prepare.</span>
      </figcaption>
      <div className="segmented-control" role="group" aria-label="Choose RDMA operation">
        {(Object.keys(operations) as Operation[]).map((name) => (
          <button
            key={name}
            type="button"
            className={selected === name ? 'is-selected' : ''}
            onClick={() => setSelected(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="operation-path" aria-label={`${selected} conceptual path`}>
        {operation.path.map((node) => (
          <span key={node}>{node}</span>
        ))}
      </div>
      <dl className="operation-facts">
        <div>
          <dt>Initiator</dt>
          <dd>{operation.initiator}</dd>
        </div>
        <div>
          <dt>Remote CPU</dt>
          <dd>{operation.remoteCpu}</dd>
        </div>
        <div>
          <dt>Remote receive</dt>
          <dd>{operation.remoteReceive}</dd>
        </div>
        <div>
          <dt>Remote key</dt>
          <dd>{operation.needsRemoteKey}</dd>
        </div>
        <div>
          <dt>Completion</dt>
          <dd>{operation.completion}</dd>
        </div>
      </dl>
    </figure>
  )
}

export function ObjectLifecycleFigure() {
  const [step, setStep] = useState(0)
  const current = lifecycleSteps[step]

  return (
    <figure className="interactive-figure lifecycle-figure">
      <figcaption>
        <strong>Object lifetime checklist</strong>
        <span>Most RDMA bugs come from doing these steps out of order or reusing objects too early.</span>
      </figcaption>
      <div className="lifecycle-grid">
        {lifecycleSteps.map((item, index) => (
          <button
            type="button"
            key={item.name}
            className={index === step ? 'lifecycle-step is-selected' : 'lifecycle-step'}
            onClick={() => setStep(index)}
          >
            <span>{index + 1}</span>
            {item.name}
          </button>
        ))}
      </div>
      <div className="figure-panel">
        <p className="panel-kicker">Selected lifetime phase</p>
        <h3>{current.name}</h3>
        <p>{current.detail}</p>
      </div>
    </figure>
  )
}
