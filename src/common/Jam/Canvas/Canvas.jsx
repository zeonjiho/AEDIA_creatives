import React, { useRef, useEffect, useState } from 'react';
import ss from './Canvas.module.css';
import TransformControl from '../TransformControl/TransformControl';
import ConnectionLine from '../ConnectionLine/ConnectionLine';
import TextElement from '../TextElement/TextElement';
import HyperlinkElement from './HyperlinkElement/HyperlinkElement';
import ConnectionManager from '../ConnectionLine/ConnectionManager';

const Canvas = ({
  workspaceRef,
  elements,
  connections,
  selectedElements,
  selectionBox,
  scale,
  viewportOffset,
  tool,
  backgroundStyle,
  isEditing,
  editingText,
  textInputRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  startEditing,
  handleElementUpdate,
  finishEditing,
  onDropCard,
  onConnectionsChange
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // 격자 오프셋 계산
  const gridOffset = {
    x: (viewportOffset.x % 20),
    y: (viewportOffset.y % 20)
  };

  // 쉬프트 키 감지
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 드롭 이벤트 핸들러
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDropIndicator(null);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const cardData = JSON.parse(data);
      if (!cardData) return;
      
      const rect = workspaceRef.current.getBoundingClientRect();
      // 드롭 위치 계산 개선
      const mouseX = (e.clientX - rect.left - viewportOffset.x) / scale;
      const mouseY = (e.clientY - rect.top - viewportOffset.y) / scale;
      
      if (onDropCard) {
        const adjustedCardData = {
          ...cardData,
          x: mouseX,
          y: mouseY,
          width: 250,
          height: 150
        };
        
        onDropCard(adjustedCardData);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // 드래그 오버 이벤트 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!isDragOver) {
      setIsDragOver(true);
    }
    
    const rect = workspaceRef.current.getBoundingClientRect();
    // 드롭 위치 계산 개선
    const mouseX = (e.clientX - rect.left - viewportOffset.x) / scale;
    const mouseY = (e.clientY - rect.top - viewportOffset.y) / scale;
    
    // 드롭 표시기 위치 계산 개선 - 캔버스 내부에서는 scale이 이미 적용되어 있음
    setDropIndicator({
      x: mouseX,
      y: mouseY,
      width: 250,
      height: 150
    });
  };
  
  // 드래그 리브 이벤트 핸들러
  const handleDragLeave = (e) => {
    // 실제로 워크스페이스를 벗어났는지 확인
    const rect = workspaceRef.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setIsDragOver(false);
      setDropIndicator(null);
    }
  };

  // 요소 렌더링 함수
  const renderElement = (element) => {
    const isSelected = selectedElements.includes(element);
    
    // 요소 위치 계산 개선
    // 캔버스 내부에서는 scale이 이미 적용되어 있으므로 여기서는 단순히 위치만 계산
    const style = {
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
      transformOrigin: 'center center', // 회전 중심점을 요소 중앙으로 설정
      opacity: element.opacity !== undefined ? element.opacity / 100 : 1,
      zIndex: isSelected ? 2 : 1
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${ss.rectangle} ${isSelected ? ss.selected : ''}`}
            style={{
              ...style,
              backgroundColor: element.fill,
              borderColor: element.stroke,
              borderWidth: `${element.strokeWidth}px`
            }}
          />
        );
      case 'ellipse':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${ss.ellipse} ${isSelected ? ss.selected : ''}`}
            style={{
              ...style,
              backgroundColor: element.fill,
              borderColor: element.stroke,
              borderWidth: `${element.strokeWidth}px`
            }}
          />
        );
      case 'triangle':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${isSelected ? ss.selected : ''}`}
            style={style}
          >
            <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
              <polygon
                points={element.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </div>
        );
      case 'polygon':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${isSelected ? ss.selected : ''}`}
            style={style}
          >
            <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
              <polygon
                points={element.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </div>
        );
      case 'star':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${isSelected ? ss.selected : ''}`}
            style={style}
          >
            <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
              <polygon
                points={element.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </div>
        );
      case 'heart':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${isSelected ? ss.selected : ''}`}
            style={style}
          >
            <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`}>
              <path
                d={element.pathData}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </div>
        );
      case 'text':
        return (
          <TextElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            scale={scale}
            viewportOffset={viewportOffset}
            isEditing={isEditing}
            onStartEditing={startEditing}
            onUpdate={handleElementUpdate}
            onFinishEditing={finishEditing}
          />
        );
      case 'image':
        return (
          <div
            key={element.id}
            className={`${ss.element} ${ss.image} ${isSelected ? ss.selected : ''} ${element.isLoading ? ss.loading : ''} ${element.error ? ss.error : ''}`}
            style={style}
          >
            <img
              src={element.src}
              alt="Uploaded"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onLoad={() => {
                handleElementUpdate({
                  ...element,
                  isLoading: false
                });
              }}
              onError={() => {
                handleElementUpdate({
                  ...element,
                  error: true,
                  isLoading: false
                });
              }}
            />
          </div>
        );
      case 'hyperlink':
        return (
          <HyperlinkElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            style={style}
          />
        );
      default:
        return null;
    }
  };

  // 연결선 렌더링 함수 수정
  const renderConnections = () => {
    if (!connections || connections.length === 0) return null;
    
    // ConnectionManager 컴포넌트를 사용하여 연결선 관리
    return (
      <ConnectionManager
        elements={elements.map(el => ({
          id: el.id,
          // content 속성 제거하고 필요한 정보만 전달
          position: {
            x: el.x,
            y: el.y
          },
          style: {
            width: el.width,
            height: el.height
          }
        }))}
        initialConnections={connections}
        onConnectionsChange={onConnectionsChange}
      />
    );
  };

  return (
    <div 
      ref={workspaceRef}
      className={`${ss.workspace} ${ss[backgroundStyle] || ''} ${isDragOver ? ss.dragOver : ''}`}
      style={{
        '--grid-offset-x': `${gridOffset.x}px`,
        '--grid-offset-y': `${gridOffset.y}px`,
        position: 'relative',
        overflow: 'hidden'
      }}
      data-tool={tool}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* 드롭 위치 표시기 */}
      {dropIndicator && (
        <div 
          className={ss.dropIndicator}
          style={{
            position: 'absolute',
            left: `${dropIndicator.x * scale + viewportOffset.x}px`,
            top: `${dropIndicator.y * scale + viewportOffset.y}px`,
            width: `${dropIndicator.width * scale}px`,
            height: `${dropIndicator.height * scale}px`,
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* 선택 상자 렌더링 */}
      {selectionBox && (
        <div
          className={ss.selectionBox}
          style={{
            position: 'absolute',
            left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
            width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}
      
      <div className={ss.canvasContainer}>
        <div
          className={ss.canvas}
          data-tool={tool}
          data-shift-pressed={isShiftPressed}
          style={{
            transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
            width: '100000px',
            height: '100000px'
          }}
        >
          {/* 연결선 렌더링 - 항상 보이도록 수정 */}
          {renderConnections()}
          
          {/* 모든 요소 렌더링 */}
          {elements.map(renderElement)}
          
          {/* 선택된 요소에 대한 변형 컨트롤 렌더링 */}
          {selectedElements.map(element => (
            <TransformControl
              key={`transform-${element.id}`}
              element={element}
              scale={scale}
              viewportOffset={viewportOffset}
              onUpdate={handleElementUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Canvas; 