import React, { useState } from 'react';
import styles from './ReceiptModal.module.css';
import { receiptCategories, receiptTypes, receiptStatuses, paymentMethods } from '../../data/mockDatabase';
import { FaUpload, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  modalMode 
}) => {
  const [formErrors, setFormErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);

  // 파일 업로드 처리
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      return;
    }

    // 미리보기 URL 생성
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
  };

  // 폼 제출 처리 및 유효성 검사
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const errors = {};
    if (!formData.title?.trim()) {
      errors.title = '제목을 입력해주세요';
    }
    if (!formData.description?.trim()) {
      errors.description = '설명을 입력해주세요';
    }
    
    // 오류가 있으면 폼 제출 중단
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // 오류가 없으면 폼 제출
    handleSubmit(e);
  };

  // 컴포넌트 언마운트 시 리소스 정리
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  return (
    <div className={styles.modal_overlay}>
      <div className={`${styles.modal} ${styles.modal_mobile_fullscreen}`}>
        <div className={styles.modal_header}>
          <h2>{modalMode === 'add' ? '영수증 추가' : '영수증 편집'}</h2>
          <button className={styles.close_button} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className={styles.receipt_form}>
          <div className={styles.form_grid}>
            <div className={styles.form_column}>
              <div className={styles.form_group}>
                <label htmlFor="date">날짜</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className={styles.form_input}
                />
              </div>
              <div className={styles.form_group}>
                <label htmlFor="title">
                  제목 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => {
                    handleInputChange(e);
                    setFormErrors({...formErrors, title: ''});
                  }}
                  placeholder="영수증 제목을 입력하세요"
                  required
                  className={`${styles.form_input} ${formErrors.title ? styles.input_error : ''}`}
                />
                {formErrors.title && (
                  <div className={styles.error_text}>
                    <FaExclamationTriangle /> {formErrors.title}
                  </div>
                )}
              </div>
              <div className={styles.form_group}>
                <label htmlFor="amount">금액</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="금액을 입력하세요"
                  required
                  className={styles.form_input}
                />
              </div>
            </div>
            <div className={styles.form_column}>
              <div className={styles.form_group}>
                <label htmlFor="category">카테고리</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={styles.form_select}
                >
                  <option value="">카테고리 선택</option>
                  {receiptCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.form_group}>
                <label htmlFor="type">영수증 유형</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className={styles.form_select}
                >
                  {receiptTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.nameEn} ({type.name})</option>
                  ))}
                </select>
              </div>
              <div className={styles.form_group}>
                <label htmlFor="paymentMethod">결제 방법</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className={styles.form_select}
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className={styles.form_group} style={{gridColumn: "1 / span 2"}}>
            <label htmlFor="description">
              설명 <span className={styles.required}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) => {
                handleInputChange(e);
                setFormErrors({...formErrors, description: ''});
              }}
              placeholder="영수증에 대한 설명을 입력하세요"
              required
              className={`${styles.form_textarea} ${formErrors.description ? styles.input_error : ''}`}
              rows="3"
            />
            {formErrors.description && (
              <div className={styles.error_text}>
                <FaExclamationTriangle /> {formErrors.description}
              </div>
            )}
          </div>
          <div className={styles.form_group} style={{gridColumn: "1 / span 2"}}>
            <label htmlFor="status">상태</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className={styles.form_select}
            >
              {receiptStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.form_group} style={{gridColumn: "1 / span 2"}}>
            <label htmlFor="attachment">영수증 이미지</label>
            <div className={styles.file_upload_container}>
              <input
                type="file"
                id="attachment"
                name="attachment"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.file_input}
              />
              <label htmlFor="attachment" className={styles.file_upload_button}>
                <FaUpload className={styles.upload_icon} />
                {previewUrl ? '다른 이미지 선택' : '영수증 이미지 업로드'}
              </label>
              <div className={styles.file_upload_hint}>
                <b>제목과 설명은 반드시 직접 입력해 주세요.</b>
              </div>
            </div>
            {previewUrl && (
              <div className={styles.image_preview}>
                <img src={previewUrl} alt="영수증 미리보기" />
              </div>
            )}
          </div>
          <div className={styles.form_actions}>
            <button type="button" className={styles.cancel_button} onClick={onClose}>
              취소
            </button>
            <button type="submit" className={styles.submit_button}>
              {modalMode === 'add' ? '추가' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal; 