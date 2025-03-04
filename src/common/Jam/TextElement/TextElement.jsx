import React, { useState, useEffect, useRef } from 'react';
import styles from './TextElement.module.css';

const TextElement = ({ 
  element, 
  isSelected, 
  scale, 
  viewportOffset, 
  isEditing, 
  onStartEditing, 
  onUpdate,
  onFinishEditing
}) => {
  const [text, setText] = useState(element.text || '');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // 요소 스타일 계산 - 캔버스 내부에서는 scale이 이미 적용되어 있으므로 여기서는 단순히 위치만 계산
  const style = {
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    minHeight: `${element.height}px`,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
    transformOrigin: 'center center',
    opacity: element.opacity !== undefined ? element.opacity / 100 : 1,
    zIndex: isSelected ? 2 : 1,
    color: element.fill || '#000000',
    fontSize: `${element.fontSize || 16}px`,
    fontFamily: element.fontFamily || 'Arial',
    textAlign: element.textAlign || 'left',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    backgroundColor: element.backgroundColor || 'transparent',
    border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.stroke || '#000000'}` : 'none',
    borderRadius: element.cornerRadius ? `${element.cornerRadius}px` : '0',
    padding: '4px'
  };

  // 텍스트 입력 스타일
  const textInputStyle = {
    fontSize: `${element.fontSize || 16}px`,
    fontFamily: element.fontFamily || 'Arial',
    textAlign: element.textAlign || 'left',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    color: element.fill || '#000000',
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    padding: '0',
    border: 'none',
    outline: 'none',
    resize: 'none',
    overflow: 'hidden'
  };

  // 텍스트 콘텐츠 스타일
  const textContentStyle = {
    fontSize: `${element.fontSize || 16}px`,
    fontFamily: element.fontFamily || 'Arial',
    textAlign: element.textAlign || 'left',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    color: element.fill || '#000000',
    width: '100%',
    height: '100%',
    padding: '0',
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  };

  // 컴포넌트 마운트 시 편집 모드라면 포커스
  useEffect(() => {
    if (isEditing && isSelected && textareaRef.current) {
      textareaRef.current.focus();
      // 커서를 텍스트 끝으로 이동
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, isSelected]);

  // 텍스트 변경 시 상태 업데이트
  useEffect(() => {
    setText(element.text || '');
  }, [element.text]);

  // 텍스트 변경 핸들러
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    // 실시간으로 텍스트 업데이트
    onUpdate({
      ...element,
      text: newText
    });

    // 자동 크기 조정
    adjustTextareaSize();
  };

  // 텍스트 영역 크기 자동 조정
  const adjustTextareaSize = () => {
    if (textareaRef.current && containerRef.current) {
      // 텍스트 영역 크기 계산
      const scrollWidth = textareaRef.current.scrollWidth;
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // 최소 크기 설정
      const minWidth = 100;
      const minHeight = 24;
      
      // 실제 크기 계산
      const actualWidth = Math.max(minWidth, scrollWidth);
      const actualHeight = Math.max(minHeight, scrollHeight);
      
      // 크기가 변경되었을 때만 업데이트
      if (Math.abs(actualWidth - element.width) > 1 || Math.abs(actualHeight - element.height) > 1) {
        onUpdate({
          ...element,
          width: actualWidth,
          height: actualHeight
        });
      }
    }
  };

  // 포커스 핸들러
  const handleFocus = () => {
    setIsFocused(true);
    if (onStartEditing) {
      onStartEditing(element);
    }
  };

  // 블러 핸들러
  const handleBlur = () => {
    setIsFocused(false);
    if (onFinishEditing) {
      onFinishEditing();
    }
  };

  // 키 입력 핸들러
  const handleKeyDown = (e) => {
    // Escape 키를 누르면 편집 종료
    if (e.key === 'Escape') {
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
      if (onFinishEditing) {
        onFinishEditing();
      }
    }
    
    // Enter + Shift가 아닌 Enter만 누르면 편집 완료
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
      if (onFinishEditing) {
        onFinishEditing();
      }
    }
    
    // 자동 크기 조정
    setTimeout(adjustTextareaSize, 0);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.textElement} ${isSelected ? styles.selected : ''}`}
      style={style}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEditing && onStartEditing(element);
      }}
    >
      {(isEditing && isSelected) || isFocused ? (
        <textarea
          ref={textareaRef}
          className={styles.textInput}
          value={text}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          autoFocus
          style={textInputStyle}
        />
      ) : (
        <div 
          className={styles.textContent}
          style={textContentStyle}
        >
          {text || '텍스트를 입력하세요'}
        </div>
      )}
    </div>
  );
};

export default TextElement; 