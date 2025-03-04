import React, { useState, useEffect, useRef } from 'react';
import VideoPlayerBase from './VideoPlayerBase';
import ss from './BilibiliPlayer.module.css';

// ----------------------------------------------------------
// 빌리빌리 비디오 플레이어 컴포넌트
// ----------------------------------------------------------
const BilibiliPlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
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
  const [useCustomControls, setUseCustomControls] = useState(false);

  // Ref: Bilibili 플레이어
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  // ----------------------------------------------------------
  // Bilibili API 로드 및 초기화
  // ----------------------------------------------------------
  useEffect(() => {
    if (!videoData || !videoData.videoId) return;
    
    console.log('빌리빌리 플레이어 초기화:', videoData.videoId);
    setIsLoading(true);
    
    // 임시 재생 시간 설정 (실제 영상 길이를 알 수 없으므로)
    setDuration(300);
    
    // 플레이어 인스턴스 생성
    playerRef.current = {
      play: () => {
        console.log('빌리빌리 플레이어 재생 시도');
        setIsPlaying(true);
      },
      pause: () => {
        console.log('빌리빌리 플레이어 일시정지 시도');
        setIsPlaying(false);
      },
      seek: (time) => {
        console.log('빌리빌리 플레이어 탐색 시도:', time);
        setCurrentTime(time);
      },
      getCurrentTime: () => currentTime,
      getDuration: () => duration,
      setVolume: (vol) => {
        console.log('빌리빌리 플레이어 볼륨 설정:', vol);
        setVolume(vol);
      }
    };
    
    // 비디오 참조 전달
    if (onVideoRef) {
      onVideoRef(playerRef.current);
    }
    
    // 로딩 상태 해제 (iframe이 로드되면)
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('빌리빌리 플레이어 로딩 완료');
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [videoData]);

  // ----------------------------------------------------------
  // 플레이어 인스턴스 외부로 전달 (onPlayerInstance)
  // ----------------------------------------------------------
  useEffect(() => {
    if (onPlayerInstance && playerRef.current) {
      onPlayerInstance(playerRef.current);
    }
  }, [onPlayerInstance, playerRef.current]);

  // ----------------------------------------------------------
  // 재생 제어 (Play, Pause, Mute)
  // ----------------------------------------------------------
  const handleTogglePlay = () => {
    console.log('빌리빌리 재생/일시정지 토글:', !isPlaying);
    setIsPlaying(!isPlaying);
  };

  const handleToggleMute = () => {
    console.log('빌리빌리 음소거 토글:', !isMuted);
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume) => {
    console.log('빌리빌리 볼륨 변경:', newVolume);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSeek = (time) => {
    console.log('빌리빌리 탐색:', time);
    setCurrentTime(time);
  };

  const handleQualityChange = (newQuality) => {
    console.log('빌리빌리 화질 변경:', newQuality);
    setQuality(newQuality);
  };

  // ----------------------------------------------------------
  // 메시지 이벤트 리스너 설정
  // ----------------------------------------------------------
  useEffect(() => {
    const handleMessage = (event) => {
      // 메시지 출처 확인 (bilibili.com 도메인에서 온 메시지만 처리)
      // 도메인 체크를 완화하거나 제거 (개발 중에는 문제가 될 수 있음)
      // if (!event.origin.includes('bilibili.com')) return;
      
      const { data } = event;
      if (!data || !data.type || data.type !== 'player') return;
      
      switch (data.action) {
        case 'ready':
          setIsLoading(false);
          if (data.duration) setDuration(data.duration);
          break;
        case 'play':
          setIsPlaying(true);
          setIsLoading(false);
          break;
        case 'pause':
          setIsPlaying(false);
          break;
        case 'timeupdate':
          if (data.currentTime) setCurrentTime(data.currentTime);
          break;
        case 'ended':
          setIsPlaying(false);
          break;
        case 'volumechange':
          if (data.volume !== undefined) {
            setVolume(data.volume);
            setIsMuted(data.volume === 0);
          }
          break;
        case 'qualitychange':
          if (data.quality) setQuality(data.quality);
          break;
        case 'error':
          console.error('Bilibili player error:', data.error);
          setIsLoading(false);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // ----------------------------------------------------------
  // 빌리빌리 비디오 ID 파싱
  // ----------------------------------------------------------
  const bvid = videoData?.videoId?.startsWith('BV') ? videoData.videoId : '';
  const aid = videoData?.videoId?.startsWith('av') ? videoData.videoId.substring(2) : '';
  
  // ----------------------------------------------------------
  // 임베드 URL 생성
  // ----------------------------------------------------------
  let embedUrl = 'https://player.bilibili.com/player.html?';
  if (bvid) {
    embedUrl += `bvid=${bvid}`;
  } else if (aid) {
    embedUrl += `aid=${aid}`;
  }
  embedUrl += '&high_quality=1&danmaku=0&as_wide=1&page=1&autoplay=0';
  
  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------
  return (
    <VideoPlayerBase
      videoData={videoData}
      videoType="bilibili"
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
      useCustomControls={useCustomControls}
    >
      <div className={ss.iframeContainer}>
        {isLoading && <div className={ss.loadingIndicator} />}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className={ss.bilibiliIframe}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ pointerEvents: 'auto' }}
        />
      </div>
    </VideoPlayerBase>
  );
};

export default BilibiliPlayer; 