import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import ss from './DragDropHandler.module.css';

/**
 * 파일 드래그 앤 드롭 기능을 처리하는 컴포넌트
 * 
 * @param {Object} props
 * @param {Function} props.onFilesDrop - 파일이 드롭되었을 때 호출되는 콜백 함수
 * @param {Function} props.onTextDrop - 텍스트가 드롭되었을 때 호출되는 콜백 함수
 * @param {boolean} props.isActive - 드래그 앤 드롭 기능 활성화 여부
 * @returns {JSX.Element} - 드래그 앤 드롭 오버레이 컴포넌트
 */
const DragDropHandler = ({ onFilesDrop, onTextDrop, isActive = true }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // 드래그 앤 드롭 이벤트 리스너 등록
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    
    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isActive]);

  // 드래그 오버 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Jam 컴포넌트 내부에서의 드래그는 무시
    if (isJamComponent(e.target)) {
      return;
    }
    
    // 입력 필드에서의 드래그는 무시
    const isInputActive = 
      e.target.matches('input, textarea, [contenteditable="true"]') ||
      e.target.closest('input, textarea, [contenteditable="true"]');
    
    if (!isInputActive && isActive) {
      setIsDragging(true);
    }
  };

  // 드래그 리브 이벤트 핸들러
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 브라우저 창 밖으로 드래그된 경우에만 상태 변경
    if (e.clientX <= 0 || e.clientX >= window.innerWidth || 
        e.clientY <= 0 || e.clientY >= window.innerHeight) {
      setIsDragging(false);
    }
  };

  // 드롭 이벤트 핸들러
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (!isActive) return;
    
    // Jam 컴포넌트 내부에서의 드롭은 무시
    if (isJamComponent(e.target)) {
      return;
    }
    
    // 입력 필드에서의 드롭은 무시
    const isInputActive = 
      e.target.matches('input, textarea, [contenteditable="true"]') ||
      e.target.closest('input, textarea, [contenteditable="true"]');
    
    if (isInputActive) return;
    
    // 드롭된 파일 처리
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFilesDrop(files);
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      // 텍스트 데이터 처리
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'string') {
          e.dataTransfer.items[i].getAsString((text) => {
            onTextDrop(text);
          });
          break;
        }
      }
    }
  };

  // Jam 컴포넌트인지 확인하는 함수
  const isJamComponent = (element) => {
    // 요소 자체 또는 부모 요소 중에 Jam 관련 클래스가 있는지 확인
    const jamElement = element.closest('[class*="Jam"], [class*="jam"], [class*="sidebar"], [class*="Sidebar"], [class*="HyperlinkCard"]');
    return !!jamElement;
  };

  return (
    <>
      {isDragging && (
        <div className={ss.dragOverlay}>
          <div className={ss.dragOverlayContent}>
            <div className={ss.dragIcon}>
              <FaPlus size={48} />
            </div>
            <h2>Drop files here</h2>
            <p>Supports images, videos, audio, code files, and more</p>
          </div>
        </div>
      )}
    </>
  );
};

export default DragDropHandler; 