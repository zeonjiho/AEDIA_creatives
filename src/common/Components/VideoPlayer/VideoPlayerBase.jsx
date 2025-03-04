import React, { useState, useRef, useEffect } from 'react';
import ss from './VideoPlayerBase.module.css';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeMute, 
  FaVolumeUp, 
  FaCrop, 
  FaStepForward, 
  FaStepBackward, 
  FaCog, 
  FaExpand, 
  FaCompress,
  FaRedo, 
  FaChevronDown 
} from 'react-icons/fa';

// ----------------------------------------------------------
// 비디오 플레이어 기본 컴포넌트 (모든 플랫폼 공통)
// ----------------------------------------------------------
const VideoPlayerBase = ({ 
  children, 
  videoData, 
  videoType, 
  onRangeSelect, 
  playerRef,
  isPlaying,
  setIsPlaying,
  isMuted,
  setIsMuted,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  volume,
  setVolume,
  quality,
  setQuality,
  availableQualities,
  setAvailableQualities,
  onSeek,
  onVolumeChange,
  onTogglePlay,
  onToggleMute,
  onQualityChange,
  useCustomControls = true
}) => {
  // ----------------------------------------------------------
  // 상태 관리 (State)
  // ----------------------------------------------------------
  const [isRangeSelecting, setIsRangeSelecting] = useState(false);
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCustomControls, setShowCustomControls] = useState(useCustomControls);

  // Ref: 타임라인, 컨테이너 등
  const timelineRef = useRef(null);
  const playerContainerRef = useRef(null);
  const qualityMenuRef = useRef(null);

  // 드래그 상태 관리를 위한 Ref
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startValue: 0
  });

  // ----------------------------------------------------------
  // 유틸리티 함수: 시간 포맷(초 -> mm:ss)
  // ----------------------------------------------------------
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------------
  // 타임라인 & 범위 선택 기능 (Range, Timeline)
  // ----------------------------------------------------------
  const handleRangeChange = (type, e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    let newRange = { ...range };

    if (type === 'start') {
      newRange.start = Math.min(time, range.end - 0.5);
    } else if (type === 'end') {
      newRange.end = Math.max(time, range.start + 0.5);
    }

    setRange(newRange);
    if (onRangeSelect) onRangeSelect(newRange);
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;

    if (isRangeSelecting) {
      const startRatio = range.start / duration;
      const endRatio = range.end / duration;
      if (ratio >= startRatio && ratio <= endRatio) {
        if (Math.abs(ratio - startRatio) < Math.abs(ratio - endRatio)) {
          setRange({ ...range, start: newTime });
        } else {
          setRange({ ...range, end: newTime });
        }
      } else if (ratio < startRatio) {
        setRange({ ...range, start: newTime });
      } else {
        setRange({ ...range, end: newTime });
      }
    } else {
      onSeek(newTime);
    }
  };

  const handleTimelineMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * duration;

    // 범위 선택 모드가 아닐 때 드래그로 시크
    if (!isRangeSelecting) {
      onSeek(newTime);
      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        startValue: newTime
      };
      setIsDragging(true);

      const handleMouseMove = (e) => {
        if (!dragStateRef.current.isDragging) return;
        const dx = e.clientX - rect.left;
        const moveRatio = Math.max(0, Math.min(1, dx / rect.width));
        const moveTime = moveRatio * duration;
        onSeek(moveTime);
      };

      const handleMouseUp = () => {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleRangeHandleMouseDown = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!timelineRef.current) return;

    const handleMouseMove = (e) => {
      handleRangeChange(type, e);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ----------------------------------------------------------
  // 재생 제어 (Play, Pause, Mute)
  // ----------------------------------------------------------
  const togglePlay = () => {
    if (onTogglePlay) onTogglePlay();
  };

  const toggleMute = () => {
    if (onToggleMute) onToggleMute();
  };

  const handleVolumeChange = (e) => {
    if (!e.target.closest(`.${ss.volumeSlider}`)) return;
    const rect = e.target.closest(`.${ss.volumeSlider}`).getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (onVolumeChange) onVolumeChange(ratio);
  };

  const handleVolumeSliderMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const volumeSlider = e.target.closest(`.${ss.volumeSlider}`);
    if (!volumeSlider) return;

    const rect = volumeSlider.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (onVolumeChange) onVolumeChange(ratio);

    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startValue: ratio
    };
    setIsDragging(true);

    const handleMouseMove = (e) => {
      if (!dragStateRef.current.isDragging) return;
      const dx = e.clientX - rect.left;
      const moveRatio = Math.max(0, Math.min(1, dx / rect.width));
      if (onVolumeChange) onVolumeChange(moveRatio);
    };

    const handleMouseUp = () => {
      dragStateRef.current.isDragging = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ----------------------------------------------------------
  // 재생 속도 제어
  // ----------------------------------------------------------
  const changePlaybackSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedOptions(false);
    
    if (playerRef && playerRef.current) {
      try {
        if (videoType === 'local') {
          playerRef.current.playbackRate = speed;
        } else if (videoType === 'youtube') {
          playerRef.current.setPlaybackRate(speed);
        } else if (videoType === 'vimeo') {
          playerRef.current.setPlaybackRate(speed);
        }
      } catch (error) {
        console.error('재생 속도 변경 오류:', error);
      }
    }
  };

  // ----------------------------------------------------------
  // 화질 설정 (YouTube / Vimeo)
  // ----------------------------------------------------------
  const toggleQualityMenu = () => {
    setIsQualityMenuOpen(!isQualityMenuOpen);
  };

  const handleQualityChange = (newQuality) => {
    if (onQualityChange) onQualityChange(newQuality);
    setIsQualityMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target)) {
        setIsQualityMenuOpen(false);
      }
    };
    if (isQualityMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQualityMenuOpen]);

  // ----------------------------------------------------------
  // 플레이어 클릭 처리
  // ----------------------------------------------------------
  const handlePlayerClick = (e) => {
    if (
      e.target.closest(`.${ss.playerControls}`) || 
      e.target.closest(`.${ss.rangeSelector}`)
    ) {
      return;
    }
    if (isLoading) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const distance = Math.sqrt(Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2));

    // 중심(재생 버튼) 근처 클릭 시 재생
    if (!isPlaying && distance < 60) {
      togglePlay();
    } else {
      // 그 외 영역 클릭 시 재생/일시정지 토글
      togglePlay();
    }
  };

  // ----------------------------------------------------------
  // 드래그로 플레이어 위치 이동
  // ----------------------------------------------------------
  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleDrag = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // ----------------------------------------------------------
  // 전체화면 제어
  // ----------------------------------------------------------
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!isFullscreen) {
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      } else if (playerContainerRef.current.msRequestFullscreen) {
        playerContainerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // 전체화면 상태 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // ----------------------------------------------------------
  // 커스텀 컨트롤 토글 함수
  // ----------------------------------------------------------
  const toggleCustomControls = () => {
    setShowCustomControls(!showCustomControls);
  };

  // ----------------------------------------------------------
  // 렌더링
  // ----------------------------------------------------------
  return (
    <div 
      className={`${ss.previewContainer} ${isFullscreen ? ss.fullscreen : ''} ${!showCustomControls ? ss.nativeControls : ''}`} 
      ref={playerContainerRef}
    >
      <div 
        className={`${ss.playerWrapper} ${isPlaying ? ss.isPlaying : ''}`}
        onClick={showCustomControls ? handlePlayerClick : undefined}
      >
        {/* 플랫폼별 비디오 플레이어 (자식 컴포넌트) */}
        {children}

        {/* 커스텀 오버레이 (재생버튼, 로딩 등) */}
        {showCustomControls && (
          <div className={ss.customPlayerOverlay}>
            {videoData && videoData.thumbnailUrl && !isPlaying && (
              <div 
                className={ss.thumbnailOverlay} 
                style={{ backgroundImage: `url(${videoData.thumbnailUrl})` }} 
              />
            )}
            {isLoading && <div className={ss.loadingIndicator} />}
            {!isPlaying && (
              <div className={ss.playButton} onClick={togglePlay}>
                <FaPlay />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 컨트롤 전환 버튼 */}
      <button 
        className={`${ss.controlButton} ${ss.toggleControlsButton}`}
        onClick={toggleCustomControls}
        title={showCustomControls ? "Use native controls" : "Use custom controls"}
      >
        <FaCog />
      </button>

      {/* 공통 플레이어 컨트롤 UI */}
      {showCustomControls && (
        <div className={ss.playerControls}>
          <div className={ss.timelineWrapper}>
            <span className={ss.timeText}>{formatTime(currentTime)}</span>
            <div 
              ref={timelineRef}
              className={ss.timeline}
              onClick={handleTimelineClick}
              onMouseDown={handleTimelineMouseDown}
            >
              <div 
                className={ss.timelineProgress}
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className={ss.timelineHandle} />
              </div>
              {isRangeSelecting && (
                <div 
                  className={ss.rangeArea}
                  style={{
                    left: `${duration > 0 ? (range.start / duration) * 100 : 0}%`,
                    width: `${duration > 0 ? ((range.end - range.start) / duration) * 100 : 0}%`
                  }}
                />
              )}
            </div>
            <span className={ss.timeText}>{formatTime(duration)}</span>
          </div>
          <div className={ss.controlsRow}>
            <div className={ss.leftControls}>
              <button className={ss.controlButton} onClick={togglePlay}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <div className={ss.volumeControl}>
                <button className={ss.controlButton} onClick={toggleMute}>
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <div 
                  className={ss.volumeSlider}
                  onClick={handleVolumeChange}
                  onMouseDown={handleVolumeSliderMouseDown}
                >
                  <div 
                    className={ss.volumeLevel}
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  >
                    <div className={ss.volumeHandle} />
                  </div>
                </div>
              </div>
            </div>
            <div className={ss.rightControls}>
              {/* 재생 속도 컨트롤 */}
              <div className={ss.speedControl}>
                <button 
                  className={`${ss.controlButton} ${showSpeedOptions ? ss.active : ''}`}
                  onClick={() => setShowSpeedOptions(!showSpeedOptions)}
                >
                  <span className={ss.speedText}>{playbackSpeed}x</span>
                </button>
                {showSpeedOptions && (
                  <div className={ss.speedOptionsCentered}>
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(speed => (
                      <button 
                        key={speed} 
                        className={`${ss.speedOption} ${playbackSpeed === speed ? ss.active : ''}`}
                        onClick={() => changePlaybackSpeed(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 화질 설정 (YouTube/Vimeo) */}
              {(videoType === 'youtube' || videoType === 'vimeo') && (
                <div className={ss.qualityControl}>
                  <button 
                    className={`${ss.controlButton} ${isQualityMenuOpen ? ss.active : ''}`}
                    onClick={toggleQualityMenu}
                  >
                    <div className={ss.qualityButtonContent}>
                      <span>{quality === 'auto' ? 'Auto' : quality}</span>
                      <span className={`${ss.qualityArrow} ${isQualityMenuOpen ? ss.up : ''}`}>▼</span>
                    </div>
                  </button>
                  {isQualityMenuOpen && (
                    <div className={ss.qualityMenu} ref={qualityMenuRef}>
                      <div className={ss.qualityMenuTitle}>Quality Settings</div>
                      {availableQualities.map(q => (
                        <button 
                          key={q} 
                          className={`${ss.qualityOption} ${quality === q ? ss.active : ''}`}
                          onClick={() => handleQualityChange(q)}
                        >
                          {q === 'auto' ? 'Auto' : q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* 범위 선택 버튼 */}
              <button 
                className={`${ss.controlButton} ${isRangeSelecting ? ss.active : ''}`}
                onClick={() => setIsRangeSelecting(!isRangeSelecting)}
              >
                <FaCrop />
              </button>
              
              {/* 새로고침 버튼 */}
              <button className={`${ss.controlButton} ${ss.refreshButton}`} onClick={() => onSeek(0)}>
                <FaRedo />
              </button>
              
              {/* 전체화면 버튼 */}
              <button 
                className={`${ss.controlButton} ${isFullscreen ? ss.active : ''}`}
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 범위 선택 UI */}
      {showCustomControls && isRangeSelecting && (
        <div className={`${ss.rangeSelector} ${isRangeSelecting ? ss.active : ''}`}>
          <div className={ss.rangeInfo}>
            <span>Start: {formatTime(range.start)}</span>
            <span>End: {formatTime(range.end)}</span>
            <span>Duration: {formatTime(range.end - range.start)}</span>
          </div>
          <div 
            className={`${ss.rangeHandle} ${ss.start}`}
            onMouseDown={(e) => handleRangeHandleMouseDown('start', e)}
            style={{
              left: `${duration > 0 ? (range.start / duration) * 100 : 0}%`
            }}
          />
          <div 
            className={`${ss.rangeHandle} ${ss.end}`}
            onMouseDown={(e) => handleRangeHandleMouseDown('end', e)}
            style={{
              left: `${duration > 0 ? (range.end / duration) * 100 : 0}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayerBase; 