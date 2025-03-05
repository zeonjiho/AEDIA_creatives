import React, { useState, useEffect } from 'react';
import styles from './EventModal.module.css';
import { FaTrash, FaTimes, FaCheck, FaMapMarkerAlt, FaUsers, FaClock } from 'react-icons/fa';
import { users } from '../../data/mockDatabase';

/**
 * 이벤트 모달 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Function} props.onSave - 저장 함수
 * @param {Function} props.onDelete - 삭제 함수 (선택적)
 * @param {Object} props.event - 수정할 이벤트 (선택적)
 * @param {Date} props.initialDate - 초기 날짜 (선택적)
 * @returns {JSX.Element}
 */
const EventModal = ({ onClose, onSave, onDelete, event, initialDate }) => {
  // 이벤트 상태 초기화
  const [eventData, setEventData] = useState({
    id: event?.id || null,
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || initialDate || new Date(),
    start: event?.start || initialDate || new Date(),
    end: event?.end || (initialDate ? new Date(initialDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000)),
    location: event?.location || '',
    participants: event?.participants || [],
    colorTag: event?.colorTag || 1,
    color: event?.color || 'var(--color-tag-1)'
  });

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 날짜 변경 핸들러
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      const newDate = new Date(value);
      const newStart = new Date(eventData.start);
      const newEnd = new Date(eventData.end);
      
      newStart.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      newEnd.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      
      setEventData(prev => ({
        ...prev,
        date: newDate,
        start: newStart,
        end: newEnd
      }));
    } else if (name === 'start' || name === 'end') {
      const [hours, minutes] = value.split(':').map(Number);
      const newTime = new Date(name === 'start' ? eventData.start : eventData.end);
      
      newTime.setHours(hours, minutes);
      
      setEventData(prev => ({
        ...prev,
        [name]: newTime
      }));
    }
  };

  // 참석자 변경 핸들러
  const handleParticipantChange = (userId) => {
    setEventData(prev => {
      const participants = [...prev.participants];
      const index = participants.indexOf(userId);
      
      if (index === -1) {
        participants.push(userId);
      } else {
        participants.splice(index, 1);
      }
      
      return {
        ...prev,
        participants
      };
    });
  };

  // 컬러 태그 선택 핸들러
  const handleColorTagChange = (colorTag) => {
    setEventData(prev => ({
      ...prev,
      colorTag,
      color: `var(--color-tag-${colorTag})`
    }));
  };

  // 저장 핸들러
  const handleSave = (e) => {
    e.preventDefault();
    onSave(eventData);
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (onDelete) {
      onDelete(eventData.id);
    }
  };

  // 컬러 태그 배열 (1-10)
  const colorTags = Array.from({ length: 10 }, (_, i) => i + 1);

  // 시간 포맷 함수
  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 날짜 포맷 함수 (YYYY-MM-DD)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{event ? '일정 수정' : '새 일정 추가'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSave} className={styles.modalContent}>
          {/* 제목 입력 */}
          <div className={styles.formGroup}>
            <input
              type="text"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              placeholder="일정 제목"
              className={styles.titleInput}
              required
            />
          </div>
          
          {/* 날짜 및 시간 입력 */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaClock /> 날짜
              </label>
              <input
                type="date"
                name="date"
                value={formatDate(eventData.date)}
                onChange={handleDateChange}
                className={styles.dateInput}
                required
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>시작 시간</label>
              <input
                type="time"
                name="start"
                value={formatTime(eventData.start)}
                onChange={handleDateChange}
                className={styles.timeInput}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>종료 시간</label>
              <input
                type="time"
                name="end"
                value={formatTime(eventData.end)}
                onChange={handleDateChange}
                className={styles.timeInput}
                required
              />
            </div>
          </div>
          
          {/* 장소 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaMapMarkerAlt /> 장소
            </label>
            <input
              type="text"
              name="location"
              value={eventData.location}
              onChange={handleChange}
              placeholder="장소"
              className={styles.input}
            />
          </div>
          
          {/* 설명 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>설명</label>
            <textarea
              name="description"
              value={eventData.description}
              onChange={handleChange}
              placeholder="일정에 대한 설명을 입력하세요"
              className={styles.textarea}
              rows={3}
            />
          </div>
          
          {/* 참석자 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaUsers /> 참석자
            </label>
            <div className={styles.participantsContainer}>
              {users.map(user => (
                <div 
                  key={user.id}
                  className={`${styles.participantItem} ${eventData.participants.includes(user.id) ? styles.selected : ''}`}
                  onClick={() => handleParticipantChange(user.id)}
                >
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className={styles.avatar}
                  />
                  <span>{user.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 색상 선택 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>색상</label>
            <div className={styles.colorTagsContainer}>
              {colorTags.map(tag => (
                <div
                  key={tag}
                  className={`${styles.colorTag} ${eventData.colorTag === tag ? styles.selectedColor : ''}`}
                  style={{ backgroundColor: `var(--color-tag-${tag})` }}
                  onClick={() => handleColorTagChange(tag)}
                />
              ))}
            </div>
          </div>
          
          {/* 버튼 영역 */}
          <div className={styles.modalFooter}>
            {onDelete && (
              <button 
                type="button" 
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                <FaTrash /> 삭제
              </button>
            )}
            
            <div className={styles.actionButtons}>
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
                <FaCheck /> 저장
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal; 