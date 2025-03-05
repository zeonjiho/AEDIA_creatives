import React, { useRef, useEffect } from 'react';
import styles from './Widget.module.css';

/**
 * 위젯 컴포넌트 - 대시보드에 표시되는 개별 위젯의 기본 레이아웃을 제공합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 위젯 내부 콘텐츠
 * @param {string} props.title - 위젯 제목
 * @param {React.ReactNode} props.icon - 위젯 아이콘 (선택사항)
 * @param {string} props.footer - 위젯 푸터 텍스트 (선택사항)
 * @param {Function} props.onFooterClick - 푸터 클릭 이벤트 핸들러 (선택사항)
 * @param {string} props.className - 추가 CSS 클래스 (선택사항)
 * @returns {JSX.Element}
 */
const Widget = ({ 
  icon, 
  title, 
  children, 
  footerText, 
  onFooterClick, 
  className = '' 
}) => {
  const contentRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const widgetId = useRef(`widget-${Math.random().toString(36).substr(2, 9)}`);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const contentElement = e.target;
    if (contentElement) {
      contentElement.classList.add('scrolling');
      
      // 이전 타임아웃 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 3초 후에 scrolling 클래스 제거
      scrollTimeoutRef.current = setTimeout(() => {
        if (contentElement) {
          contentElement.classList.remove('scrolling');
        }
      }, 3000);
    }
  };
  
  // 컴포넌트 마운트 시 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const contentElement = contentRef.current;
    
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 타임아웃 정리
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${styles.widget} ${className}`} id={widgetId.current}>
      <div className={styles.widget_header}>
        {icon && <div className={styles.widget_icon}>{icon}</div>}
        <h3 className={styles.widget_title}>{title}</h3>
        <div className={styles.widget_drag_handle}></div>
      </div>
      
      <div className={styles.widget_content} ref={contentRef}>
        {children}
      </div>
      
      {footerText && (
        <div 
          className={styles.widget_footer} 
          onClick={onFooterClick}
        >
          {footerText}
        </div>
      )}
      
      <div className={styles.widget_resize_guides}>
        <div className={`${styles.resize_guide} ${styles.resize_guide_nw}`}></div>
        <div className={`${styles.resize_guide} ${styles.resize_guide_ne}`}></div>
        <div className={`${styles.resize_guide} ${styles.resize_guide_sw}`}></div>
        <div className={`${styles.resize_guide} ${styles.resize_guide_se}`}></div>
      </div>
    </div>
  );
};

export default Widget; 