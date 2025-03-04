import React, { useState } from 'react'
import ss from './TagEditor.module.css'

const TagEditor = ({ tags, onTagsChange }) => {
  const [currentTag, setCurrentTag] = useState('')
  const [editingTagIndex, setEditingTagIndex] = useState(null)

  const handleTagSubmit = (e) => {
    e.preventDefault()
    if (currentTag.trim()) {
      onTagsChange([...tags, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagEdit = (index, newValue) => {
    const processedValue = newValue.replace(/\s+/g, '_')

    if (!/^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_-]*$/.test(processedValue)) {
      const tagElement = document.querySelector(`.${ss.tag}.${ss.editing}`)
      if (tagElement) {
        tagElement.classList.add(ss.invalid)
        setTimeout(() => tagElement.classList.remove(ss.invalid), 1000)
      }
      return
    }

    if (/_-|-_|__|--/.test(processedValue)) {
      const tagElement = document.querySelector(`.${ss.tag}.${ss.editing}`)
      if (tagElement) {
        tagElement.classList.add(ss.invalid)
        setTimeout(() => tagElement.classList.remove(ss.invalid), 1000)
      }
      return
    }

    if (processedValue.length > 20) {
      const tagElement = document.querySelector(`.${ss.tag}.${ss.editing}`)
      if (tagElement) {
        tagElement.classList.add(ss.invalid)
        setTimeout(() => tagElement.classList.remove(ss.invalid), 1000)
      }
      return
    }

    const newTags = [...tags]
    
    if (processedValue.includes(',')) {
      const additionalTags = processedValue
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => {
          return tag !== '' && 
                 tag.length <= 20 && 
                 /^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_-]*$/.test(tag) &&
                 !/_-|-_|__|--/.test(tag)
        })
      
      if (additionalTags.length > 0) {
        newTags.splice(index, 1, ...additionalTags)
        onTagsChange(newTags)
        setEditingTagIndex(null)
      }
    } else {
      newTags[index] = processedValue
      onTagsChange(newTags)
    }
  }

  const handleTagKeyDown = (e, index) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      const currentTag = tags[index]
      
      if (!currentTag || currentTag.trim() === '') {
        const tagElement = e.target.closest(`.${ss.tag}`)
        if (tagElement) {
          tagElement.classList.add(ss.invalid)
          setTimeout(() => tagElement.classList.remove(ss.invalid), 1000)
        }
        return
      }

      const isDuplicate = tags.some((tag, i) => i !== index && tag === currentTag.trim())
      if (isDuplicate) {
        const tagElement = e.target.closest(`.${ss.tag}`)
        if (tagElement) {
          tagElement.classList.add(ss.invalid)
          setTimeout(() => tagElement.classList.remove(ss.invalid), 1000)
        }
        return
      }

      handleTagBlur()
      handleAddNewTag()
    } else if (e.key === 'Escape') {
      setEditingTagIndex(null)
    }
  }

  const handleTagBlur = () => {
    if (editingTagIndex !== null) {
      const currentTag = tags[editingTagIndex].trim()
      
      const isDuplicate = tags.some((tag, index) => index !== editingTagIndex && tag === currentTag)
      const newTags = tags.filter((tag, index) => {
        if (index === editingTagIndex) {
          return currentTag !== '' && !isDuplicate
        }
        return true
      })
      
      onTagsChange(newTags)
      setEditingTagIndex(null)
    }
  }

  const handleAddNewTag = () => {
    const newTag = ''
    onTagsChange([...tags, newTag])
    setEditingTagIndex(tags.length)
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  return (
    <div className={ss.tagSection}>
      <div className={ss.tagHeader}>
        <span className={ss.tagTitle}>Tags</span>
        {tags.length > 0 && (
          <button 
            className={ss.clearTagsButton}
            onClick={clearAllTags}
          >
            Clear all
          </button>
        )}
      </div>
      <div className={ss.tagList}>
        {tags.map((tag, index) => (
          <span 
            key={index} 
            className={`${ss.tag} ${editingTagIndex === index ? ss.editing : ''}`}
            onClick={() => setEditingTagIndex(index)}
          >
            <span className={ss.tagHash}>#</span>
            {editingTagIndex === index ? (
              <input
                type="text"
                className={ss.tagEditInput}
                value={tag}
                onChange={(e) => handleTagEdit(index, e.target.value)}
                onBlur={handleTagBlur}
                onKeyDown={(e) => handleTagKeyDown(e, index)}
                autoFocus
              />
            ) : (
              <span className={ss.tagText}>{tag}</span>
            )}
            <button 
              className={ss.removeTag}
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
            >
              ×
            </button>
          </span>
        ))}
        <button 
          className={ss.addTagButton}
          onClick={handleAddNewTag}
        >
          + New Tag
        </button>
      </div>
    </div>
  )
}

export default TagEditor 