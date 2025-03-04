import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUpload, faGlobe, faLock } from '@fortawesome/free-solid-svg-icons';
import ss from './CreateCollectionModal.module.css';
import ImageUploader from '../../Images/ImageUploader/ImageUploader';
import ImageEditor from '../../Images/ImageEditor/ImageEditor';
import { jwtDecode } from 'jwt-decode';
import api from '../../../util/api';
import { useNavigate } from 'react-router-dom';

const CreateCollectionModal = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
    thumbnail: null,
    thumbnailUrl: null
  });
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // API 호출 및 컬렉션 생성 로직
    onCreated({
      id: Date.now(),
      ...formData,
      count: 0
    });
  };

  const handleImageSelect = (imageData) => {
    setSelectedImage(imageData);
    setShowImageUploader(false);
    setShowImageEditor(true);
  };

  const handleSaveEditedImage = (editedImage) => {
    try {
      if (!editedImage || !editedImage.url) {
        console.error('편집된 이미지 데이터가 없습니다');
        return;
      }

      // 먼저 모달을 닫고
      setShowImageEditor(false);
      setSelectedImage(null);

      // 약간의 지연 후 상태 업데이트
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          thumbnail: editedImage.blob,
          thumbnailUrl: editedImage.url
        }));
      }, 100);

    } catch (error) {
      console.error('이미지 저장 중 오류:', error);
    }
  };

  const handleRequestNewUpload = () => {
    setShowImageEditor(false);
    setShowImageUploader(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!formData.thumbnailUrl) {
      return
    }
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    const userId = jwtDecode(localStorage.getItem('token')).userId
    if (!userId) {
      return
    }

    try {
      // 썸네일 이미지가 있다면 먼저 업로드
      let thumbnailFilename = null;
      let thumbnailRatio = null;
      if (formData.thumbnailUrl) {
        // 이미지 비율 계산을 위한 Image 객체 생성
        const img = new Image();
        img.src = formData.thumbnailUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            thumbnailRatio = img.width / img.height;
            resolve();
          };
        });

        // Base64 데이터를 File 객체로 변환
        const response = await fetch(formData.thumbnailUrl);
        const blob = await response.blob();
        const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });

        const formDataToOnlyImage = new FormData();
        formDataToOnlyImage.append('thumbnail', file);

        const thumbnailResponse = await api.post('/upload-thumbnail', formDataToOnlyImage, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (thumbnailResponse.data.filename) {
          thumbnailFilename = thumbnailResponse.data.filename;
        }
      }

      const requestData = {
        userId,
        title: formData.name,
        isPublic: formData.isPublic,
        dataType: 'collection',
        description: formData.description,
        thumbnail: thumbnailFilename,
      }

      if (thumbnailRatio) {
        requestData.thumbnailRatio = thumbnailRatio;
      }

      const response = await api.post('/add-hyperlink', requestData)
      if (response.status === 200) {
        onClose()
      } else {
        console.error('Failed to save:', response.data)
      }
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  if (!isOpen) return null;

  return (
    <div className={ss.overlay} onClick={onClose}>
      <div className={ss.modal} onClick={e => e.stopPropagation()}>
        {showImageEditor && selectedImage && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2500 }}>
            <ImageEditor
              image={selectedImage}
              onSave={handleSaveEditedImage}
              onClose={() => {
                setShowImageEditor(false);
                setSelectedImage(null);
              }}
              onRequestUpload={() => {
                setShowImageEditor(false);
                setSelectedImage(null);
                setShowImageUploader(true);
              }}
            />
          </div>
        )}

        {showImageUploader && (
          <ImageUploader
            onImageSelect={handleImageSelect}
            onClose={() => {
              setShowImageUploader(false);
            }}
          />
        )}

        <header className={ss.header}>
          <h2 className={ss.title}>Create Collection</h2>
          <button className={ss.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <form onSubmit={handleAdd} className={ss.form}>
          <div className={ss.thumbnailUpload} onClick={() => setShowImageUploader(true)}>
            <div className={ss.uploadLabel}>
              {formData.thumbnailUrl ? (
                <img
                  src={formData.thumbnailUrl}
                  alt="Thumbnail preview"
                  className={ss.thumbnailPreview}
                />
              ) : (
                <>
                  <FontAwesomeIcon icon={faUpload} />
                  <span>Upload Thumbnail</span>
                </>
              )}
            </div>
          </div>

          <div className={ss.inputGroup}>
            <input
              type="text"
              placeholder="Collection name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={ss.input}
            />
          </div>

          <div className={ss.inputGroup}>
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={ss.textarea}
            />
          </div>

          <div className={ss.visibilityToggle}>
            <button
              type="button"
              className={`${ss.visibilityButton} ${formData.isPublic ? ss.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: true })}
            >
              <FontAwesomeIcon icon={faGlobe} />
              Public
            </button>
            <button
              type="button"
              className={`${ss.visibilityButton} ${!formData.isPublic ? ss.active : ''}`}
              onClick={() => setFormData({ ...formData, isPublic: false })}
            >
              <FontAwesomeIcon icon={faLock} />
              Private
            </button>
          </div>

          <button
            type="submit"
            className={ss.submitButton}
            disabled={!formData.name.trim()}
          >
            Create Collection
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal; 