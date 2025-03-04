import React from 'react';
import ss from './ConnectionLine.module.css';

/**
 * 요소의 상하좌우 모서리에 연결점을 제공하는 컴포넌트
 * @param {Object} props
 * @param {Object} props.elementRef - 연결점을 추가할 요소의 ref
 * @param {Function} props.onAnchorPointDrag - 연결점 드래그 시 호출될 함수
 * @param {Function} props.onAnchorPointDrop - 연결점 드롭 시 호출될 함수
 * @param {string} props.id - 요소의 고유 ID
 */
const AnchorPoint = ({ 
    elementRef, 
    onAnchorPointDrag, 
    onAnchorPointDrop,
    id 
}) => {
    if (!elementRef || !elementRef.current) return null;

    // 요소의 위치와 크기 정보 가져오기
    const rect = elementRef.current.getBoundingClientRect();
    
    // 앵커 포인트 위치 계산
    const anchorPoints = [
        { position: 'top', x: rect.width / 2, y: 0 },
        { position: 'right', x: rect.width, y: rect.height / 2 },
        { position: 'bottom', x: rect.width / 2, y: rect.height },
        { position: 'left', x: 0, y: rect.height / 2 }
    ];

    const handleDragStart = (e, position) => {
        e.dataTransfer.setData('anchorPosition', position);
        e.dataTransfer.setData('sourceElementId', id);
        
        if (onAnchorPointDrag) {
            onAnchorPointDrag(id, position, {
                x: rect.left + (position === 'left' ? 0 : position === 'right' ? rect.width : rect.width / 2),
                y: rect.top + (position === 'top' ? 0 : position === 'bottom' ? rect.height : rect.height / 2)
            });
        }
    };

    return (
        <>
            {anchorPoints.map(({ position, x, y }) => (
                <div
                    key={`anchor-${id}-${position}`}
                    className={`${ss.anchorPoint} ${ss[position]}`}
                    style={{
                        left: position === 'left' || position === 'right' ? 
                            (position === 'left' ? -5 : rect.width - 5) : x - 5,
                        top: position === 'top' || position === 'bottom' ? 
                            (position === 'top' ? -5 : rect.height - 5) : y - 5,
                        // 항상 보이도록 opacity 설정
                        opacity: 0.7,
                        // 크기를 약간 줄여서 덜 방해되게 함
                        width: '8px',
                        height: '8px'
                    }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, position)}
                    onDragEnd={() => onAnchorPointDrop && onAnchorPointDrop()}
                />
            ))}
        </>
    );
};

export default AnchorPoint; 