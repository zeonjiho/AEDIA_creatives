import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styles from './ReportForm.module.css';

const ReportForm = ({ isOpen, onClose, card, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef(null);

  const reportReasons = [
    '부적절한 콘텐츠',
    '스팸',
    '혐오 발언',
    '허위 정보',
    '저작권 침해',
    '기타'
  ];

  // 컴포넌트 마운트 시 상태 설정
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 디버깅 로그 추가
  useEffect(() => {
    console.log('ReportForm isOpen changed:', isOpen);
    if (isOpen) {
      console.log('ReportForm opened with card:', card);
    }
  }, [isOpen, card]);

  // body 스크롤 제어
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // 모달 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!reason) {
      newErrors.reason = '신고 이유를 선택해주세요';
    }
    
    if (!description || description.trim().length < 10) {
      newErrors.description = '신고 내용을 10자 이상 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        cardId: card?._id,
        reason,
        description
      });
      
      // 폼 초기화
      setReason('');
      setDescription('');
    }
  };

  // 모달이 마운트되지 않았으면 렌더링하지 않음
  if (!mounted) return null;

  return ReactDOM.createPortal(
    <div 
      className={`${styles.overlay} ${isOpen ? styles.visible : ''}`} 
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className={`${styles.reportForm} ${isOpen ? styles.visible : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>콘텐츠 신고하기</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="reportReason">신고 이유</label>
            <select
              id="reportReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={errors.reason ? styles.inputError : ''}
            >
              <option value="">신고 이유 선택</option>
              {reportReasons.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.reason && <p className={styles.errorText}>{errors.reason}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reportDescription">상세 설명</label>
            <textarea
              id="reportDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="신고 내용을 자세히 설명해주세요 (최소 10자)"
              rows={5}
              className={errors.description ? styles.inputError : ''}
            />
            {errors.description && <p className={styles.errorText}>{errors.description}</p>}
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              취소
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
            >
              신고하기
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ReportForm; 