import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import ss from './ImageUploader.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faLink } from '@fortawesome/free-solid-svg-icons'

const ImageUploader = ({ onImageSelect, onThumbnailChange, initialImage }) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [imageLink, setImageLink] = useState('')
  const fileInputRef = useRef(null)

  // 초기 이미지 데이터 처리
  useEffect(() => {
    if (initialImage) {
      if (typeof initialImage === 'string') {
        // URL 또는 data URL인 경우
        handleImageLoad(initialImage);
      } else if (initialImage.src) {
        // 썸네일 객체인 경우
        handleImageLoad(initialImage.src);
        onThumbnailChange(initialImage);
      }
    }
  }, [initialImage, onThumbnailChange, onImageSelect]);

  const handleImageLoad = (imageData, fileName = 'uploaded_image') => {
    console.log('이미지 로드 시작:', fileName);
    
    if (!imageData) {
      console.error('이미지 데이터가 없습니다.');
      return;
    }
    
    setSelectedImage(imageData);
    onImageSelect(imageData);
    
    const img = new Image();
    img.onload = () => {
      console.log('이미지 로드 완료:', {
        width: img.width,
        height: img.height,
        fileName: fileName
      });
      
      const thumbnailData = {
        src: imageData,
        width: img.width,
        height: img.height,
        fileName: fileName
      };
      
      console.log('썸네일 데이터 생성:', thumbnailData);
      onThumbnailChange(thumbnailData);
    };
    
    img.onerror = (error) => {
      console.error('이미지 로드 실패:', error);
      // 이미지 로드 실패 시 상태 초기화
      setSelectedImage(null);
      onImageSelect('');
      onThumbnailChange(null);
    };
    
    img.src = imageData;
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = () => handleImageLoad(reader.result, file.name)
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.tif', '.tiff'] },
    multiple: false
  })

  useEffect(() => {
    const handlePasteEvent = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          const reader = new FileReader()
          reader.onload = () => handleImageLoad(reader.result)
          reader.readAsDataURL(blob)
          break
        }
      }
    }
    document.addEventListener('paste', handlePasteEvent)
    return () => document.removeEventListener('paste', handlePasteEvent)
  }, [])

  const handleImageLink = async (e) => {
    e.preventDefault()
    if (!imageLink.trim()) return
    try {
      const response = await fetch(imageLink)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onload = () => handleImageLoad(reader.result, 'image_from_link')
      reader.readAsDataURL(blob)
    } catch (err) {
      alert('이미지 URL을 불러오는데 실패했습니다.')
    }
  }

  const handleRemoveImage = (e) => {
    // 이벤트 전파 중지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 상태 초기화
    setSelectedImage(null)
    setImageLink('')
    
    // 콘솔에 로그 추가
    console.log('이미지 삭제 시작: 이미지와 썸네일 정보 초기화')
    
    // 부모 컴포넌트에 이미지 삭제 알림
    // 빈 문자열을 전달하여 이미지가 삭제되었음을 알림
    onImageSelect('')
    
    // 썸네일 정보도 null로 설정
    onThumbnailChange(null)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // 상태 변경 확인을 위한 타임아웃 설정
    setTimeout(() => {
      console.log('이미지 삭제 완료 확인 - selectedImage:', selectedImage ? '있음' : '없음')
    }, 100)
  }

  return (
    <div className={ss.uploadSection}>
      <div className={ss.uploadHeader}>
        <span className={ss.uploadTitle}>Image</span>
      </div>
      {!selectedImage ? (
        <>
          <div {...getRootProps()} className={ss.dropzone}>
            <input {...getInputProps()} />
            {isDragActive ? <p>Drop the image here...</p> : (
              <>
                <p>Drag & drop or click to upload</p>
                <p className={ss.supportedFormats}>
                  Supported formats: JPEG, PNG, GIF, TIFF
                </p>
              </>
            )}
          </div>
          <form onSubmit={handleImageLink} className={ss.linkInputForm}>
            <input
              type="text"
              value={imageLink}
              onChange={(e) => setImageLink(e.target.value)}
              placeholder="Paste image URL here"
              className={ss.linkInput}
            />
            <button type="submit" className={ss.submitButton}>
              Add
            </button>
          </form>
        </>
      ) : (
        <div className={ss.previewContainer}>
          <img src={selectedImage} alt="Preview" className={ss.imagePreview} />
          <button
            className={ss.removeImageButton}
            onClick={handleRemoveImage}
            type="button"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageUploader 