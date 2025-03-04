import React from 'react';
import ss from './ConnectionLine.module.css';

const ConnectionLine = React.memo(({ 
    start, 
    end, 
    selected, 
    onClick,
    color = '#000000',
    thickness = 2,
    style = 'solid', // 'solid', 'dashed', 'dotted'
    type = 'straight', // 'straight', 'curved'
    startPosition = 'center', // 'center', 'top', 'right', 'bottom', 'left'
    endPosition = 'center' // 'center', 'top', 'right', 'bottom', 'left'
}) => {
    // start나 end가 없으면 렌더링하지 않음
    if (!start || !end || !start.x || !start.y || !end.x || !end.y) {
        return null;
    }

    // 시작점과 끝점 사이의 각도 계산
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

    // 선 스타일 계산
    const borderStyle = style === 'dashed' ? '3px dashed' : 
                        style === 'dotted' ? '2px dotted' : 
                        `${thickness}px solid`;

    // 직선 연결
    if (type === 'straight') {
        return (
            <div
                className={`${ss.connectionLine} ${selected ? ss.selected : ''}`}
                style={{
                    left: `${start.x}px`,
                    top: `${start.y}px`,
                    width: `${length}px`,
                    transform: `rotate(${angle}rad)`,
                    transformOrigin: '0 50%',
                    borderTop: borderStyle,
                    borderColor: color
                }}
                onClick={onClick}
            />
        );
    }
    
    // 곡선 연결
    if (type === 'curved') {
        // 시작점과 끝점 사이의 중간점 계산
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        // 곡선의 제어점 계산 (수직 또는 수평 방향으로 곡선 생성)
        let controlPoint1, controlPoint2;
        
        // 시작점과 끝점의 위치에 따라 제어점 계산
        if (startPosition === 'top' && endPosition === 'top') {
            // 두 점이 모두 위쪽에 있는 경우
            controlPoint1 = `${start.x},${start.y - 50}`;
            controlPoint2 = `${end.x},${end.y - 50}`;
        } else if (startPosition === 'bottom' && endPosition === 'bottom') {
            // 두 점이 모두 아래쪽에 있는 경우
            controlPoint1 = `${start.x},${start.y + 50}`;
            controlPoint2 = `${end.x},${end.y + 50}`;
        } else if (startPosition === 'left' && endPosition === 'left') {
            // 두 점이 모두 왼쪽에 있는 경우
            controlPoint1 = `${start.x - 50},${start.y}`;
            controlPoint2 = `${end.x - 50},${end.y}`;
        } else if (startPosition === 'right' && endPosition === 'right') {
            // 두 점이 모두 오른쪽에 있는 경우
            controlPoint1 = `${start.x + 50},${start.y}`;
            controlPoint2 = `${end.x + 50},${end.y}`;
        } else if ((startPosition === 'top' && endPosition === 'right') || 
                   (startPosition === 'right' && endPosition === 'top')) {
            // 위쪽과 오른쪽 연결
            controlPoint1 = startPosition === 'top' ? `${start.x},${start.y - 30}` : `${start.x + 30},${start.y}`;
            controlPoint2 = endPosition === 'top' ? `${end.x},${end.y - 30}` : `${end.x + 30},${end.y}`;
        } else if ((startPosition === 'top' && endPosition === 'left') || 
                   (startPosition === 'left' && endPosition === 'top')) {
            // 위쪽과 왼쪽 연결
            controlPoint1 = startPosition === 'top' ? `${start.x},${start.y - 30}` : `${start.x - 30},${start.y}`;
            controlPoint2 = endPosition === 'top' ? `${end.x},${end.y - 30}` : `${end.x - 30},${end.y}`;
        } else if ((startPosition === 'bottom' && endPosition === 'right') || 
                   (startPosition === 'right' && endPosition === 'bottom')) {
            // 아래쪽과 오른쪽 연결
            controlPoint1 = startPosition === 'bottom' ? `${start.x},${start.y + 30}` : `${start.x + 30},${start.y}`;
            controlPoint2 = endPosition === 'bottom' ? `${end.x},${end.y + 30}` : `${end.x + 30},${end.y}`;
        } else if ((startPosition === 'bottom' && endPosition === 'left') || 
                   (startPosition === 'left' && endPosition === 'bottom')) {
            // 아래쪽과 왼쪽 연결
            controlPoint1 = startPosition === 'bottom' ? `${start.x},${start.y + 30}` : `${start.x - 30},${start.y}`;
            controlPoint2 = endPosition === 'bottom' ? `${end.x},${end.y + 30}` : `${end.x - 30},${end.y}`;
        } else if ((startPosition === 'left' && endPosition === 'right') || 
                   (startPosition === 'right' && endPosition === 'left')) {
            // 왼쪽과 오른쪽 연결
            controlPoint1 = `${start.x},${midY}`;
            controlPoint2 = `${end.x},${midY}`;
        } else if ((startPosition === 'top' && endPosition === 'bottom') || 
                   (startPosition === 'bottom' && endPosition === 'top')) {
            // 위쪽과 아래쪽 연결
            controlPoint1 = `${midX},${start.y}`;
            controlPoint2 = `${midX},${end.y}`;
        } else {
            // 기본 곡선 (중앙 연결)
            const isHorizontal = Math.abs(end.x - start.x) > Math.abs(end.y - start.y);
            controlPoint1 = isHorizontal ? `${midX},${start.y}` : `${start.x},${midY}`;
            controlPoint2 = isHorizontal ? `${midX},${end.y}` : `${end.x},${midY}`;
        }
        
        const pathData = `M${start.x},${start.y} C${controlPoint1} ${controlPoint2} ${end.x},${end.y}`;
        
        return (
            <svg 
                className={`${ss.curvedLine} ${selected ? ss.selected : ''}`} 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                }}
            >
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth={thickness}
                    strokeDasharray={style === 'dashed' ? '5,5' : style === 'dotted' ? '2,2' : 'none'}
                    onClick={onClick}
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                    className={selected ? ss.selectedPath : ''}
                />
            </svg>
        );
    }
    
    return null;
});

ConnectionLine.displayName = 'ConnectionLine';

export default ConnectionLine; 