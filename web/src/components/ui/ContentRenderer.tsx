'use client'

interface ContentBlock {
  type: string
  content: any
  id?: string
  has_children?: boolean
}

interface ContentRendererProps {
  blocks: ContentBlock[]
}

export function ContentRenderer({ blocks }: ContentRendererProps) {
  if (!blocks || blocks.length === 0) {
    return <div className="text-gray-400">No content available.</div>
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <ContentBlock key={block.id || index} block={block} />
      ))}
    </div>
  )
}

function ContentBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-gray-300 mb-4 leading-relaxed">
          {renderRichText(block.content)}
        </p>
      )

    case 'heading_1':
      return (
        <h1 className="text-4xl font-bold text-white mb-6 mt-8">
          {renderRichText(block.content)}
        </h1>
      )

    case 'heading_2':
      return (
        <h2 className="text-3xl font-semibold text-white mb-4 mt-6">
          {renderRichText(block.content)}
        </h2>
      )

    case 'heading_3':
      return (
        <h3 className="text-2xl font-semibold text-white mb-3 mt-4">
          {renderRichText(block.content)}
        </h3>
      )

    case 'bulleted_list':
      return (
        <li className="text-gray-300 mb-2 ml-4">
          <span className="text-orange-400 mr-2">•</span>
          {renderRichText(block.content)}
        </li>
      )

    case 'numbered_list':
      return (
        <li className="text-gray-300 mb-2 ml-4">
          <span className="text-orange-400 mr-2">
            {block.content.number || '•'}
          </span>
          {renderRichText(block.content)}
        </li>
      )

    case 'to_do':
      return (
        <div className="flex items-start mb-3 p-3 bg-slate-800/30 rounded-lg">
          <input
            type="checkbox"
            checked={block.content.checked || false}
            readOnly
            className="mt-1 mr-3 accent-orange-500"
          />
          <span className={`flex-1 ${block.content.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
            {renderRichText(block.content)}
          </span>
        </div>
      )

    case 'toggle':
      return (
        <details className="mb-4 bg-slate-800/30 rounded-lg">
          <summary className="cursor-pointer p-3 text-white font-medium hover:bg-slate-800/50 transition">
            {renderRichText(block.content)}
          </summary>
          <div className="p-3 pt-0 text-gray-300">
            {block.content.children && renderChildren(block.content.children)}
          </div>
        </details>
      )

    case 'callout':
      return (
        <div className="bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            {block.content.icon && (
              <span className="text-2xl mr-3">{block.content.icon}</span>
            )}
            <div className="flex-1">
              <div className="text-gray-200">
                {renderRichText(block.content)}
              </div>
            </div>
          </div>
        </div>
      )

    case 'quote':
      return (
        <blockquote className="border-l-4 border-orange-500 pl-6 my-6 italic">
          <p className="text-gray-300 text-lg">
            {renderRichText(block.content)}
          </p>
        </blockquote>
      )

    case 'divider':
      return <hr className="border-white/10 my-8" />

    case 'code':
      return (
        <div className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto border border-white/10">
          <pre className="text-gray-300 font-mono text-sm">
            <code>{block.content.text || block.content.plain_text || block.content.code}</code>
          </pre>
        </div>
      )

    case 'child_page':
      return (
        <div className="mb-4">
          <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 hover:border-orange-500/50 transition">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📄</span>
              <div>
                <div className="text-white font-medium">
                  {block.content.title || 'Child Page'}
                </div>
                <div className="text-gray-400 text-sm">
                  {block.content.id || block.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      // Fallback for unknown block types
      if (process.env.NODE_ENV === 'development') {
        console.log('Unknown block type:', block.type, block.content)
      }
      return null
  }
}

function renderRichText(content: any): React.ReactNode {
  if (!content) return null

  // Handle different content structures
  if (content.text || content.plain_text) {
    return content.text || content.plain_text
  }

  if (content.rich_text && Array.isArray(content.rich_text)) {
    return content.rich_text.map((text: any, index: number) => (
      <span key={index} className={getTextStyle(text.annotations)}>
        {text.plain_text}
      </span>
    ))
  }

  if (Array.isArray(content)) {
    return content.map((item, index) => (
      <span key={index}>{renderRichText(item)}</span>
    ))
  }

  if (typeof content === 'string') {
    return content
  }

  return JSON.stringify(content)
}

function getTextStyle(annotations?: any): string {
  if (!annotations) return ''

  const styles = []
  if (annotations.bold) styles.push('font-bold')
  if (annotations.italic) styles.push('italic')
  if (annotations.underline) styles.push('underline')
  if (annotations.strikethrough) styles.push('line-through')
  if (annotations.code) styles.push('font-mono bg-slate-800 px-1 rounded')

  return styles.join(' ')
}

function renderChildren(children: any[]): React.ReactNode {
  if (!children || !Array.isArray(children)) return null

  return (
    <div className="space-y-2">
      {children.map((child, index) => (
        <ContentBlock key={index} block={child} />
      ))}
    </div>
  )
}
