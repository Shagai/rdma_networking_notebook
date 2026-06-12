import { useState } from 'react'

type Operation = 'Send/Receive' | 'RDMA Write' | 'RDMA Read' | 'Atomic'
type VerbsPhase = 'Discover' | 'Create objects' | 'Register memory' | 'Connect QP' | 'Move bytes' | 'Complete'

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

const verbsPhases: Record<
  VerbsPhase,
  {
    purpose: string
    calls: string[]
    projectHook: string
    trap: string
  }
> = {
  Discover: {
    purpose: 'Find the verbs device, open it, and read port addressing information before any queue can move traffic.',
    calls: ['ibv_get_device_list', 'ibv_get_device_name', 'ibv_open_device', 'ibv_query_port', 'ibv_query_gid'],
    projectHook: 'choose_device() and query_port_and_gid() fill ctx->verbs, ctx->port_attr, LID, and optional GID.',
    trap: 'A port can exist but still be unusable if it is not IBV_PORT_ACTIVE or the wrong GID index is selected for RoCE.',
  },
  'Create objects': {
    purpose: 'Build the ownership boundary and the queues that the application will post work into.',
    calls: ['ibv_alloc_pd', 'ibv_create_cq', 'ibv_create_qp', 'ibv_modify_qp RESET->INIT'],
    projectHook: 'create_qp() creates one RC queue pair and separate send/receive completion queues.',
    trap: 'A QP cannot use memory from a different protection domain, even if the pointer and lkey look valid in software.',
  },
  'Register memory': {
    purpose: 'Turn ordinary heap buffers into memory regions the RNIC may DMA to or from.',
    calls: ['calloc', 'ibv_reg_mr'],
    projectHook: 'register_buffers() registers send_buf and recv_buf with IBV_ACCESS_LOCAL_WRITE.',
    trap: 'Even SEND/RECV needs local registration; the SGE lkey is checked when work is posted and executed.',
  },
  'Connect QP': {
    purpose: 'Bind each RC queue pair to the remote QP number, packet sequence numbers, MTU, and path.',
    calls: ['ibv_modify_qp INIT->RTR', 'ibv_modify_qp RTR->RTS'],
    projectHook: 'pp_connect_qp() consumes endpoint metadata exchanged over the narrow TCP control channel.',
    trap: 'A bad PSN, LID, GID, MTU, or path attribute often appears later as a timeout or failed completion.',
  },
  'Move bytes': {
    purpose: 'Post receive buffers first, then post send work requests that the RNIC consumes asynchronously.',
    calls: ['ibv_post_recv', 'ibv_post_send'],
    projectHook: 'pp_post_recv() supplies the destination SGE; pp_post_send() posts IBV_WR_SEND with IBV_SEND_SIGNALED.',
    trap: 'A SEND requires a posted receive on the peer. Without one, reliable connected transport can hit receiver-not-ready behavior.',
  },
  Complete: {
    purpose: 'Poll completion queues, validate status, recover buffer ownership, and tear resources down in dependency order.',
    calls: ['ibv_poll_cq', 'ibv_wc_status_str', 'ibv_destroy_qp', 'ibv_dereg_mr', 'ibv_destroy_cq', 'ibv_dealloc_pd'],
    projectHook: 'pp_wait_completion() checks wr_id and status; pp_context_destroy() unwinds the verbs object graph.',
    trap: 'A posted buffer is not yours again until the relevant completion or failure path says so.',
  },
}

const verbsObjects = [
  {
    name: 'ibv_context',
    project: 'ctx->verbs',
    created: 'ibv_open_device',
    role: 'Open handle to the RDMA device and provider.',
  },
  {
    name: 'ibv_pd',
    project: 'ctx->pd',
    created: 'ibv_alloc_pd',
    role: 'Protection boundary tying memory regions and QPs together.',
  },
  {
    name: 'ibv_cq',
    project: 'ctx->send_cq, ctx->recv_cq',
    created: 'ibv_create_cq',
    role: 'Queues where the provider reports completed work requests.',
  },
  {
    name: 'ibv_qp',
    project: 'ctx->qp',
    created: 'ibv_create_qp',
    role: 'Reliable-connected send and receive queues used by ping-pong.',
  },
  {
    name: 'ibv_mr',
    project: 'ctx->send_mr, ctx->recv_mr',
    created: 'ibv_reg_mr',
    role: 'Registered buffers plus lkey values for local DMA authorization.',
  },
  {
    name: 'ibv_wc',
    project: 'local variable in pp_wait_completion',
    created: 'ibv_poll_cq output',
    role: 'Completion status, wr_id, and byte count returned to software.',
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

export function LibibverbsLifecycleFigure() {
  const [selected, setSelected] = useState<VerbsPhase>('Register memory')
  const phase = verbsPhases[selected]

  return (
    <figure className="interactive-figure verbs-figure">
      <figcaption>
        <strong>libibverbs call path in this project</strong>
        <span>Choose a phase to see which verbs calls the ping-pong starter uses and what each phase proves.</span>
      </figcaption>
      <div className="verbs-phase-grid" role="group" aria-label="Choose libibverbs phase">
        {(Object.keys(verbsPhases) as VerbsPhase[]).map((name) => (
          <button
            key={name}
            type="button"
            className={selected === name ? 'verbs-phase-button is-selected' : 'verbs-phase-button'}
            onClick={() => setSelected(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="figure-panel verbs-phase-panel">
        <p className="panel-kicker">{selected}</p>
        <h3>{phase.purpose}</h3>
        <ul className="verbs-call-list">
          {phase.calls.map((call) => (
            <li key={call}>
              <code>{call}</code>
            </li>
          ))}
        </ul>
        <dl className="operation-facts verbs-phase-facts">
          <div>
            <dt>Where it appears</dt>
            <dd>{phase.projectHook}</dd>
          </div>
          <div>
            <dt>Common trap</dt>
            <dd>{phase.trap}</dd>
          </div>
        </dl>
      </div>
    </figure>
  )
}

export function LibibverbsObjectMapFigure() {
  return (
    <figure className="interactive-figure verbs-object-figure">
      <figcaption>
        <strong>Objects in the ping-pong context</strong>
        <span>The starter keeps the verbs object graph visible inside struct pp_context.</span>
      </figcaption>
      <div className="verbs-object-grid">
        {verbsObjects.map((object) => (
          <article className="verbs-object-card" key={object.name}>
            <span>{object.created}</span>
            <h3>{object.name}</h3>
            <code>{object.project}</code>
            <p>{object.role}</p>
          </article>
        ))}
      </div>
    </figure>
  )
}
