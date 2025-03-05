import React from 'react';
import styles from './Widget.module.css';

/**
 * 위젯 컴포넌트 - 모든 대시보드 위젯의 기본 레이아웃을 제공합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 위젯 헤더에 표시될 아이콘
 * @param {string} props.title - 위젯 제목
 * @param {React.ReactNode} props.children - 위젯 내용
 * @param {string} props.footerText - 푸터 텍스트 (선택사항)
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
  return (
    <div className={`${styles.widget} ${className}`}>
      <div className={styles.widget_header}>
        {icon && <div className={styles.widget_icon}>{icon}</div>}
        <h2 className={styles.widget_title}>{title}</h2>
        <div className={styles.widget_drag_handle} />
      </div>
      
      <div className={styles.widget_content}>
        {children}
      </div>
      
      {(footerText || onFooterClick) && (
        <div 
          className={styles.widget_footer}
          onClick={onFooterClick}
        >
          {footerText}
        </div>
      )}
      
      {/* 리사이즈 가이드 */}
      <div className={styles.widget_resize_guides}>
        <div className={`${styles.resize_guide} ${styles.resize_guide_nw}`} />
        <div className={`${styles.resize_guide} ${styles.resize_guide_ne}`} />
        <div className={`${styles.resize_guide} ${styles.resize_guide_sw}`} />
        <div className={`${styles.resize_guide} ${styles.resize_guide_se}`} />
      </div>
    </div>
  );
};

export default Widget; 