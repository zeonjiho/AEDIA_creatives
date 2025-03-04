import React from 'react'
import ss from './ImagePreview.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'

const ImagePreview = ({ thumbnailImage, metadata }) => {
  // 썸네일 이미지가 직접 제공된 경우
  if (thumbnailImage) {
    return (
      <div className={ss.previewContainer}>
        <img
          src={thumbnailImage.src}
          alt="Thumbnail"
          className={ss.previewImage}
          style={{
            aspectRatio: `${thumbnailImage.width} / ${thumbnailImage.height}`
          }}
        />
      </div>
    )
  }

  // 메타데이터에서 소셜 미디어 콘텐츠 썸네일이 있는 경우
  if (metadata?.mediaContent?.thumbnailUrl) {
    return (
      <div className={ss.previewContainer}>
        <div className={ss.socialMediaBadge}>
          {metadata.mediaContent.type === 'instagram' && 'Instagram'}
          {metadata.mediaContent.type === 'facebook' && 'Facebook'}
          {metadata.mediaContent.type === 'twitter' && 'Twitter'}
          {metadata.mediaContent.type === 'tiktok' && 'TikTok'}
          {!['instagram', 'facebook', 'twitter', 'tiktok'].includes(metadata.mediaContent.type) && 'Social Media'}
        </div>
        <img
          src={metadata.mediaContent.thumbnailUrl}
          alt="Social Media Thumbnail"
          className={ss.previewImage}
        />
      </div>
    )
  }

  // 일반 메타데이터 이미지가 있는 경우
  if (metadata?.image) {
    return (
      <div className={ss.previewContainer}>
        <img
          src={metadata.image}
          alt="Link Preview"
          className={ss.previewImage}
        />
      </div>
    )
  }

  // 이미지가 없는 경우
  return null
}

export default ImagePreview 