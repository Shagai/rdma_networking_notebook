import { useMemo, useState } from 'react'

type Protocol = 'InfiniBand' | 'RoCEv2' | 'Soft-RoCE'

const protocols: Record<
  Protocol,
  {
    fabric: string
    address: string
    learningUse: string
    path: string[]
  }
> = {
  InfiniBand: {
    fabric: 'Native RDMA fabric with a subnet manager, LIDs, service levels, and InfiniBand link semantics.',
    address: 'LID for local fabric routing, plus GID information when global addressing is needed.',
    learningUse: 'Best when studying classic RDMA behavior and fabric-managed paths.',
    path: ['App', 'libibverbs', 'RNIC', 'IB fabric', 'Remote RNIC', 'Memory'],
  },
  RoCEv2: {
    fabric: 'RDMA packets are carried over Ethernet with UDP/IP encapsulation and lossless or congestion-managed behavior.',
    address: 'GID maps into IP addressing, so GID index and network configuration matter.',
    learningUse: 'Best when connecting RDMA ideas to data-center Ethernet operations.',
    path: ['App', 'libibverbs', 'RNIC', 'Ethernet/IP', 'Remote RNIC', 'Memory'],
  },
  'Soft-RoCE': {
    fabric: 'The Linux RXE driver emulates RDMA behavior in software over a normal Ethernet interface.',
    address: 'Uses the host network stack, so it is useful for API learning but not hardware performance claims.',
    learningUse: 'Best for reproducible local labs and CI-style functional experiments.',
    path: ['App', 'libibverbs', 'RXE', 'Kernel UDP/IP', 'Remote RXE', 'Memory'],
  },
}

const qpStates = [
  {
    name: 'RESET',
    detail: 'The queue pair exists, but it is not ready to exchange packets.',
    work: 'Create protection domain, completion queues, and QP shell.',
  },
  {
    name: 'INIT',
    detail: 'The QP is bound to a port and access flags, but no remote endpoint is attached yet.',
    work: 'Attach port, pkey, and allowed operations.',
  },
  {
    name: 'RTR',
    detail: 'Ready to receive. The local QP knows enough remote address and path information to accept packets.',
    work: 'Set destination QPN, path MTU, remote LID/GID, and receive parameters.',
  },
  {
    name: 'RTS',
    detail: 'Ready to send. Retry, timeout, and packet sequence parameters are now active.',
    work: 'Set PSN, retry count, timeout, and send-side behavior.',
  },
] as const

