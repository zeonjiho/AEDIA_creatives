import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './ImageUploader.module.css';
import ImageEditor from '../ImageEditor/ImageEditor';

const ImageUploader = ({ onImageSelect, onClose }) => {
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'clipboard', 'url'
  const [selectedImage, setSelectedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleImageLoad = (imageData) => {
    onImageSelect(imageData);
    // setSelectedImage(imageData);
    // setShowEditor(true);
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    
    reader.onload = () => {
      handleImageLoad(reader.result);
    };
    
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handlePasteEvent = (e) => {
      if (activeTab !== 'clipboard') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = () => {
            handleImageLoad(reader.result);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, [activeTab, handleImageLoad]);

  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const reader = new FileReader();
            reader.onload = () => {
              handleImageLoad(reader.result);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      
      const text = await navigator.clipboard.readText();
      if (text.match(/^(http(s)?:\/\/.*(jpg|jpeg|png|gif|webp))$/i)) {
        setUrlInput(text);
        setActiveTab('url');
        return;
      }
      
      alert('클립보드에서 이미지를 찾을 수 없습니다.');
    } catch (err) {
      console.error('클립보드 접근 에러:', err);
      alert('클립보드 접근에 실패했습니다. Ctrl+V를 사용해보세요.');
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        handleImageLoad(reader.result);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert('이미지 URL을 불러오는데 실패했습니다.');
    }
  };

  const handleEditorSave = (editedImage) => {
    onImageSelect(editedImage);
    setShowEditor(false);
    onClose();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  // if (showEditor && selectedImage) {
  //   return (
  //     <ImageEditor
  //       image={selectedImage}
  //       onSave={handleEditorSave}
  //       onClose={() => setShowEditor(false)}
  //       onRequestUpload={() => setShowEditor(false)}
  //     />
  //   );
  // }

  return (
    <>
      <div 
        className={styles.backdrop} 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div 
        className={`${styles.uploader} ImageUploader`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose}>Cancel</button>
          <h2>Upload Image</h2>
          <div style={{ width: 70 }}></div>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'clipboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('clipboard')}
          >
            Clipboard
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'url' ? styles.active : ''}`}
            onClick={() => setActiveTab('url')}
          >
            URL
          </button>
        </div>
        
        {activeTab === 'upload' && (
          <div {...getRootProps()} className={styles.dropzone}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the image here...</p>
            ) : (
              <div className={styles.uploadPrompt}>
                <svg className={styles.uploadIcon} viewBox="0 0 24 24">
                  <path d="M12 16l-4-4h3V4h2v8h3l-4 4zm9-13h-6v2h6v16H3V5h6V3H3c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <p>Drag and drop an image here<br />or click to select</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clipboard' && (
          <div className={styles.clipboardSection}>
            <button className={styles.pasteButton} onClick={handlePaste}>
              <svg className={styles.clipboardIcon} viewBox="0 0 24 24">
                <path d="M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
              </svg>
              Paste from Clipboard
            </button>
            <p className={styles.clipboardHint}>Press Ctrl+V or click the button above</p>
          </div>
        )}

        {activeTab === 'url' && (
          <form className={styles.urlForm} onSubmit={handleUrlSubmit}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter image URL"
              className={styles.urlInput}
            />
            <button type="submit" className={styles.urlButton}>Load Image</button>
          </form>
        )}
      </div>
    </>
  );
};

export default ImageUploader; 