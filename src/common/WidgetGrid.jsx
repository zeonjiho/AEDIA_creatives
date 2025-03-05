import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import styles from './WidgetGrid.module.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * 위젯 그리드 컴포넌트 - 대시보드의 위젯들을 그리드 레이아웃으로 배치합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 위젯 컴포넌트들
 * @param {string} props.className - 추가 CSS 클래스 (선택사항)
 * @param {number} props.columns - 그리드 열 개수 (기본값: 3)
 * @param {string} props.gap - 그리드 간격 (기본값: '20px')
 * @param {Object} props.layouts - 그리드 레이아웃 설정 (선택사항)
 * @param {Function} props.onLayoutChange - 레이아웃 변경 이벤트 핸들러 (선택사항)
 * @param {boolean} props.isCustomizeMode - 커스터마이징 모드 여부
 * @param {Function} props.onCustomizeModeChange - 커스터마이징 모드 변경 핸들러
 * @returns {JSX.Element}
 */
const WidgetGrid = ({ 
  children, 
  className = '', 
  columns = 3, 
  gap = '20px',
  layouts,
  onLayoutChange,
  isCustomizeMode = false,
  onCustomizeModeChange
}) => {
  // 초기 레이아웃 설정
  const [currentLayouts, setCurrentLayouts] = useState(layouts || {});
  const gridRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  // 스크롤 이벤트 핸들러
  const handleScroll = (e) => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.classList.add('scrolling');
      
      // 이전 타임아웃 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // 3초 후에 scrolling 클래스 제거
      scrollTimeoutRef.current = setTimeout(() => {
        if (gridElement) {
          gridElement.classList.remove('scrolling');
        }
      }, 3000);
    }
  };
  
  // 컴포넌트 마운트 시 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const gridElement = document.querySelector(`.${styles.widget_grid}`);
    
    if (gridElement) {
      gridElement.addEventListener('scroll', handleScroll);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 및 타임아웃 정리
    return () => {
      if (gridElement) {
        gridElement.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // 레이아웃 변경 핸들러
  const handleLayoutChange = (layout, layouts) => {
    setCurrentLayouts(layouts);
    if (onLayoutChange) {
      onLayoutChange(layouts);
    }
  };

  // 기본 레이아웃 생성 함수
  const generateDefaultLayouts = () => {
    const childrenArray = React.Children.toArray(children);
    const defaultLayout = {
      lg: childrenArray.map((child, index) => {
        const id = child.key || `widget-${index}`;
        // 3열 그리드에서의 위치 계산
        const x = index % columns;
        const y = Math.floor(index / columns);
        
        return {
          i: id,
          x: x,
          y: y,
          w: 1,
          h: 1,
          minW: 1,
          maxW: columns,
          minH: 1,
          maxH: 3
        };
      }),
      md: childrenArray.map((child, index) => {
        const id = child.key || `widget-${index}`;
        // 2열 그리드에서의 위치 계산
        const x = index % 2;
        const y = Math.floor(index / 2);
        
        return {
          i: id,
          x: x,
          y: y,
          w: 1,
          h: 1,
          minW: 1,
          maxW: 2,
          minH: 1,
          maxH: 3
        };
      }),
      sm: childrenArray.map((child, index) => {
        const id = child.key || `widget-${index}`;
        
        return {
          i: id,
          x: 0,
          y: index,
          w: 1,
          h: 1,
          minW: 1,
          maxW: 1,
          minH: 1,
          maxH: 3
        };
      }),
      xs: childrenArray.map((child, index) => {
        const id = child.key || `widget-${index}`;
        
        return {
          i: id,
          x: 0,
          y: index,
          w: 1,
          h: 1,
          minW: 1,
          maxW: 1,
          minH: 1,
          maxH: 3
        };
      })
    };
    
    return defaultLayout;
  };

  // 레이아웃 설정
  const gridLayouts = layouts || currentLayouts;
  const defaultLayouts = generateDefaultLayouts();
  const finalLayouts = gridLayouts.lg && gridLayouts.lg.length > 0 ? gridLayouts : defaultLayouts;
  
  // 그리드 설정
  const gridProps = {
    className: `${styles.widget_grid} ${className} ${isCustomizeMode ? styles.customize_mode : ''}`,
    layouts: finalLayouts,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 },
    cols: { lg: columns, md: 2, sm: 1, xs: 1 },
    rowHeight: 180,
    margin: [parseInt(gap), parseInt(gap)],
    containerPadding: [parseInt(gap), parseInt(gap)],
    onLayoutChange: handleLayoutChange,
    isDraggable: isCustomizeMode,
    isResizable: isCustomizeMode,
    resizeHandles: ['se', 'sw', 'ne', 'nw'],
    useCSSTransforms: true,
    compactType: 'vertical',
    style: { height: '100%', overflow: 'auto' }
  };

  return (
    <div ref={gridRef} className={styles.widget_grid_container}>
      <ResponsiveGridLayout 
        {...gridProps}
      >
        {React.Children.map(children, (child, index) => {
          const id = child.key || `widget-${index}`;
          return (
            <div key={id} className={styles.widget_grid_item}>
              <div className={`${styles.widget_resize_indicator} ${isCustomizeMode ? styles.active : ''}`}></div>
              {child}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

/**
 * 위젯 그리드 아이템 컴포넌트 - 개별 위젯의 크기와 위치를 지정합니다.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 위젯 컴포넌트
 * @param {string} props.className - 추가 CSS 클래스 (선택사항)
 * @param {string} props.id - 위젯 고유 ID (선택사항)
 * @param {Function} props.onCustomizeModeChange - 커스터마이징 모드 변경 핸들러
 * @returns {JSX.Element}
 */
export const WidgetGridItem = ({ 
  children, 
  className = '',
  id,
  onCustomizeModeChange
}) => {
  const [pressTimer, setPressTimer] = useState(null);
  const headerRef = useRef(null);

  // 위젯 헤더 길게 누르기 이벤트 핸들러
  const handleHeaderMouseDown = () => {
    const timer = setTimeout(() => {
      if (onCustomizeModeChange) {
        onCustomizeModeChange(true);
      }
    }, 3000); // 3초 동안 누르고 있으면 커스터마이징 모드 활성화
    
    setPressTimer(timer);
  };

  const handleHeaderMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }, [pressTimer]);

  // 위젯 헤더 요소 찾기
  useEffect(() => {
    if (headerRef.current) {
      const header = headerRef.current.querySelector('.widget-header');
      if (header) {
        header.addEventListener('mousedown', handleHeaderMouseDown);
        header.addEventListener('mouseup', handleHeaderMouseUp);
        header.addEventListener('mouseleave', handleHeaderMouseUp);
        
        // 터치 이벤트 추가 (모바일 지원)
        header.addEventListener('touchstart', handleHeaderMouseDown);
        header.addEventListener('touchend', handleHeaderMouseUp);
        header.addEventListener('touchcancel', handleHeaderMouseUp);
        
        return () => {
          header.removeEventListener('mousedown', handleHeaderMouseDown);
          header.removeEventListener('mouseup', handleHeaderMouseUp);
          header.removeEventListener('mouseleave', handleHeaderMouseUp);
          header.removeEventListener('touchstart', handleHeaderMouseDown);
          header.removeEventListener('touchend', handleHeaderMouseUp);
          header.removeEventListener('touchcancel', handleHeaderMouseUp);
        };
      }
    }
  }, []);

  return (
    <div ref={headerRef} className={`${styles.widget_grid_item_content} ${className}`}>
      {children}
    </div>
  );
};

export default WidgetGrid; 