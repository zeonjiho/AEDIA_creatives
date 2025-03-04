import React, { useState, useRef, useEffect, useId } from 'react';
import VideoPlayerBase from './VideoPlayerBase';
import ss from './YouTubePlayer.module.css';

// ----------------------------------------------------------
// 유튜브 비디오 플레이어 컴포넌트
// ----------------------------------------------------------
const YouTubePlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
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
  const [availableQualities, setAvailableQualities] = useState(['auto', 'hd1080', 'hd720', 'large', 'medium', 'small']);

  // Ref: YouTube 플레이어
  const playerRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);
  const playerContainerRef = useRef(null);
  const uniqueId = useId();
  const youtubePlayerId = `youtube-player-${uniqueId.replace(/:/g, '')}`;

  // ----------------------------------------------------------
  // YouTube API 로드
  // ----------------------------------------------------------
  const loadYouTubeAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existingScript) {
        if (!window.YT || !window.YT.Player) {
          window.onYouTubeIframeAPIReady = () => resolve();
        }
        return;
      }
      const timeoutId = setTimeout(() => reject(new Error('YouTube API load timeout')), 10000);
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('YouTube API script load failed'));
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
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current || isLoading) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume * 100);
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume) => {
    if (!playerRef.current || isLoading) return;
    
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume * 100);
    
    if (newVolume === 0) {
      playerRef.current.mute();
      setIsMuted(true);
    } else if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    }
  };

  const handleSeek = (time) => {
    if (!playerRef.current || isLoading) return;
    
    try {
      // 정확한 시간 이동을 위해 allowSeekAhead 파라미터를 true로 설정
      playerRef.current.seekTo(time, true);
      
      // 시간 이동 후 현재 시간 상태 즉시 업데이트
      setTimeout(() => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      }, 50);
    } catch (error) {
      console.error('YouTube 시간 이동 오류:', error);
    }
  };

  const handleQualityChange = (newQuality) => {
    setQuality(newQuality);
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackQuality(newQuality);
        console.log('YouTube 화질 변경:', newQuality);
      } catch (error) {
        console.error('YouTube 화질 설정 오류:', error);
      }
    }
  };

  // ----------------------------------------------------------
  // YouTube 플레이어 초기화 & 정리
  // ----------------------------------------------------------
  useEffect(() => {
    if (!videoData || !videoData.videoId) return;
    
    const initYouTubePlayer = async () => {
      setIsLoading(true);
      
      try {
        await loadYouTubeAPI();
        
        // 기존 플레이어 정리
        if (playerRef.current) {
          playerRef.current.destroy();
        }
        
        // YouTube iframe이 생성될 div 요소 확인
        const container = playerContainerRef.current;
        if (!container) {
          console.error('YouTube player container not found');
          setIsLoading(false);
          return;
        }
        
        // 기존 iframe이 있으면 제거
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        const player = new window.YT.Player(youtubePlayerId, {
          videoId: videoData.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            iv_load_policy: 3,
            autohide: 1,
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              playerRef.current = event.target;
              setDuration(event.target.getDuration());
              setIsLoading(false);
              
              // 볼륨 설정
              event.target.setVolume(volume * 100);
              if (isMuted) event.target.mute();
              
              // 화질 옵션 가져오기
              const qualities = event.target.getAvailableQualityLevels();
              if (qualities && qualities.length > 0) {
                setAvailableQualities(['auto', ...qualities]);
              }
              
              // 현재 화질 가져오기
              const currentQuality = event.target.getPlaybackQuality();
              if (currentQuality) {
                setQuality(currentQuality);
              }
              
              // 비디오 참조 전달
              if (onVideoRef) onVideoRef(event.target);
              
              // 주기적으로 현재 시간 업데이트 - 더 짧은 간격으로 설정하여 범위 재생 정확도 향상
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
              }
              
              timeUpdateIntervalRef.current = setInterval(() => {
                if (playerRef.current) {
                  try {
                    const currentPlayerTime = playerRef.current.getCurrentTime();
                    setCurrentTime(currentPlayerTime);
                  } catch (error) {
                    console.error('YouTube 현재 시간 가져오기 오류:', error);
                  }
                }
              }, 30); // 30ms 간격으로 더 정확하게 시간 추적
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsLoading(false);
              } else if (event.data === window.YT.PlayerState.PAUSED || 
                      event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.BUFFERING) {
                setIsLoading(true);
              } else if (event.data === window.YT.PlayerState.CUED) {
                setIsLoading(false);
              }
            },
            onPlaybackQualityChange: (event) => {
              setQuality(event.data);
              console.log('YouTube 화질 변경됨:', event.data);
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setIsLoading(false);
            }
          }
        });
      } catch (error) {
        console.error('YouTube API initialization error:', error);
        setIsLoading(false);
      }
    };
    
    initYouTubePlayer();
    
    // 정리 함수
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error cleaning up YouTube player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [videoData, youtubePlayerId]);

  // ----------------------------------------------------------
  // 플레이어 인스턴스 외부로 전달 (onPlayerInstance)
  // ----------------------------------------------------------
  useEffect(() => {
    if (onPlayerInstance && playerRef.current) {
      const playerInstance = {
        play: () => playerRef.current.playVideo(),
        pause: () => playerRef.current.pauseVideo(),
        seek: (time) => playerRef.current.seekTo(time, true),
        getCurrentTime: () => playerRef.current.getCurrentTime(),
        getDuration: () => playerRef.current.getDuration(),
        setVolume: (vol) => playerRef.current.setVolume(vol * 100),
        setQuality: (q) => playerRef.current.setPlaybackQuality(q),
        cleanup: () => {
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
            timeUpdateIntervalRef.current = null;
          }
          if (playerRef.current) {
            try {
              playerRef.current.pauseVideo();
              playerRef.current.destroy();
            } catch (e) {
              console.error('Error cleaning up YouTube player:', e);
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
      videoType="youtube"
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
        <div id={youtubePlayerId} ref={playerContainerRef} className={ss.hiddenIframe}></div>
      </div>
    </VideoPlayerBase>
  );
};

export default YouTubePlayer; 