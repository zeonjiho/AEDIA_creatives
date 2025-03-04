import React, { useState, useEffect, useRef, useCallback } from 'react'
import ss from './DescriptionEditor.module.css'
import ReactMarkdown from 'react-markdown'

const DescriptionEditor = ({ description, onChange, onDelete }) => {
  const [showDescInput, setShowDescInput] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showMarkdownTooltip, setShowMarkdownTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [textareaHeight, setTextareaHeight] = useState('auto')
  const textareaRef = useRef(null)
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false)
  const tooltipRef = useRef(null)

  const handleTextSelect = () => {
    const textarea = document.querySelector(`.${ss.descriptionInput}`)
    if (!textarea) return

    const selection = window.getSelection()
    const text = selection.toString().trim()
    
    if (text) {
      const start = textarea.selectionStart
      const textBeforeSelection = textarea.value.substring(0, start)
      const lines = textBeforeSelection.split('\n')
      const lineNumber = lines.length
      const currentLine = lines[lines.length - 1]
      
      const computedStyle = window.getComputedStyle(textarea)
      const fontSize = parseFloat(computedStyle.fontSize)
      const paddingLeft = parseFloat(computedStyle.paddingLeft)
      const lineHeight = parseInt(computedStyle.lineHeight)
      
      const scrollTop = textarea.scrollTop
      
      // 툴팁의 예상 너비 (버튼들의 총 너비)
      const tooltipWidth = 280 // 대략적인 툴팁 너비

      // x 좌표 계산 및 제한
      let x = (currentLine.length * fontSize * 0.6) + paddingLeft
      
      // textarea의 오른쪽 여백을 고려하여 최대 x 좌표 계산
      const maxX = textarea.offsetWidth - tooltipWidth - paddingLeft

      // x 좌표가 왼쪽이나 오른쪽 경계를 벗어나지 않도록 조정
      x = Math.max(paddingLeft, Math.min(x, maxX))

      const y = (lineNumber * lineHeight) - scrollTop - 55

      setTooltipPosition({ x, y })
      setSelectedText(text)
      setShowMarkdownTooltip(true)
    } else {
      setShowMarkdownTooltip(false)
    }
  }

  const applyMarkdown = (type) => {
    const textarea = document.querySelector(`.${ss.descriptionInput}`)
    if (!textarea) return

    const selectionStart = textarea.selectionStart
    const selectionEnd = textarea.selectionEnd
    const currentText = description
    const selectedText = currentText.slice(selectionStart, selectionEnd)

    let prefix = ''
    let suffix = ''

    switch(type) {
      case 'h1': prefix = '# '; break
      case 'h2': prefix = '## '; break
      case 'h3': prefix = '### '; break
      case 'bold': prefix = '**'; suffix = '**'; break
      case 'italic': prefix = '*'; suffix = '*'; break
      case 'code': prefix = '`'; suffix = '`'; break
      case 'link': prefix = '['; suffix = '](url)'; break
      default: return
    }

    const newText = 
      currentText.slice(0, selectionStart) + 
      prefix + 
      selectedText + 
      suffix + 
      currentText.slice(selectionEnd)

    onChange(newText)

    const newCursorPos = selectionStart + prefix.length + selectedText.length + suffix.length

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      setShowMarkdownTooltip(false)
    })
  }

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`
      setTextareaHeight(`${scrollHeight}px`)
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [description, adjustTextareaHeight])

  useEffect(() => {
    if (!showPreview && textareaRef.current) {
      textareaRef.current.style.height = textareaHeight
    }
  }, [showPreview, textareaHeight])

  const handleDescriptionChange = (e) => {
    const value = e.target.value
    onChange(value)
    adjustTextareaHeight()
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowMarkdownHelp(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={ss.descriptionSection}>
      <div className={ss.descriptionHeader}>
        <div className={ss.titleGroup}>
          <span className={ss.descriptionTitle}>Description</span>
          <div className={ss.markdownGuideWrapper}>
            <button
              type="button"
              className={ss.markdownGuideButton}
              onMouseEnter={() => setShowMarkdownHelp(true)}
              onMouseLeave={() => setShowMarkdownHelp(false)}
            >
              Markdown
            </button>
            {showMarkdownHelp && (
              <div className={ss.markdownGuide}>
                <div className={ss.tooltipHeader}>Markdown Guide</div>
                <div className={ss.tooltipContent}>
                  <div className={ss.tooltipRow}>
                    <code># Heading</code>
                    <span>Large Title</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>## Heading</code>
                    <span>Medium Title</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>### Heading</code>
                    <span>Small Title</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>**bold**</code>
                    <span>Bold Text</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>*italic*</code>
                    <span>Italic Text</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>[link](url)</code>
                    <span>Link</span>
                  </div>
                  <div className={ss.tooltipRow}>
                    <code>`code`</code>
                    <span>Code</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={ss.descriptionControls}>
          {!showDescInput && (
            <button 
              className={ss.addDescriptionButton}
              onClick={() => setShowDescInput(true)}
            >
              + Add
            </button>
          )}
          {showDescInput && description && (
            <>
              <button 
                className={`${ss.previewButton} ${showPreview ? ss.active : ''}`}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              <button 
                className={ss.deleteButton}
                onClick={() => {
                  onChange('')
                  setShowDescInput(false)
                  setShowPreview(false)
                  onDelete?.()
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {showDescInput && (
        <div className={ss.descriptionWrapper}>
          {!showPreview ? (
            <textarea
              ref={textareaRef}
              className={ss.descriptionInput}
              value={description}
              onChange={handleDescriptionChange}
              onMouseUp={handleTextSelect}
              onKeyUp={handleTextSelect}
              placeholder="Enter description (Markdown supported)"
              style={{ height: textareaHeight }}
            />
          ) : (
            <div 
              className={ss.previewContent}
              style={{ minHeight: textareaHeight }}
            >
              <ReactMarkdown
                children={description}
                components={{
                  p: ({children}) => <p className={ss.paragraph}>{children}</p>,
                  ul: ({children, node}) => {
                    const isDash = node.children.some(child => 
                      child.children?.[0]?.value?.startsWith('- ')
                    );
                    return (
                      <ul className={ss.list} data-dash={isDash}>
                        {children}
                      </ul>
                    );
                  },
                  ol: ({children}) => <ol className={ss.list}>{children}</ol>,
                  li: ({children, node}) => {
                    const content = node.children[0].value?.replace(/^[*-]\s/, '') || children;
                    return <li className={ss.listItem}>{content}</li>;
                  }
                }}
              />
            </div>
          )}
          {showMarkdownTooltip && selectedText && (
            <div 
              className={ss.markdownTooltip}
              style={{ 
                position: 'absolute',
                top: tooltipPosition.y,
                left: tooltipPosition.x,
                zIndex: 1000
              }}
            >
              <button onClick={() => applyMarkdown('h1')} className={ss.markdownButton}>H1</button>
              <button onClick={() => applyMarkdown('h2')} className={ss.markdownButton}>H2</button>
              <button onClick={() => applyMarkdown('h3')} className={ss.markdownButton}>H3</button>
              <button onClick={() => applyMarkdown('bold')} className={ss.markdownButton}><strong>B</strong></button>
              <button onClick={() => applyMarkdown('italic')} className={ss.markdownButton}><em>I</em></button>
              <button onClick={() => applyMarkdown('code')} className={ss.markdownButton}><code>{`<>`}</code></button>
              <button onClick={() => applyMarkdown('link')} className={ss.markdownButton}>🔗</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DescriptionEditor 