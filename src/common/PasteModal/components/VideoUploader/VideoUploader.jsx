import React, { useState, useRef, useEffect } from 'react';
import ss from './VideoUploader.module.css';
import VideoPlayer from '../../../Components/VideoPlayer';
import ImagePreview from '../ImagePreview/ImagePreview';
import { FaUpload, FaImage, FaTimes, FaCamera, FaEdit } from 'react-icons/fa';
import VideoEditorModal from '../../../Components/VideoEditorModal/VideoEditorModal';

const VideoUploader = ({ onVideoSelect, initialUrl = '' }) => {
    const [url, setUrl] = useState(initialUrl);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [videoData, setVideoData] = useState(null);
    const [videoType, setVideoType] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');
    const [showThumbnailInput, setShowThumbnailInput] = useState(false);
    const [videoElement, setVideoElement] = useState(null);
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [showPlatformHelp, setShowPlatformHelp] = useState(false);
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);

    // 초기 URL이 있으면 자동으로 처리
    useEffect(() => {
        if (initialUrl && initialUrl.trim() !== '') {
            setUrl(initialUrl);
            // 약간의 지연 후 URL 제출 처리
            const timer = setTimeout(() => {
                handleUrlSubmit({ preventDefault: () => {} });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [initialUrl]);

    // Handle URL input change
    const handleUrlChange = (e) => {
        setUrl(e.target.value);
        setError('');
    };

    // Handle thumbnail URL input change
    const handleThumbnailUrlChange = (e) => {
        setCustomThumbnailUrl(e.target.value);
    };

    // Handle thumbnail URL submission
    const handleThumbnailUrlSubmit = (e) => {
        e.preventDefault();
        if (!customThumbnailUrl.trim()) {
            return;
        }

        // Validate image URL
        const img = new Image();
        img.onload = () => {
            const thumbnailData = {
                src: customThumbnailUrl,
                width: img.width,
                height: img.height,
                type: 'custom-url'
            };
            setThumbnail(thumbnailData);
            
            // Add thumbnail info to video data
            if (videoData) {
                const updatedVideoData = {
                    ...videoData,
                    thumbnailUrl: customThumbnailUrl
                };
                setVideoData(updatedVideoData);
                
                // Pass updated video data to parent component
                if (onVideoSelect) {
                    onVideoSelect(updatedVideoData);
                }
            }
        };
        
        img.onerror = () => {
            setError('Invalid image URL.');
        };
        
        img.src = customThumbnailUrl;
        setShowThumbnailInput(false);
    };

    // Handle thumbnail file upload
    const handleThumbnailUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Only image files can be uploaded.');
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const thumbnailData = {
                        src: reader.result,
                        width: img.width,
                        height: img.height,
                        file: file,
                        type: 'custom-file'
                    };
                    setThumbnail(thumbnailData);
                    
                    // Add thumbnail info to video data
                    if (videoData) {
                        const updatedVideoData = {
                            ...videoData,
                            thumbnailUrl: reader.result,
                            thumbnailFile: file,
                            customThumbnail: true
                        };
                        setVideoData(updatedVideoData);
                        onVideoSelect(updatedVideoData);
                    }
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Save current video frame as thumbnail
    const handleSaveCurrentFrame = () => {
        if (!videoElement) {
            setError('Video player not found.');
            return;
        }

        try {
            // Draw current video frame to canvas
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            
            // Extract image data from canvas
            const thumbnailUrl = canvas.toDataURL('image/jpeg');
            
            const thumbnailData = {
                src: thumbnailUrl,
                width: videoElement.videoWidth,
                height: videoElement.videoHeight,
                type: 'frame-capture'
            };
            setThumbnail(thumbnailData);
            
            // Add thumbnail info to video data
            if (videoData) {
                const updatedVideoData = {
                    ...videoData,
                    thumbnailUrl: thumbnailUrl,
                    customThumbnail: true,
                    currentTime: videoElement.currentTime
                };
                setVideoData(updatedVideoData);
                onVideoSelect(updatedVideoData);
            }
        } catch (error) {
            console.error('Frame capture error:', error);
            setError('An error occurred while capturing the current frame.');
        }
    };

    // Remove thumbnail
    const handleRemoveThumbnail = () => {
        setThumbnail(null);
        
        // Remove custom thumbnail info from video data and restore original thumbnail
        if (videoData) {
            const { customThumbnail, thumbnailFile, ...rest } = videoData;
            let updatedVideoData = { ...rest };
            
            // Restore original thumbnail URL for YouTube or Vimeo
            if (videoType === 'youtube' && videoData.videoId) {
                updatedVideoData.thumbnailUrl = `https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg`;
            }
            
            setVideoData(updatedVideoData);
            onVideoSelect(updatedVideoData);
        }
        
        if (thumbnailInputRef.current) {
            thumbnailInputRef.current.value = '';
        }
    };

    // Handle video URL submission
    const handleUrlSubmit = (e) => {
        e.preventDefault();
        setError('');
        
        if (!url.trim()) {
            setError('URL을 입력해주세요.');
            return;
        }
        
        try {
            let videoType = '';
            let videoId = '';
            let videoUrl = url.trim();
            let isShorts = false;
            
            // YouTube URL 인식
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                videoType = 'youtube';
                
                // YouTube URL에서 videoId 추출
                if (videoUrl.includes('youtube.com/watch')) {
                    const urlObj = new URL(videoUrl);
                    videoId = urlObj.searchParams.get('v');
                } else if (videoUrl.includes('youtu.be/')) {
                    videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
                } 
                // YouTube Shorts URL 인식 추가
                else if (videoUrl.includes('youtube.com/shorts/')) {
                    // 형식: youtube.com/shorts/VIDEO_ID
                    const shortsRegex = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/;
                    const match = videoUrl.match(shortsRegex);
                    
                    if (match && match[1]) {
                        videoId = match[1];
                        isShorts = true;
                        console.log('유튜브 숏츠 ID 추출됨:', videoId);
                    }
                }
                
                if (!videoId) {
                    setError('유효한 YouTube URL이 아닙니다.');
                    return;
                }
            }
            // TikTok URL 인식 추가
            else if (videoUrl.includes('tiktok.com')) {
                videoType = 'tiktok';
                
                // TikTok URL에서 videoId 추출
                // 형식: https://www.tiktok.com/@username/video/1234567890123456789
                // 또는: https://vm.tiktok.com/XXXXXXXX/
                const tiktokRegex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
                const tiktokShortRegex = /vm\.tiktok\.com\/([A-Za-z0-9]+)/;
                
                let match = videoUrl.match(tiktokRegex);
                let shortMatch = videoUrl.match(tiktokShortRegex);
                
                if (match && match[1]) {
                    videoId = match[1];
                    console.log('틱톡 비디오 ID 추출됨:', videoId);
                } else if (shortMatch && shortMatch[1]) {
                    videoId = shortMatch[1]; // 짧은 URL 형식
                    console.log('틱톡 짧은 URL ID 추출됨:', videoId);
                } else {
                    setError('유효한 TikTok URL이 아닙니다.');
                    return;
                }
            }
            // Vimeo URL 인식
            else if (videoUrl.includes('vimeo.com')) {
                videoType = 'vimeo';
                
                // Vimeo URL에서 videoId 추출
                const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
                const match = videoUrl.match(vimeoRegex);
                
                if (match && match[1]) {
                    videoId = match[1];
                } else {
                    setError('유효한 Vimeo URL이 아닙니다.');
                    return;
                }
            }
            // Bilibili URL 인식 (추가)
            else if (videoUrl.includes('bilibili.com')) {
                videoType = 'bilibili';
                console.log('빌리빌리 URL 감지됨:', videoUrl);
                
                // Bilibili URL에서 videoId 추출
                // BV 형식: https://www.bilibili.com/video/BV1xx411c7mD
                // AV 형식: https://www.bilibili.com/video/av170001
                const bvRegex = /bilibili\.com\/video\/(BV\w+)/;
                const avRegex = /bilibili\.com\/video\/av(\d+)/;
                
                let bvMatch = videoUrl.match(bvRegex);
                let avMatch = videoUrl.match(avRegex);
                
                if (bvMatch && bvMatch[1]) {
                    videoId = bvMatch[1];
                    console.log('빌리빌리 BV ID 추출됨:', videoId);
                } else if (avMatch && avMatch[1]) {
                    videoId = 'av' + avMatch[1];
                    console.log('빌리빌리 AV ID 추출됨:', videoId);
                } else {
                    setError('유효한 Bilibili URL이 아닙니다.');
                    return;
                }
            }
            // 로컬 비디오 URL 인식
            else if (videoUrl.startsWith('http') || videoUrl.startsWith('blob:')) {
                videoType = 'local';
                videoId = '';
            } else {
                setError('지원하지 않는 비디오 URL 형식입니다.');
                return;
            }
            
            // 비디오 데이터 설정
            const newVideoData = {
                type: videoType,
                videoId: videoId,
                url: videoType === 'local' ? videoUrl : '',
                thumbnailUrl: videoType === 'youtube' ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : (videoData?.thumbnailUrl || ''),
                isShorts: isShorts,
                originalUrl: videoUrl // 원본 URL 저장
            };
            
            console.log('새 비디오 데이터 생성:', newVideoData); // 디버깅 로그 추가
            
            // 비디오 타입 상태 업데이트 추가
            setVideoType(videoType);
            
            // 비디오 데이터 상태 업데이트
            setVideoData(newVideoData);
            
            // 비디오 선택 콜백 호출
            if (onVideoSelect) {
                onVideoSelect(newVideoData);
            }
            
            // 입력 필드 초기화하지 않음 (수정된 부분)
            // setUrl('');
        } catch (error) {
            console.error('URL 처리 오류:', error);
            setError('URL을 처리하는 중 오류가 발생했습니다.');
        }
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        
        if (!selectedFile) {
            return;
        }
        
        // Verify video file type
        if (!selectedFile.type.startsWith('video/')) {
            setError('Only video files can be uploaded.');
            setFile(null);
            return;
        }
        
        setError('');
        setFile(selectedFile);
        
        // Create file URL
        const url = URL.createObjectURL(selectedFile);
        
        // Create thumbnail from video
        const video = document.createElement('video');
        video.onloadeddata = () => {
            // Draw first frame to canvas when video is loaded
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Extract image data from canvas
            const thumbnailUrl = canvas.toDataURL('image/jpeg');
            
            const thumbnailData = {
                src: thumbnailUrl,
                width: video.videoWidth,
                height: video.videoHeight,
                type: 'local'
            };
            setThumbnail(thumbnailData);
            
            const data = {
                type: 'local',
                file: selectedFile,
                url: url,
                thumbnailUrl: thumbnailUrl
            };
            
            setVideoData(data);
            setVideoType('local');
            onVideoSelect(data);
        };
        
        video.onerror = () => {
            // Set video even if thumbnail creation fails
            const data = {
                type: 'local',
                file: selectedFile,
                url: url
            };
            
            setVideoData(data);
            setVideoType('local');
            onVideoSelect(data);
        };
        
        video.src = url;
        video.load();
    };

    // Handle file upload button click
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Handle thumbnail upload button click
    const handleThumbnailUploadClick = () => {
        thumbnailInputRef.current.click();
    };

    // Toggle thumbnail URL input
    const toggleThumbnailUrlInput = () => {
        setShowThumbnailInput(!showThumbnailInput);
        if (!showThumbnailInput) {
            setCustomThumbnailUrl('');
        }
    };

    // Set video element reference
    const handleVideoRef = (videoRef) => {
        if (videoRef) {
            setVideoElement(videoRef);
        }
    };

    // Handle video editor modal
    const handleOpenEditorModal = () => {
        // Pause the current video player if it's playing
        if (videoElement) {
            try {
                videoElement.pause();
            } catch (e) {
                console.error('Error pausing video:', e);
            }
        }
        
        // Open the editor modal
        setShowEditorModal(true);
        
        // Add a class to the body to indicate that a fullscreen modal is open
        document.body.classList.add('editor-modal-open');
    };
    
    const handleCloseEditorModal = () => {
        // Close the editor modal
        setShowEditorModal(false);
        
        // Remove the class from the body
        document.body.classList.remove('editor-modal-open');
        
        // Give time for the editor modal to clean up
        setTimeout(() => {
            // Refresh the video player if needed
            if (videoElement) {
                try {
                    // For local videos, we might need to reload the source
                    if (videoType === 'local') {
                        const currentSrc = videoElement.src;
                        videoElement.src = '';
                        videoElement.load();
                        videoElement.src = currentSrc;
                        videoElement.load();
                    }
                } catch (e) {
                    console.error('Error refreshing video:', e);
                }
            }
        }, 300);
    };

    return (
        <div className={ss.videoUploader}>
            {/* Input area */}
            <div className={ss.uploadArea}>
                <div className={ss.inputWrapper}>
                    <form onSubmit={handleUrlSubmit} className={ss.urlForm}>
                        <input
                            type="text"
                            value={url}
                            onChange={handleUrlChange}
                            placeholder="Enter YouTube, Shorts, TikTok or Vimeo URL"
                            className={ss.urlInput}
                        />
                        <button type="submit" className={ss.submitButton}>
                            Submit
                        </button>
                    </form>
                    
                    <span className={ss.divider}>or</span>
                    
                    <label className={ss.fileLabel} onClick={handleUploadClick}>
                        <FaUpload style={{ marginRight: '8px' }} />
                        Upload File
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className={ss.fileInput}
                        />
                    </label>
                </div>
                
                {error && <p className={ss.error}>{error}</p>}
            </div>
            
            {videoData && (
                <>
                    {/* 썸네일 입력 필드는 숨겨진 상태로 유지 (기능은 남겨둠) */}
                    <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className={ss.fileInput}
                    />
                    
                    {/* 비디오 플레이어 */}
                    <div className={ss.playerSection}>
                        <div className={ss.playerHeader}>
                            <span className={ss.playerTitle}>Video Preview</span>
                            <div className={ss.playerControls}>
                                <div className={ss.platformGuideWrapper}>
                                    <button
                                        type="button"
                                        className={ss.platformGuideButton}
                                        onMouseEnter={() => setShowPlatformHelp(true)}
                                        onMouseLeave={() => setShowPlatformHelp(false)}
                                    >
                                        Supported Platforms
                                    </button>
                                    {showPlatformHelp && (
                                        <div className={ss.platformGuide}>
                                            <div className={ss.tooltipHeader}>Supported Video Platforms</div>
                                            <div className={ss.tooltipContent}>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>YouTube</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>YouTube Shorts</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>TikTok</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>Vimeo</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>Bilibili</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                                <div className={ss.tooltipRow}>
                                                    <span className={ss.platformName}>Local Video</span>
                                                    <span className={ss.platformStatus}>✓</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    className={ss.editorButton}
                                    onClick={handleOpenEditorModal}
                                >
                                    <FaEdit style={{ marginRight: '4px' }} />
                                    Open Editor
                                </button>
                            </div>
                        </div>
                        <VideoPlayer 
                            videoData={videoData} 
                            videoType={videoType}
                            onVideoRef={handleVideoRef}
                            onRangeSelect={(range) => {
                                // Handle range selection
                                setVideoData(prev => ({
                                    ...prev,
                                    range: range
                                }));
                                onVideoSelect({
                                    ...videoData,
                                    range: range
                                });
                            }}
                        />
                    </div>
                </>
            )}

            {/* Video editor modal - rendered at the root level */}
            {showEditorModal && videoData && (
                <VideoEditorModal 
                    isOpen={showEditorModal}
                    onClose={handleCloseEditorModal}
                    videoData={videoData}
                    onSave={(editedData) => {
                        setVideoData(editedData);
                        if (editedData.thumbnailUrl) {
                            const thumbnailData = {
                                src: editedData.thumbnailUrl,
                                type: editedData.customThumbnail ? 'custom' : editedData.type
                            };
                            setThumbnail(thumbnailData);
                        }
                        onVideoSelect(editedData);
                    }}
                />
            )}
        </div>
    );
};

export default VideoUploader; 