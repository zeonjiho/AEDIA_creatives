import React, { useState, useCallback } from 'react';
import styles from './Receipts.module.css';
import { receiptCategories, receiptTypes, receiptStatuses, paymentMethods } from '../../data/mockDatabase';
import { extractReceiptData, createImagePreview, revokeImagePreview } from '../../utils/ocrUtils';
import { FaUpload, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  handleInputChange, 
  handleSubmit, 
  modalMode,
  editingReceipt
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // 편집 모드일 때 기존 데이터로 폼 초기화
  React.useEffect(() => {
    if (modalMode === 'edit' && editingReceipt && isOpen) {
      // 각 필드별로 기존 데이터를 폼에 설정
      const fieldsToUpdate = [
        'date', 'title', 'amount', 'category', 'type', 
        'paymentMethod', 'description', 'status'
      ];
      
      fieldsToUpdate.forEach(field => {
        if (editingReceipt[field] !== undefined) {
          const fakeEvent = {
            target: {
              name: field,
              value: editingReceipt[field]
            }
          };
          handleInputChange(fakeEvent);
        }
      });

      // 기존 첨부파일이 있으면 미리보기 설정
      if (editingReceipt.attachment) {
        setPreviewUrl(editingReceipt.attachment);
      }
    }
  }, [modalMode, editingReceipt, isOpen, handleInputChange]);

  // 모달이 닫힐 때 상태 초기화
  React.useEffect(() => {
    if (!isOpen) {
      setOcrError(null);
      setFormErrors({});
      setIsProcessing(false);
      if (previewUrl && modalMode === 'add') {
        // 추가 모드일 때만 미리보기 URL 정리 (편집 모드에서는 기존 이미지일 수 있음)
        revokeImagePreview(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, modalMode, previewUrl]);

  // 파일 업로드 처리 + OCR 실행
  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      setOcrError('이미지 파일만 OCR 처리가 가능합니다.');
      return;
    }

    try {
      // 이전 미리보기 정리
      if (previewUrl) {
        revokeImagePreview(previewUrl);
      }

      // 새 미리보기 생성
      const preview = createImagePreview(file);
      setPreviewUrl(preview);

      // OCR 처리 시작
      setIsProcessing(true);
      setOcrError(null);
      
      console.log('OCR 처리 시작...');
      const extractedData = await extractReceiptData(file);
      console.log('OCR 처리 완료:', extractedData);
      
      // 추출된 데이터로 폼 업데이트 (제목과 설명은 제외)
      Object.entries(extractedData).forEach(([key, value]) => {
        // 제목과 설명은 업데이트하지 않음
        if (key !== 'title' && key !== 'description') {
          // 폼 데이터 업데이트를 위한 가상 이벤트 객체 생성
          const fakeEvent = {
            target: {
              name: key,
              value: value
            }
          };
          handleInputChange(fakeEvent);
        }
      });

      setIsProcessing(false);
    } catch (error) {
      console.error('OCR 처리 실패:', error);
      setOcrError(`영수증 인식에 실패했습니다: ${error.message}`);
      setIsProcessing(false);
    }
  }, [previewUrl, handleInputChange]);

  // 폼 제출 처리 및 유효성 검사
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const errors = {};
    if (!formData.title.trim()) {
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
    handleSubmit(formData);
    onClose();
  };

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
                disabled={isProcessing}
                className={styles.file_input}
              />
              <label htmlFor="attachment" className={styles.file_upload_button}>
                <FaUpload className={styles.upload_icon} />
                {previewUrl ? '다른 이미지 선택' : '영수증 이미지 업로드'}
              </label>
              <div className={styles.file_upload_hint}>
                영수증 이미지를 업로드하면 금액과 날짜 등이 자동으로 인식됩니다.
                <br />
                <b>제목과 설명은 직접 입력해 주세요.</b>
              </div>
            </div>
            
            {isProcessing && (
              <div className={styles.processing_indicator}>
                <div className={styles.spinner}></div>
                영수증 인식 중... 잠시 기다려주세요.
              </div>
            )}
            {ocrError && (
              <div className={styles.error_message}>
                <FaExclamationTriangle /> {ocrError}
              </div>
            )}
            {!isProcessing && previewUrl && (
              <div className={styles.image_preview}>
                <img src={previewUrl} alt="영수증 미리보기" />
                {!ocrError && <div className={styles.ocr_success}>
                  <FaCheckCircle /> 금액과 날짜가 인식되었습니다.
                </div>}
              </div>
            )}
          </div>
          
          <div className={styles.form_actions}>
            <button type="button" className={styles.cancel_button} onClick={onClose}>
              취소
            </button>
            <button type="submit" className={styles.submit_button} disabled={isProcessing}>
              {modalMode === 'add' ? '추가' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptModal; 