import type { ReactNode } from 'react'

type CalloutProps = {
  title: string
  children: ReactNode
}

type SidenoteProps = {
  children: ReactNode
}

export function Callout({ title, children }: CalloutProps) {
  return (
    <aside className="callout">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  )
}

export function Sidenote({ children }: SidenoteProps) {
  return <span className="sidenote">{children}</span>
}

export function Term({ children }: SidenoteProps) {
  return <span className="term">{children}</span>
}
