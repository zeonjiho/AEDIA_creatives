import React, { useState, useEffect, useRef } from 'react';
import ss from './VideoEditorModal.module.css';
import './global-modal-styles.css';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import { FaUpload, FaImage, FaTimes, FaCamera, FaEdit, FaCheck, FaArrowLeft, FaCrop, FaCut } from 'react-icons/fa';

const VideoEditorModal = ({ isOpen, onClose, videoData, onSave }) => {
    const [editedVideoData, setEditedVideoData] = useState(null);
    const [videoType, setVideoType] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');
    const [showThumbnailInput, setShowThumbnailInput] = useState(false);
    const [videoElement, setVideoElement] = useState(null);
    const [error, setError] = useState('');
    const [showTrimControls, setShowTrimControls] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const thumbnailInputRef = useRef(null);
    const modalRef = useRef(null);
    const playerInstanceRef = useRef(null);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target) && 
                e.target.className === ss.videoEditorFullscreenOverlay) {
                // 오버레이 영역 클릭 시 확인 대화상자 표시
                setShowConfirmDialog(true);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Prevent body scrolling when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            // Restore body scrolling when modal is closed
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Update state when videoData changes
    useEffect(() => {
        if (videoData && isOpen) {
            // Deep clone the videoData to avoid reference issues
            const clonedData = JSON.parse(JSON.stringify(videoData));
            setEditedVideoData(clonedData);
            setVideoType(clonedData.type);
            
            if (clonedData.thumbnailUrl) {
                const thumbnailData = {
                    src: clonedData.thumbnailUrl,
                    type: clonedData.customThumbnail ? 'custom' : clonedData.type
                };
                setThumbnail(thumbnailData);
            }
            
            // Reset hasChanges when opening modal
            setHasChanges(false);
        }
    }, [videoData, isOpen]);

    // Close modal with ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (hasChanges) {
                    setShowConfirmDialog(true);
                } else {
                    handleCloseModal();
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, hasChanges]);

    // Clean up function for modal close
    const handleCloseModal = () => {
        // Clean up video player instances
        if (playerInstanceRef.current) {
            // If there's a cleanup method available, call it
            if (playerInstanceRef.current.cleanup && typeof playerInstanceRef.current.cleanup === 'function') {
                playerInstanceRef.current.cleanup();
            }
            playerInstanceRef.current = null;
        }
        
        // Reset video element reference
        setVideoElement(null);
        
        // Reset state
        setShowTrimControls(false);
        setCurrentFrame(null);
        setShowConfirmDialog(false);
        
        // Call the original onClose
        onClose();
    };

    // Handle back button click
    const handleBackClick = () => {
        if (hasChanges) {
            setShowConfirmDialog(true);
        } else {
            handleCloseModal();
        }
    };

    // Set hasChanges to true whenever a change is made
    useEffect(() => {
        if (editedVideoData && videoData) {
            // Check if there are any differences between original and edited data
            setHasChanges(JSON.stringify(editedVideoData) !== JSON.stringify(videoData));
        }
    }, [editedVideoData, videoData]);

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
            if (editedVideoData) {
                setEditedVideoData({
                    ...editedVideoData,
                    thumbnailUrl: customThumbnailUrl,
                    customThumbnail: true
                });
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
                    if (editedVideoData) {
                        setEditedVideoData({
                            ...editedVideoData,
                            thumbnailUrl: reader.result,
                            thumbnailFile: file,
                            customThumbnail: true
                        });
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
            if (editedVideoData) {
                setEditedVideoData({
                    ...editedVideoData,
                    thumbnailUrl: thumbnailUrl,
                    customThumbnail: true,
                    currentTime: videoElement.currentTime
                });
            }
        } catch (error) {
            console.error('Frame capture error:', error);
            setError('An error occurred while capturing the current frame.');
        }
    };

    // Capture current frame for preview
    const handleCaptureCurrentFrame = () => {
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
            const frameUrl = canvas.toDataURL('image/jpeg');
            setCurrentFrame({
                src: frameUrl,
                time: videoElement.currentTime
            });
        } catch (error) {
            console.error('Frame capture error:', error);
            setError('An error occurred while capturing the current frame.');
        }
    };

    // Use current frame as thumbnail
    const handleUseFrameAsThumbnail = () => {
        if (!currentFrame) return;
        
        const thumbnailData = {
            src: currentFrame.src,
            type: 'frame-capture'
        };
        setThumbnail(thumbnailData);
        
        // Add thumbnail info to video data
        if (editedVideoData) {
            setEditedVideoData({
                ...editedVideoData,
                thumbnailUrl: currentFrame.src,
                customThumbnail: true,
                currentTime: currentFrame.time
            });
        }
    };

    // Remove thumbnail
    const handleRemoveThumbnail = () => {
        setThumbnail(null);
        
        // Remove custom thumbnail info from video data and restore original thumbnail
        if (editedVideoData) {
            const { customThumbnail, thumbnailFile, ...rest } = editedVideoData;
            let updatedVideoData = { ...rest };
            
            // Restore original thumbnail URL for YouTube or Vimeo
            if (videoType === 'youtube' && editedVideoData.videoId) {
                updatedVideoData.thumbnailUrl = `https://img.youtube.com/vi/${editedVideoData.videoId}/hqdefault.jpg`;
            }
            
            setEditedVideoData(updatedVideoData);
        }
        
        if (thumbnailInputRef.current) {
            thumbnailInputRef.current.value = '';
        }
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

    // Toggle trim controls
    const toggleTrimControls = () => {
        setShowTrimControls(!showTrimControls);
    };

    // Set video element reference
    const handleVideoRef = (videoRef) => {
        if (videoRef) {
            setVideoElement(videoRef);
        }
    };

    // Set player instance reference
    const handlePlayerInstance = (instance) => {
        playerInstanceRef.current = instance;
    };

    // Save changes
    const handleSaveChanges = () => {
        if (onSave && editedVideoData) {
            onSave(editedVideoData);
        }
        handleCloseModal();
    };

    // Handle confirm dialog actions
    const handleConfirmExit = () => {
        setShowConfirmDialog(false);
        handleCloseModal();
    };

    const handleCancelExit = () => {
        setShowConfirmDialog(false);
    };

    if (!isOpen) return null;

    return (
        <div className={ss.videoEditorFullscreenOverlay}>
            <div 
                className={ss.videoEditorContainer} 
                ref={modalRef}
            >
                <div className={ss.videoEditorHeader}>
                    <button className={ss.backButton} onClick={handleBackClick}>
                        <FaArrowLeft style={{ marginRight: '4px' }} />
                    </button>
                    <h2 className={ss.modalTitle}>Video Editor</h2>
                    <button className={ss.saveButton} onClick={handleSaveChanges}>
                        <FaCheck style={{ marginRight: '6px' }} />
                        Save
                    </button>
                </div>
                
                {error && <p className={ss.error}>{error}</p>}
                
                {/* Confirm Dialog */}
                {showConfirmDialog && (
                    <div className={ss.confirmDialog}>
                        <div className={ss.confirmDialogContent}>
                            <h3 className={ss.confirmTitle}>저장되지 않은 변경사항</h3>
                            <p className={ss.confirmMessage}>
                                정말 나가시겠습니까? 저장되지 않은 모든 정보는 지워집니다.
                            </p>
                            <div className={ss.confirmButtons}>
                                <button 
                                    className={ss.cancelButton} 
                                    onClick={handleCancelExit}
                                >
                                    취소
                                </button>
                                <button 
                                    className={ss.confirmButton} 
                                    onClick={handleConfirmExit}
                                >
                                    나가기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {editedVideoData && (
                    <div className={ss.editorContent} style={{ overflow: 'visible' }}>
                        {/* Video player */}
                        <div className={ss.playerSection}>
                            <VideoPlayer 
                                videoData={editedVideoData} 
                                videoType={videoType}
                                onVideoRef={handleVideoRef}
                                onPlayerInstance={handlePlayerInstance}
                                onRangeSelect={(range) => {
                                    // Handle range selection
                                    setEditedVideoData(prev => ({
                                        ...prev,
                                        range: range
                                    }));
                                }}
                            />
                            
                            {/* Editing tools below player */}
                            <div className={ss.editingTools}>
                                <div className={ss.toolsHeader}>
                                    <h3 className={ss.toolsTitle}>Editing Tools</h3>
                                </div>
                                <div className={ss.toolsButtons}>
                                    <button 
                                        className={`${ss.toolButton} ${showTrimControls ? ss.active : ''}`}
                                        onClick={toggleTrimControls}
                                    >
                                        <FaCut style={{ marginRight: '8px', fontSize: '1rem' }} />
                                        Trim Video
                                    </button>
                                    <button 
                                        className={ss.toolButton}
                                        onClick={handleCaptureCurrentFrame}
                                    >
                                        <FaCamera style={{ marginRight: '8px', fontSize: '1rem' }} />
                                        Capture Frame
                                    </button>
                                    {currentFrame && (
                                        <button 
                                            className={ss.toolButton}
                                            onClick={handleUseFrameAsThumbnail}
                                        >
                                            <FaImage style={{ marginRight: '8px', fontSize: '1rem' }} />
                                            Use as Thumbnail
                                        </button>
                                    )}
                                </div>
                                
                                {/* Frame preview */}
                                {currentFrame && (
                                    <div className={ss.framePreview}>
                                        <div className={ss.framePreviewHeader}>
                                            <span className={ss.framePreviewTitle}>Captured Frame</span>
                                            <span className={ss.frameTime}>{formatTime(currentFrame.time)}</span>
                                        </div>
                                        <div className={ss.framePreviewContainer}>
                                            <img 
                                                src={currentFrame.src} 
                                                alt="Captured frame" 
                                                className={ss.framePreviewImage}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Thumbnail controls area */}
                        <div className={ss.thumbnailControls}>
                            <div className={ss.thumbnailHeader}>
                                <span className={ss.thumbnailTitle}>Thumbnail</span>
                                <div className={ss.thumbnailActions}>
                                    {videoType === 'local' && (
                                        <button 
                                            className={ss.thumbnailButton}
                                            onClick={handleSaveCurrentFrame}
                                            title="Save current frame as thumbnail"
                                        >
                                            <FaCamera style={{ marginRight: '6px', fontSize: '0.9rem' }} />
                                            Capture Frame
                                        </button>
                                    )}
                                    <button 
                                        className={ss.thumbnailButton}
                                        onClick={handleThumbnailUploadClick}
                                    >
                                        <FaImage style={{ marginRight: '6px', fontSize: '0.9rem' }} />
                                        Upload
                                    </button>
                                    <button 
                                        className={ss.thumbnailButton}
                                        onClick={toggleThumbnailUrlInput}
                                    >
                                        <FaEdit style={{ marginRight: '6px', fontSize: '0.9rem' }} />
                                        Enter URL
                                    </button>
                                    {thumbnail && (
                                        <button 
                                            className={ss.thumbnailButton}
                                            onClick={handleRemoveThumbnail}
                                        >
                                            <FaTimes style={{ marginRight: '6px', fontSize: '0.9rem' }} />
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {showThumbnailInput && (
                                <form onSubmit={handleThumbnailUrlSubmit} className={ss.thumbnailUrlForm}>
                                    <input
                                        type="text"
                                        value={customThumbnailUrl}
                                        onChange={handleThumbnailUrlChange}
                                        placeholder="Enter thumbnail image URL"
                                        className={ss.thumbnailUrlInput}
                                    />
                                    <button type="submit" className={ss.submitButton}>
                                        Submit
                                    </button>
                                </form>
                            )}
                            
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleThumbnailUpload}
                                className={ss.fileInput}
                            />
                            
                            {thumbnail && (
                                <div className={ss.thumbnailPreviewContainer}>
                                    <img 
                                        src={thumbnail.src} 
                                        alt="Video thumbnail" 
                                        className={ss.thumbnailPreview}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper function to format time
const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default VideoEditorModal; 