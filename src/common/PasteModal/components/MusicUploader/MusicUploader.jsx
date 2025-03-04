import React, { useState, useEffect } from 'react'
import ss from '../VideoUploader/VideoUploader.module.css'

const MusicUploader = ({ onMusicSelect, initialUrl = '' }) => {
  const [musicUrl, setMusicUrl] = useState(initialUrl)
  const [musicType, setMusicType] = useState(null)
  const [error, setError] = useState('')
  
  // 음악 서비스 URL 정규식 정의
  const spotifyRegex = /^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist|show|episode)\/[a-zA-Z0-9]+)/
  const soundcloudRegex = /^(https:\/\/soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)/
  const appleMusicRegex = /^(https:\/\/(music\.apple\.com|apple\.com\/music)\/[a-zA-Z0-9\/-]+)/

  // 초기 URL이 있으면 자동으로 처리
  useEffect(() => {
    if (initialUrl && initialUrl.trim() !== '') {
      setMusicUrl(initialUrl);
      // 약간의 지연 후 URL 제출 처리
      const timer = setTimeout(() => {
        handleSubmit({ preventDefault: () => {} });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [initialUrl]);

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    if (!musicUrl.trim()) return

    // Spotify URL 확인
    if (spotifyRegex.test(musicUrl)) {
      setMusicType('spotify')
      onMusicSelect({
        type: 'spotify',
        url: musicUrl
      })
      return
    }
    
    // SoundCloud URL 확인
    if (soundcloudRegex.test(musicUrl)) {
      setMusicType('soundcloud')
      onMusicSelect({
        type: 'soundcloud',
        url: musicUrl
      })
      return
    }
    
    // Apple Music URL 확인
    if (appleMusicRegex.test(musicUrl)) {
      setMusicType('applemusic')
      onMusicSelect({
        type: 'applemusic',
        url: musicUrl
      })
      return
    }
    
    // 지원하지 않는 URL
    setError('Please enter a URL for Spotify, SoundCloud, or Apple Music.')
  }

  const renderMusicPreview = () => {
    if (!musicUrl) return null
    
    if (musicType === 'spotify' && spotifyRegex.test(musicUrl)) {
      return (
        <iframe
          src={`https://open.spotify.com/embed/${musicUrl.split('/').slice(-2).join('/')}`}
          width="100%"
          height="152"
          frameBorder="0"
          allowtransparency="true"
          allow="encrypted-media"
          className={ss.musicPreview}
          style={{ 
            backgroundColor: 'transparent',
            borderRadius: '12px'
          }}
        />
      )
    }
    
    if (musicType === 'soundcloud' && soundcloudRegex.test(musicUrl)) {
      return (
        <iframe
          width="100%"
          height="166"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(musicUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
          className={ss.musicPreview}
          style={{ borderRadius: '12px' }}
        />
      )
    }
    
    return null
  }

  return (
    <div className={ss.uploadSection}>
      <div className={ss.uploadHeader}>
        <span className={ss.uploadTitle}>Music</span>
      </div>
      <form onSubmit={handleSubmit} className={ss.urlForm}>
        <input
          type="text"
          value={musicUrl}
          onChange={(e) => {
            setMusicUrl(e.target.value)
            setError('')
          }}
          placeholder="Paste Spotify, SoundCloud or Apple Music URL"
          className={ss.urlInput}
        />
        <button type="submit" className={ss.submitButton}>
          Add
        </button>
      </form>
      
      {error && <p className={ss.error}>{error}</p>}
      
      <div className={ss.previewContainer}>
        {renderMusicPreview()}
      </div>
    </div>
  )
}

export default MusicUploader 