import React, { useState, useRef, useEffect } from 'react';
import ConnectionLine from './ConnectionLine';
import AnchorPoint from './AnchorPoint';

/**
 * 연결선을 관리하는 컴포넌트
 * @param {Object} props
 * @param {Array} props.elements - 연결할 요소들의 배열
 * @param {Array} props.initialConnections - 초기 연결 정보
 * @param {Function} props.onConnectionsChange - 연결 정보가 변경될 때 호출될 함수
 */
const ConnectionManager = ({ 
    elements = [], 
    initialConnections = [],
    onConnectionsChange
}) => {
    // 연결 정보 상태
    const [connections, setConnections] = useState(initialConnections);
    // 현재 드래그 중인 연결 정보
    const [draggingConnection, setDraggingConnection] = useState(null);
    // 컨테이너 ref
    const containerRef = useRef(null);
    // 요소 refs
    const elementRefs = useRef({});

    // 초기 연결 정보 설정
    useEffect(() => {
        setConnections(initialConnections);
    }, [initialConnections]);

    // 연결 정보 변경 시 콜백 호출
    useEffect(() => {
        if (onConnectionsChange) {
            // 이전 연결과 현재 연결이 다를 때만 콜백 호출
            const connectionsJSON = JSON.stringify(connections);
            const initialConnectionsJSON = JSON.stringify(initialConnections);
            
            if (connectionsJSON !== initialConnectionsJSON) {
                onConnectionsChange(connections);
            }
        }
    }, [connections, onConnectionsChange, initialConnections]);

    // 앵커 포인트 드래그 시작 핸들러
    const handleAnchorPointDrag = (elementId, position, point) => {
        setDraggingConnection({
            sourceId: elementId,
            sourcePosition: position,
            start: point,
            end: { x: point.x, y: point.y }
        });
    };

    // 앵커 포인트 드래그 종료 핸들러
    const handleAnchorPointDrop = () => {
        setDraggingConnection(null);
    };

    // 마우스 이동 핸들러
    const handleMouseMove = (e) => {
        if (draggingConnection) {
            const containerRect = containerRef.current.getBoundingClientRect();
            setDraggingConnection({
                ...draggingConnection,
                end: {
                    x: e.clientX - containerRect.left,
                    y: e.clientY - containerRect.top
                }
            });
        }
    };

    // 요소에 드롭 핸들러
    const handleDrop = (e, targetId) => {
        e.preventDefault();
        
        if (!draggingConnection) return;
        
        const sourcePosition = draggingConnection.sourcePosition;
        const sourceId = draggingConnection.sourceId;
        
        // 드롭된 위치에 따라 타겟 포지션 결정
        const targetRect = elementRefs.current[targetId].getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const dropX = e.clientX - containerRect.left;
        const dropY = e.clientY - containerRect.top;
        
        // 타겟 요소의 중심점
        const centerX = targetRect.left + targetRect.width / 2 - containerRect.left;
        const centerY = targetRect.top + targetRect.height / 2 - containerRect.top;
        
        // 드롭 위치와 중심점의 상대적 위치로 타겟 포지션 결정
        const dx = dropX - centerX;
        const dy = dropY - centerY;
        
        let targetPosition;
        if (Math.abs(dx) > Math.abs(dy)) {
            targetPosition = dx > 0 ? 'right' : 'left';
        } else {
            targetPosition = dy > 0 ? 'bottom' : 'top';
        }
        
        // 새 연결 생성
        const newConnection = {
            id: `conn-${sourceId}-${targetId}-${Date.now()}`,
            sourceId,
            targetId,
            sourcePosition,
            targetPosition,
            type: 'curved'
        };
        
        setConnections([...connections, newConnection]);
        setDraggingConnection(null);
    };

    // 드래그 오버 핸들러
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // 연결선 클릭 핸들러
    const handleConnectionClick = (connectionId) => {
        // 연결선 선택 또는 삭제 등의 기능 구현
        const updatedConnections = connections.filter(conn => conn.id !== connectionId);
        setConnections(updatedConnections);
    };

    // 연결선 렌더링
    const renderConnections = () => {
        return connections.map(connection => {
            const sourceElement = elements.find(el => el.id === connection.sourceId);
            const targetElement = elements.find(el => el.id === connection.targetId);
            
            if (!sourceElement || !targetElement) return null;
            
            const sourceRef = elementRefs.current[connection.sourceId];
            const targetRef = elementRefs.current[connection.targetId];
            
            if (!sourceRef || !targetRef) return null;
            
            const sourceRect = sourceRef.getBoundingClientRect();
            const targetRect = targetRef.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // 시작점과 끝점 계산
            let start = { x: 0, y: 0 };
            let end = { x: 0, y: 0 };
            
            // 소스 위치에 따른 시작점 계산
            const sourceLeft = sourceRect.left - containerRect.left;
            const sourceTop = sourceRect.top - containerRect.top;
            
            if (connection.sourcePosition === 'top') {
                start.x = sourceLeft + sourceRect.width / 2;
                start.y = sourceTop;
            } else if (connection.sourcePosition === 'right') {
                start.x = sourceLeft + sourceRect.width;
                start.y = sourceTop + sourceRect.height / 2;
            } else if (connection.sourcePosition === 'bottom') {
                start.x = sourceLeft + sourceRect.width / 2;
                start.y = sourceTop + sourceRect.height;
            } else if (connection.sourcePosition === 'left') {
                start.x = sourceLeft;
                start.y = sourceTop + sourceRect.height / 2;
            }
            
            // 타겟 위치에 따른 끝점 계산
            const targetLeft = targetRect.left - containerRect.left;
            const targetTop = targetRect.top - containerRect.top;
            
            if (connection.targetPosition === 'top') {
                end.x = targetLeft + targetRect.width / 2;
                end.y = targetTop;
            } else if (connection.targetPosition === 'right') {
                end.x = targetLeft + targetRect.width;
                end.y = targetTop + targetRect.height / 2;
            } else if (connection.targetPosition === 'bottom') {
                end.x = targetLeft + targetRect.width / 2;
                end.y = targetTop + targetRect.height;
            } else if (connection.targetPosition === 'left') {
                end.x = targetLeft;
                end.y = targetTop + targetRect.height / 2;
            }
            
            return (
                <ConnectionLine
                    key={connection.id}
                    start={start}
                    end={end}
                    type={connection.type || 'curved'}
                    startPosition={connection.sourcePosition}
                    endPosition={connection.targetPosition}
                    onClick={() => handleConnectionClick(connection.id)}
                />
            );
        });
    };

    // 드래그 중인 연결선 렌더링
    const renderDraggingConnection = () => {
        if (!draggingConnection) return null;
        
        return (
            <ConnectionLine
                start={draggingConnection.start}
                end={draggingConnection.end}
                type="curved"
                startPosition={draggingConnection.sourcePosition}
                endPosition="center"
            />
        );
    };

    return (
        <div 
            ref={containerRef}
            style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%',
                overflow: 'hidden'
            }}
            onMouseMove={handleMouseMove}
        >
            {/* 연결선 렌더링 */}
            {renderConnections()}
            {renderDraggingConnection()}
            
            {/* 요소 렌더링 */}
            {elements.map(element => (
                <div
                    key={element.id}
                    ref={ref => elementRefs.current[element.id] = ref}
                    style={{
                        position: 'absolute',
                        left: `${element.position.x}px`,
                        top: `${element.position.y}px`,
                        ...element.style
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, element.id)}
                >
                    {/* 앵커 포인트 */}
                    <AnchorPoint
                        elementRef={{ current: elementRefs.current[element.id] }}
                        id={element.id}
                        onAnchorPointDrag={handleAnchorPointDrag}
                        onAnchorPointDrop={handleAnchorPointDrop}
                    />
                    
                    {/* 요소 내용은 렌더링하지 않음 - 연결선 관리만 담당 */}
                </div>
            ))}
        </div>
    );
};

export default ConnectionManager; 