export function ProtocolPathFigure() {
  const [selected, setSelected] = useState<Protocol>('RoCEv2')
  const protocol = protocols[selected]

  return (
    <figure className="interactive-figure protocol-figure">
      <figcaption>
        <strong>Transport lens</strong>
        <span>Switch the substrate and notice which parts of the programming model stay stable.</span>
      </figcaption>
      <div className="segmented-control" role="group" aria-label="Choose RDMA transport">
        {(Object.keys(protocols) as Protocol[]).map((name) => (
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
      <div className="path-diagram" aria-label={`${selected} packet path`}>
        {protocol.path.map((node, index) => (
          <div className="path-node" key={node}>
            <span>{node}</span>
            {index < protocol.path.length - 1 ? <i aria-hidden="true" /> : null}
          </div>
        ))}
      </div>
      <div className="figure-notes three-column">
        <p>
          <strong>Fabric.</strong> {protocol.fabric}
        </p>
        <p>
          <strong>Addressing.</strong> {protocol.address}
        </p>
        <p>
          <strong>Learning use.</strong> {protocol.learningUse}
        </p>
      </div>
    </figure>
  )
}

export function QueuePairFigure() {
  const [step, setStep] = useState(0)
  const current = qpStates[step]

  return (
    <figure className="interactive-figure qp-figure">
      <figcaption>
        <strong>Queue pair bring-up</strong>
        <span>Reliable-connected QPs become useful through explicit state transitions.</span>
      </figcaption>
      <div className="qp-rail" aria-label="Queue pair state machine">
        {qpStates.map((state, index) => (
          <button
            key={state.name}
            type="button"
            className={index === step ? 'qp-state is-selected' : 'qp-state'}
            onClick={() => setStep(index)}
          >
            <span>{state.name}</span>
          </button>
        ))}
      </div>
      <div className="figure-panel">
        <p className="panel-kicker">Current state</p>
        <h3>{current.name}</h3>
        <p>{current.detail}</p>
        <p>
          <strong>Typical work:</strong> {current.work}
        </p>
      </div>
    </figure>
  )
}

export function LatencyBudgetFigure() {
  const [messageSize, setMessageSize] = useState(4096)
  const [copies, setCopies] = useState(2)
  const [kernelCrossings, setKernelCrossings] = useState(2)

  const estimate = useMemo(() => {
    const sizePenalty = Math.log2(messageSize / 1024 + 1) * 0.55
    const copyPenalty = copies * 1.3
    const kernelPenalty = kernelCrossings * 0.75
    return Math.max(0.9, 1.1 + sizePenalty + copyPenalty + kernelPenalty)
  }, [copies, kernelCrossings, messageSize])

  const rdmaEstimate = useMemo(() => {
    const sizePenalty = Math.log2(messageSize / 1024 + 1) * 0.18
    return Math.max(0.75, 0.95 + sizePenalty)
  }, [messageSize])

  const conventionalWidth = Math.min(100, estimate * 8)
  const rdmaWidth = Math.min(100, rdmaEstimate * 8)

  return (
    <figure className="interactive-figure latency-figure">
      <figcaption>
        <strong>Latency budget intuition</strong>
        <span>This is a teaching model, not a benchmark. Use it to reason about where overhead enters.</span>
      </figcaption>
      <div className="control-grid">
        <label>
          <span>Message size</span>
          <input
            type="range"
            min="1024"
            max="65536"
            step="1024"
            value={messageSize}
            onChange={(event) => setMessageSize(Number(event.target.value))}
          />
          <output>{messageSize / 1024} KiB</output>
        </label>
        <label>
          <span>CPU copies</span>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={copies}
            onChange={(event) => setCopies(Number(event.target.value))}
          />
          <output>{copies}</output>
        </label>
        <label>
          <span>Kernel crossings</span>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={kernelCrossings}
            onChange={(event) => setKernelCrossings(Number(event.target.value))}
          />
          <output>{kernelCrossings}</output>
        </label>
      </div>
      <div className="bar-compare" aria-label="Estimated latency comparison">
        <div>
          <span>Conventional path</span>
          <div className="bar-track">
            <i style={{ width: `${conventionalWidth}%` }} />
          </div>
          <strong>{estimate.toFixed(1)} us</strong>
        </div>
        <div>
          <span>RDMA-style data path</span>
          <div className="bar-track">
            <i className="rdma-bar" style={{ width: `${rdmaWidth}%` }} />
          </div>
          <strong>{rdmaEstimate.toFixed(1)} us</strong>
        </div>
      </div>
    </figure>
  )
}

export function HomeTopologyFigure() {
  return (
    <figure className="topology-figure" aria-label="RDMA learning topology">
      <div className="host host-left">
        <strong>Host A</strong>
        <span>App</span>
        <span>Registered memory</span>
        <span>RNIC</span>
      </div>
      <div className="fabric-lane">
        <span>QP</span>
        <i />
        <strong>Fabric</strong>
        <i />
        <span>CQ</span>
      </div>
      <div className="host host-right">
        <strong>Host B</strong>
        <span>RNIC</span>
        <span>Registered memory</span>
        <span>Service</span>
      </div>
      <figcaption>
        The notebook treats RDMA as a system: API objects, NIC behavior, fabric configuration, and workload evidence.
      </figcaption>
    </figure>
  )
}
