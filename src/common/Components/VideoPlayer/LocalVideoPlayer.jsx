import React, { useState, useRef, useEffect } from 'react';
import VideoPlayerBase from './VideoPlayerBase';
import ss from './LocalVideoPlayer.module.css';

// ----------------------------------------------------------
// 로컬 비디오 플레이어 컴포넌트
// ----------------------------------------------------------
const LocalVideoPlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
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
  const [availableQualities, setAvailableQualities] = useState(['auto']);

  // Ref: 비디오 요소
  const videoRef = useRef(null);
  const timeUpdateIntervalRef = useRef(null);

  // ----------------------------------------------------------
  // 재생 제어 (Play, Pause, Mute)
  // ----------------------------------------------------------
  const handleTogglePlay = () => {
    if (!videoRef.current || isLoading) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error('비디오 재생 오류:', error);
      });
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current || isLoading) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume) => {
    if (!videoRef.current || isLoading) return;
    
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleSeek = (time) => {
    if (!videoRef.current || isLoading) return;
    videoRef.current.currentTime = time;
  };

  const handleQualityChange = (newQuality) => {
    // 로컬 비디오는 화질 변경이 제한적이지만, 일관성을 위해 상태는 유지
    setQuality(newQuality);
    console.log('로컬 비디오 화질 변경 시도:', newQuality);
  };

  // ----------------------------------------------------------
  // 비디오 이벤트 핸들러
  // ----------------------------------------------------------
  const handleVideoLoaded = () => {
    if (!videoRef.current) return;
    
    setIsLoading(false);
    setDuration(videoRef.current.duration);
    
    // 비디오 참조 전달
    if (onVideoRef) onVideoRef(videoRef.current);
    
    // 주기적으로 현재 시간 업데이트
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    timeUpdateIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, 100);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    setIsLoading(false);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleVideoWaiting = () => {
    setIsLoading(true);
  };

  const handleVideoCanPlay = () => {
    setIsLoading(false);
  };

  const handleVideoError = (error) => {
    console.error('비디오 로드 오류:', error);
    setIsLoading(false);
  };

  // ----------------------------------------------------------
  // 비디오 초기화 & 정리
  // ----------------------------------------------------------
  useEffect(() => {
    if (!videoData || !videoData.url) return;
    
    // 비디오 요소 초기화
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.src = videoData.url;
      videoRef.current.load();
    }
    
    // 정리 함수
    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
        timeUpdateIntervalRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [videoData]);

  // ----------------------------------------------------------
  // 플레이어 인스턴스 외부로 전달 (onPlayerInstance)
  // ----------------------------------------------------------
  useEffect(() => {
    if (onPlayerInstance && videoRef.current) {
      const playerInstance = {
        play: () => {
          videoRef.current.play().catch(error => {
            console.error('비디오 재생 오류:', error);
          });
        },
        pause: () => videoRef.current.pause(),
        seek: (time) => {
          videoRef.current.currentTime = time;
        },
        getCurrentTime: () => videoRef.current.currentTime,
        getDuration: () => videoRef.current.duration,
        setVolume: (vol) => {
          videoRef.current.volume = vol;
          if (vol === 0) {
            videoRef.current.muted = true;
          } else {
            videoRef.current.muted = false;
          }
        },
        setQuality: () => {
          // 로컬 비디오는 화질 변경 API가 없음
          console.log('로컬 비디오는 화질 변경을 지원하지 않습니다.');
        },
        cleanup: () => {
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
            timeUpdateIntervalRef.current = null;
          }
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
            videoRef.current.load();
          }
        }
      };
      onPlayerInstance(playerInstance);
    }
  }, [onPlayerInstance, videoRef.current]);

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------
  return (
    <VideoPlayerBase
      videoData={videoData}
      videoType="local"
      onRangeSelect={onRangeSelect}
      playerRef={videoRef}
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
      <div className={ss.videoContainer}>
        <video
          ref={videoRef}
          className={ss.videoElement}
          preload="metadata"
          playsInline
          onLoadedMetadata={handleVideoLoaded}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          onWaiting={handleVideoWaiting}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        >
          <source src={videoData?.url} type={videoData?.type || 'video/mp4'} />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
      </div>
    </VideoPlayerBase>
  );
};

export default LocalVideoPlayer; 