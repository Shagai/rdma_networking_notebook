import type { ReactNode } from 'react'

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

function isTableSeparator(line: string) {
  return /^\|?[\s:-]*---[\s|:-]*\|?$/.test(line.trim())
}

function isBlockStart(line: string) {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^```/.test(line) ||
    /^(\s*)([-*])\s+/.test(line) ||
    /^(\s*)\d+\.\s+/.test(line) ||
    line.trim().startsWith('|')
  )
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (line.trim() === '') {
      index += 1
      continue
    }

    const fence = line.match(/^```(.*)$/)
    if (fence) {
      const language = fence[1].trim()
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }
      if (index < lines.length) {
        index += 1
      }
      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() })
      index += 1
      continue
    }

    if (line.trim().startsWith('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line)
      const rows: string[][] = []
      index += 2
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(splitTableRow(lines[index]))
        index += 1
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    const bullet = line.match(/^(\s*)([-*])\s+(.+)$/)
    const numbered = line.match(/^(\s*)\d+\.\s+(.+)$/)
    if (bullet || numbered) {
      const ordered = Boolean(numbered)
      const items: string[] = []
      while (index < lines.length) {
        const item = ordered ? lines[index].match(/^(\s*)\d+\.\s+(.+)$/) : lines[index].match(/^(\s*)([-*])\s+(.+)$/)
        if (!item) {
          break
        }
        let itemText = (ordered ? item[2] : item[3]).trim()
        index += 1

        while (index < lines.length && lines[index].trim() !== '') {
          const nextItem = ordered
            ? lines[index].match(/^(\s*)\d+\.\s+(.+)$/)
            : lines[index].match(/^(\s*)([-*])\s+(.+)$/)
          if (nextItem) {
            break
          }
          if (isBlockStart(lines[index]) && !/^\s+/.test(lines[index])) {
            break
          }
          itemText = `${itemText} ${lines[index].trim()}`
          index += 1
        }

        items.push(itemText)
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    const paragraphLines = [line.trim()]
    index += 1
    while (index < lines.length && lines[index].trim() !== '' && !isBlockStart(lines[index])) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

function getHeadingTag(level: number): 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  if (level <= 1) {
    return 'h2'
  }
  if (level === 2) {
    return 'h3'
  }
  if (level === 3) {
    return 'h4'
  }
  if (level === 4) {
    return 'h5'
  }
  return 'h6'
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index}>{part.slice(1, -1)}</code>
    }

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      return (
        <a key={index} href={link[2]}>
          {link[1]}
        </a>
      )
    }

    return part
  })
}

type MarkdownDocumentProps = {
  markdown: unknown
}

export default function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  const blocks = parseMarkdown(typeof markdown === 'string' ? markdown : '')

  return (
    <div className="markdown-doc">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const HeadingTag = getHeadingTag(block.level)
          return <HeadingTag key={index}>{renderInline(block.text)}</HeadingTag>
        }

        if (block.type === 'paragraph') {
          return <p key={index}>{renderInline(block.text)}</p>
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ListTag>
          )
        }

        if (block.type === 'code') {
          return (
            <pre key={index}>
              <code>{block.code}</code>
            </pre>
          )
        }

        return (
          <div className="markdown-table-wrap" key={index}>
            <table>
              <thead>
                <tr>
                  {block.headers.map((header) => (
                    <th key={header}>{renderInline(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
