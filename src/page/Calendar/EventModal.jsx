import React from 'react';
import styles from './EventModal.module.css';
import { FaTrash, FaTimes, FaCheck } from 'react-icons/fa';

/**
 * 이벤트 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {boolean} props.show - 모달 표시 여부
 * @param {Object} props.eventData - 이벤트 데이터
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onSave - 저장 함수
 * @param {Function} props.onDelete - 삭제 함수
 * @param {Function} props.onChange - 폼 변경 함수
 * @param {Function} props.onParticipantChange - 참석자 변경 함수
 * @param {Array} props.users - 사용자 목록
 * @param {Object} props.selectedEvent - 선택된 이벤트
 * @returns {JSX.Element}
 */
const EventModal = ({ 
  show, 
  eventData, 
  onClose, 
  onSave, 
  onDelete, 
  onChange, 
  onParticipantChange, 
  users, 
  selectedEvent 
}) => {
  if (!show) return null;

  // 컬러 태그 선택 핸들러
  const handleColorTagChange = (colorTag) => {
    onChange({
      target: {
        name: 'colorTag',
        value: colorTag
      }
    });
  };

  // 컬러 태그 배열 (1-10)
  const colorTags = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{selectedEvent ? '일정 수정' : '새 일정 추가'}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className={styles.formGroup}>
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={onChange}
              required
              placeholder="일정 제목"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="start">시작 시간</label>
              <input
                type="datetime-local"
                id="start"
                name="start"
                value={eventData.start}
                onChange={onChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="end">종료 시간</label>
              <input
                type="datetime-local"
                id="end"
                name="end"
                value={eventData.end}
                onChange={onChange}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="location">장소</label>
            <input
              type="text"
              id="location"
              name="location"
              value={eventData.location}
              onChange={onChange}
              placeholder="장소 (선택사항)"
            />
          </div>
          
          {/* 컬러 태그 선택 UI */}
          <div className={styles.formGroup}>
            <label>색상 태그</label>
            <div className={styles.colorTagSelector}>
              {colorTags.map(tag => (
                <div 
                  key={tag}
                  className={`${styles.colorTag} ${eventData.colorTag === tag ? styles.selectedColorTag : ''}`}
                  style={{ backgroundColor: `var(--color-tag-${tag})` }}
                  onClick={() => handleColorTagChange(tag)}
                >
                  {eventData.colorTag === tag && <FaCheck className={styles.colorTagCheck} />}
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>참석자</label>
            <div className={styles.participantsList}>
              {users.map(user => (
                <div 
                  key={user.id} 
                  className={`${styles.participantItem} ${eventData.participants.includes(user.id) ? styles.selected : ''}`}
                  onClick={() => onParticipantChange(user.id)}
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className={styles.participantAvatar}
                  />
                  <span className={styles.participantName}>{user.name}</span>
                  {eventData.participants.includes(user.id) && (
                    <FaCheck className={styles.checkIcon} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.formActions}>
            {selectedEvent && (
              <button 
                type="button" 
                className={styles.deleteButton}
                onClick={onDelete}
              >
                <FaTrash /> 삭제
              </button>
            )}
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={onClose}
            >
              취소
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
            >
              {selectedEvent ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal; 