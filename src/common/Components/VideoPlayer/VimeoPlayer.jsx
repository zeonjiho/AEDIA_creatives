import React, { useState, useRef, useEffect } from 'react';
import VideoPlayerBase from './VideoPlayerBase';
import ss from './VimeoPlayer.module.css';

// ----------------------------------------------------------
// 비메오 비디오 플레이어 컴포넌트
// ----------------------------------------------------------
const VimeoPlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
  // ----------------------------------------------------------
  // 상태 관리 (State)
  // ----------------------------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState(['auto', '1080p', '720p', '540p', '360p', '240p']);

  // Ref: Vimeo 플레이어
  const playerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // ----------------------------------------------------------
  // Vimeo API 로드
  // ----------------------------------------------------------
  const loadVimeoAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.Vimeo && window.Vimeo.Player) {
        resolve();
        return;
      }
      
      const existingScript = document.querySelector('script[src="https://player.vimeo.com/api/player.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Vimeo API script load failed')));
        return;
      }
      
      const timeoutId = setTimeout(() => reject(new Error('Vimeo API load timeout')), 10000);
      const tag = document.createElement('script');
      tag.src = 'https://player.vimeo.com/api/player.js';
      tag.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      tag.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Vimeo API script load failed'));
      };
      document.body.appendChild(tag);
    });
  };

  // ----------------------------------------------------------
  // 재생 제어 (Play, Pause, Mute)
  // ----------------------------------------------------------
  const handleTogglePlay = () => {
    if (!playerRef.current || isLoading) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current || isLoading) return;
    
    if (isMuted) {
      playerRef.current.setVolume(volume);
    } else {
      playerRef.current.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume) => {
    if (!playerRef.current || isLoading) return;
    
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (time) => {
    if (!playerRef.current || isLoading) return;
    playerRef.current.setCurrentTime(time);
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (playerRef.current) {
      try {
        // Vimeo API에서는 quality 설정이 다르게 처리됨
        // 'auto'는 'auto', 그 외에는 숫자만 추출 (예: '720p' -> 720)
        const qualityValue = newQuality === 'auto' ? 'auto' : parseInt(newQuality, 10);
        playerRef.current.setQuality(qualityValue);
        console.log('Vimeo 화질 변경:', newQuality);
      } catch (error) {
        console.error('Vimeo 화질 설정 오류:', error);
      }
    }
  };

  // ----------------------------------------------------------
  // 비메오 플레이어 초기화 & 정리
  // ----------------------------------------------------------
  useEffect(() => {
    if (!videoData || !videoData.videoId) return;
    
    const initVimeoPlayer = async () => {
      setIsLoading(true);
      
      try {
        await loadVimeoAPI();
        
        // 기존 플레이어 정리
        if (playerRef.current) {
          playerRef.current.destroy();
        }
        
        // Vimeo iframe이 생성될 div 요소 확인
        const container = document.getElementById('vimeo-player');
        if (!container) {
          console.error('Vimeo player container not found');
          setIsLoading(false);
          return;
        }
        
        // 기존 iframe이 있으면 제거
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        // iframe 요소 생성
        const iframe = document.createElement('iframe');
        iframe.id = 'vimeo-iframe';
        iframe.src = `https://player.vimeo.com/video/${videoData.videoId}?controls=0&transparent=0&autoplay=0&loop=0&muted=0&background=0`;
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        container.appendChild(iframe);
        
        // Vimeo Player 인스턴스 생성
        const player = new window.Vimeo.Player(iframe, {
          id: videoData.videoId,
          width: '100%',
          height: '100%',
          controls: false,
          transparent: false,
          autoplay: false,
          loop: false,
          muted: isMuted,
          background: false
        });
        
        playerRef.current = player;
        
        // 이벤트 리스너 설정
        player.on('loaded', () => {
          setIsLoading(false);
          
          // 볼륨 설정
          player.setVolume(volume);
          if (isMuted) player.setVolume(0);
          
          // 비디오 정보 가져오기
          player.getDuration().then(videoDuration => {
            setDuration(videoDuration);
          });
          
          // 화질 옵션 가져오기
          player.getQualities().then(qualities => {
            if (qualities && qualities.length > 0) {
              const qualityOptions = qualities.map(q => `${q.height}p`);
              setAvailableQualities(['auto', ...qualityOptions]);
            }
          }).catch(err => {
            console.error('Vimeo 화질 옵션 가져오기 오류:', err);
          });
          
          // 현재 화질 가져오기
          player.getQuality().then(currentQuality => {
            if (currentQuality) {
              setQuality(currentQuality === 'auto' ? 'auto' : `${currentQuality}p`);
            }
          }).catch(err => {
            console.error('Vimeo 현재 화질 가져오기 오류:', err);
          });
          
          // 비디오 참조 전달
          if (onVideoRef) onVideoRef(player);
          
          // 주기적으로 현재 시간 업데이트
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
          timeUpdateIntervalRef.current = setInterval(() => {
            if (playerRef.current) {
              playerRef.current.getCurrentTime().then(time => {
                setCurrentTime(time);
              });
            }
          }, 100);
        });
        
        player.on('play', () => {
          setIsPlaying(true);
          setIsLoading(false);
        });
        
        player.on('pause', () => {
          setIsPlaying(false);
        });
        
        player.on('ended', () => {
          setIsPlaying(false);
        });
        
        player.on('bufferstart', () => {
          setIsLoading(true);
        });
        
        player.on('bufferend', () => {
          setIsLoading(false);
        });
        
        player.on('volumechange', (event) => {
          setVolume(event.volume);
          setIsMuted(event.volume === 0);
        });
        
        player.on('qualitychange', (event) => {
          setQuality(event.quality === 'auto' ? 'auto' : `${event.quality}p`);
          console.log('Vimeo 화질 변경됨:', event.quality);
        });
        
        player.on('error', (error) => {
          console.error('Vimeo player error:', error);
          setIsLoading(false);
        });
        
      } catch (error) {
        console.error('Vimeo API initialization error:', error);
        setIsLoading(false);
      }
    };
    
    initVimeoPlayer();
    
    // 정리 함수
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error cleaning up Vimeo player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [videoData]);

  // ----------------------------------------------------------
  // 플레이어 인스턴스 외부로 전달 (onPlayerInstance)
  // ----------------------------------------------------------
  useEffect(() => {
    if (onPlayerInstance && playerRef.current) {
      const playerInstance = {
        play: () => playerRef.current.play(),
        pause: () => playerRef.current.pause(),
        seek: (time) => playerRef.current.setCurrentTime(time),
        getCurrentTime: () => {
          return new Promise((resolve) => {
            playerRef.current.getCurrentTime().then(time => resolve(time));
          });
        },
        getDuration: () => {
          return new Promise((resolve) => {
            playerRef.current.getDuration().then(duration => resolve(duration));
          });
        },
        setVolume: (vol) => playerRef.current.setVolume(vol),
        setQuality: (q) => {
          const qualityValue = q === 'auto' ? 'auto' : parseInt(q, 10);
          playerRef.current.setQuality(qualityValue);
        },
        cleanup: () => {
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
            timeUpdateIntervalRef.current = null;
          }
          if (playerRef.current) {
            try {
              playerRef.current.pause();
              playerRef.current.destroy();
            } catch (e) {
              console.error('Error cleaning up Vimeo player:', e);
            }
            playerRef.current = null;
          }
        }
      };
      onPlayerInstance(playerInstance);
    }
  }, [onPlayerInstance, playerRef.current]);

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------
  return (
    <VideoPlayerBase
      videoData={videoData}
      videoType="vimeo"
      onRangeSelect={onRangeSelect}
      playerRef={playerRef}
      isPlaying={isPlaying}
      setIsPlaying={setIsPlaying}
      isMuted={isMuted}
      setIsMuted={setIsMuted}
      currentTime={currentTime}
      setCurrentTime={setCurrentTime}
      duration={duration}
      setDuration={setDuration}
      volume={volume}
      setVolume={setVolume}
      quality={quality}
      setQuality={setQuality}
      availableQualities={availableQualities}
      setAvailableQualities={setAvailableQualities}
      onSeek={handleSeek}
      onVolumeChange={handleVolumeChange}
      onTogglePlay={handleTogglePlay}
      onToggleMute={handleToggleMute}
      onQualityChange={handleQualityChange}
    >
      <div className={ss.iframeContainer}>
        <div id="vimeo-player" className={ss.hiddenIframe}></div>
      </div>
    </VideoPlayerBase>
  );
};

export default VimeoPlayer; 