import VideoPlayerBase from './VideoPlayerBase';
import YouTubePlayer from './YouTubePlayer';
import VimeoPlayer from './VimeoPlayer';
import LocalVideoPlayer from './LocalVideoPlayer';
import BilibiliPlayer from './BilibiliPlayer';
import TikTokPlayer from './TikTokPlayer';

// 비디오 타입에 따라 적절한 플레이어 컴포넌트를 반환하는 함수
export const getVideoPlayerByType = (type) => {
  console.log('플레이어 타입 요청:', type); // 디버깅 로그 추가
  
  switch (type) {
    case 'youtube':
      return YouTubePlayer;
    case 'vimeo':
      return VimeoPlayer;
    case 'bilibili':
      return BilibiliPlayer;
    case 'tiktok':
      return TikTokPlayer;
    case 'local':
    default:
      return LocalVideoPlayer;
  }
};

// 비디오 플레이어 컴포넌트
const VideoPlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
  // 비디오 타입에 따라 적절한 플레이어 컴포넌트 선택
  console.log('VideoPlayer 렌더링:', videoData); // 디버깅 로그 추가
  
  const PlayerComponent = getVideoPlayerByType(videoData?.type);
  
  return (
    <PlayerComponent
      videoData={videoData}
      onRangeSelect={onRangeSelect}
      onVideoRef={onVideoRef}
      onPlayerInstance={onPlayerInstance}
    />
  );
};

export { VideoPlayerBase, YouTubePlayer, VimeoPlayer, LocalVideoPlayer, BilibiliPlayer, TikTokPlayer };
export default VideoPlayer; 