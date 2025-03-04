import React, { useRef, useState } from 'react'
import ss from './LinkInput.module.css'
import ImageUploader from '../../../Images/ImageUploader/ImageUploader'
import ImagePreview from '../ImagePreview/ImagePreview'

// Add these definitions before they're used
const platformCategories = {
  SOCIAL: 'social',
  VIDEO: 'video',
  ARTICLE: 'article',
  OTHER: 'other'
};

const contentTypes = {
  POST: 'post',
  VIDEO: 'video',
  ARTICLE: 'article',
  LINK: 'link'
};

const LinkInput = ({ pastedContent, onContentChange, thumbnailImage, onThumbnailChange, metadata }) => {
  const thumbnailInputRef = useRef(null)
  const [showImageUploader, setShowImageUploader] = useState(false)

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text')
    const formattedUrl = text.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      onContentChange('https://' + formattedUrl)
    } else {
      onContentChange(formattedUrl)
    }
  }

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          onThumbnailChange({
            src: reader.result,
            width: img.width,
            height: img.height
          })
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveThumbnail = () => {
    onThumbnailChange(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ''
    }
  }

  const handleOpenImageUploader = () => {
    setShowImageUploader(true)
  }

  const handleImageSelect = (imageData) => {
    const img = new Image()
    img.onload = () => {
      onThumbnailChange({
        src: imageData,
        width: img.width,
        height: img.height
      })
    }
    img.src = imageData
    setShowImageUploader(false)
  }

  return (
    <div className={ss.linkSection}>
      <div className={ss.linkHeader}>
        <span className={ss.linkTitle}>Link</span>
        {!thumbnailImage && (
          <button 
            className={ss.addThumbnailButton}
            onClick={handleOpenImageUploader}
          >
            Add Thumbnail
          </button>
        )}
      </div>
      <input
        type="file"
        ref={thumbnailInputRef}
        onChange={handleThumbnailUpload}
        accept="image/*"
        className={ss.hiddenInput}
      />
      {thumbnailImage ? (
        <div className={ss.thumbnailContainer}>
          <img 
            src={thumbnailImage.src} 
            alt="Thumbnail" 
            className={ss.thumbnailPreview} 
          />
          <button 
            className={ss.removeImageButton}
            onClick={handleRemoveThumbnail}
          >
            ×
          </button>
        </div>
      ) : metadata && (
        <div className={ss.previewWrapper}>
          <ImagePreview
            thumbnailImage={null}
            metadata={metadata}
          />
        </div>
      )}
      <input
        type="text"
        value={pastedContent}
        onChange={(e) => onContentChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste your link here"
        className={ss.contentInput}
      />
      
      {showImageUploader && (
        <ImageUploader 
          onImageSelect={handleImageSelect}
          onClose={() => setShowImageUploader(false)}
        />
      )}
    </div>
  )
}

export default LinkInput 