import React, { useEffect, useRef, useState } from 'react';
import VideoPlayerBase from './VideoPlayerBase';
import ss from './TikTokPlayer.module.css';

const TikTokPlayer = ({ videoData, onRangeSelect, onVideoRef, onPlayerInstance }) => {
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!videoData || !videoData.videoId) {
            setError('비디오 ID가 없습니다.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        // TikTok 위젯 스크립트 로드
        const loadTikTokWidget = () => {
            // 이미 스크립트가 로드되어 있는지 확인
            const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
            
            if (!existingScript) {
                const script = document.createElement('script');
                script.src = 'https://www.tiktok.com/embed.js';
                script.async = true;
                script.onload = () => {
                    console.log('TikTok 스크립트 로드 완료');
                    if (window.tiktok && window.tiktok.widgets) {
                        window.tiktok.widgets.load();
                    }
                    setIsLoading(false);
                };
                script.onerror = () => {
                    console.error('TikTok 스크립트 로드 실패');
                    setError('TikTok 임베드 스크립트 로드 실패');
                    setIsLoading(false);
                };
                document.body.appendChild(script);
            } else {
                console.log('TikTok 스크립트가 이미 로드되어 있음');
                // 이미 로드된 경우 위젯 리로드
                setTimeout(() => {
                    if (window.tiktok && window.tiktok.widgets) {
                        window.tiktok.widgets.load();
                    }
                    setIsLoading(false);
                }, 500);
            }
        };

        loadTikTokWidget();

        // 컴포넌트 언마운트 시 클린업
        return () => {
            // 필요한 경우 클린업 로직 추가
        };
    }, [videoData]);

    // 비디오 콘텐츠 렌더링
    const renderTikTokContent = () => {
        if (isLoading) {
            return (
                <div className={ss.loadingContainer}>
                    <div className={ss.loadingSpinner}></div>
                    <p>TikTok 비디오 로딩 중...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className={ss.errorContainer}>
                    <p className={ss.errorMessage}>{error}</p>
                    <p className={ss.errorHelp}>
                        유효한 TikTok URL을 입력했는지 확인해주세요.
                    </p>
                </div>
            );
        }

        // 비디오 ID와 원본 URL 확인
        const videoId = videoData.videoId;
        const originalUrl = videoData.originalUrl || `https://www.tiktok.com/@user/video/${videoId}`;
        
        console.log('TikTok 렌더링:', { videoId, originalUrl });

        // TikTok 공식 임베드 코드 형식 사용
        return (
            <div className={ss.tiktokContainer} ref={containerRef}>
                <blockquote 
                    className="tiktok-embed" 
                    cite={originalUrl}
                    data-video-id={videoId}
                >
                    <section>
                        <a target="_blank" rel="noopener noreferrer" href={originalUrl}>
                            TikTok 비디오 보기
                        </a>
                    </section>
                </blockquote>
            </div>
        );
    };

    return (
        <VideoPlayerBase
            videoData={videoData}
            onRangeSelect={onRangeSelect}
            thumbnailUrl={videoData?.thumbnailUrl || ''}
            isEmbed={true}
            playerType="tiktok"
        >
            {renderTikTokContent()}
        </VideoPlayerBase>
    );
};

export default TikTokPlayer; 