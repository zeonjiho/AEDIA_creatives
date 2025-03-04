import React, { useState, useEffect, useRef, useCallback } from 'react';
import ss from './TransformControl.module.css';

const TransformControl = React.memo(({ element, onUpdate, scale, viewportOffset }) => {
    const controlRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState(null);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startDims, setStartDims] = useState({ width: 0, height: 0 });
    const [startRotation, setStartRotation] = useState(0);
    const [startAngle, setStartAngle] = useState(0);
    const [localElement, setLocalElement] = useState(element);
    const rafRef = useRef(null);
    const lastUpdateRef = useRef(null);
    const throttleTimeRef = useRef(16); // 16ms (약 60fps)로 조정
    const finalElementRef = useRef(null); // 마지막으로 업데이트된 요소 상태를 저장
    const [isShiftPressed, setIsShiftPressed] = useState(false); // 쉬프트 키 상태 추가

    // 컴포넌트가 마운트될 때 element 상태 초기화
    useEffect(() => {
        if (!isDragging) {
            setLocalElement(element);
            finalElementRef.current = element; // 초기 상태도 저장
        }
    }, [element, isDragging]);

    // 키보드 이벤트 리스너 추가
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

    // 각도 계산 함수 최적화
    const getAngle = useCallback((e) => {
        if (!controlRef.current) return 0;
        const rect = controlRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    }, []);

    // 각도를 15도 단위로 조정하는 함수
    const snapAngleTo15Degrees = useCallback((angle) => {
        return Math.round(angle / 15) * 15;
    }, []);

    const handleMouseDown = useCallback((e, type) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        setDragType(type);
        setStartPos({ x: e.clientX, y: e.clientY });
        setStartDims({ width: element.width, height: element.height });
        setStartRotation(element.rotation || 0);

        if (type === 'rotate') {
            setStartAngle(getAngle(e));
        }
        
        // 마우스 다운 시 현재 요소 상태 캡처
        lastUpdateRef.current = {
            timestamp: Date.now(),
            element: { ...element }
        };
    }, [element, getAngle]);

    const updateTransform = useCallback((e) => {
        if (!isDragging) return;

        // viewportOffset을 고려한 마우스 이동 거리 계산
        const dx = (e.clientX - (startPos?.x || 0)) / (scale || 1);
        const dy = (e.clientY - (startPos?.y || 0)) / (scale || 1);

        let updatedElement;

        if (dragType === 'rotate') {
            const currentAngle = getAngle(e);
            let deltaAngle = currentAngle - (startAngle || 0);
            
            // 쉬프트 키가 눌려있으면 15도 단위로 회전
            let newRotation;
            if (isShiftPressed) {
                newRotation = snapAngleTo15Degrees((startRotation || 0) + deltaAngle);
            } else {
                // 회전 각도를 정수로 반올림하여 미세한 떨림 방지
                newRotation = Math.round(((startRotation || 0) + deltaAngle) % 360);
            }
            
            updatedElement = {
                ...localElement,
                rotation: newRotation
            };
        } else {
            let newWidth = startDims?.width || 0;
            let newHeight = startDims?.height || 0;
            let newX = element?.x || 0;
            let newY = element?.y || 0;
            
            // 원래 비율 계산
            const aspectRatio = (startDims?.width || 1) / (startDims?.height || 1);

            switch (dragType) {
                case 'nw':
                    newWidth = Math.max(10, (startDims?.width || 0) - dx);
                    newHeight = Math.max(10, (startDims?.height || 0) - dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newWidth = newHeight * aspectRatio;
                        }
                    }
                    
                    newX = (element?.x || 0) + ((startDims?.width || 0) - newWidth);
                    newY = (element?.y || 0) + ((startDims?.height || 0) - newHeight);
                    break;
                case 'n':
                    newHeight = Math.max(10, (startDims?.height || 0) - dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        newWidth = newHeight * aspectRatio;
                        newX = (element?.x || 0) + ((startDims?.width || 0) - newWidth) / 2; // 중앙 기준으로 조정
                    }
                    
                    newY = (element?.y || 0) + ((startDims?.height || 0) - newHeight);
                    break;
                case 'ne':
                    newWidth = Math.max(10, (startDims?.width || 0) + dx);
                    newHeight = Math.max(10, (startDims?.height || 0) - dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newWidth = newHeight * aspectRatio;
                        }
                    }
                    
                    newY = (element?.y || 0) + ((startDims?.height || 0) - newHeight);
                    break;
                case 'w':
                    newWidth = Math.max(10, (startDims?.width || 0) - dx);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        newHeight = newWidth / aspectRatio;
                        newY = (element?.y || 0) + ((startDims?.height || 0) - newHeight) / 2; // 중앙 기준으로 조정
                    }
                    
                    newX = (element?.x || 0) + ((startDims?.width || 0) - newWidth);
                    break;
                case 'e':
                    newWidth = Math.max(10, (startDims?.width || 0) + dx);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        newHeight = newWidth / aspectRatio;
                        newY = (element?.y || 0) + ((startDims?.height || 0) - newHeight) / 2; // 중앙 기준으로 조정
                    }
                    break;
                case 'sw':
                    newWidth = Math.max(10, (startDims?.width || 0) - dx);
                    newHeight = Math.max(10, (startDims?.height || 0) + dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newWidth = newHeight * aspectRatio;
                        }
                    }
                    
                    newX = (element?.x || 0) + ((startDims?.width || 0) - newWidth);
                    break;
                case 's':
                    newHeight = Math.max(10, (startDims?.height || 0) + dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        newWidth = newHeight * aspectRatio;
                        newX = (element?.x || 0) + ((startDims?.width || 0) - newWidth) / 2; // 중앙 기준으로 조정
                    }
                    break;
                case 'se':
                    newWidth = Math.max(10, (startDims?.width || 0) + dx);
                    newHeight = Math.max(10, (startDims?.height || 0) + dy);
                    
                    // 쉬프트 키가 눌려있으면 비율 유지
                    if (isShiftPressed) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            newHeight = newWidth / aspectRatio;
                        } else {
                            newWidth = newHeight * aspectRatio;
                        }
                    }
                    break;
                default:
                    break;
            }

            // 좌표와 크기를 소수점 첫째 자리까지만 사용하여 미세한 떨림 방지
            updatedElement = {
                ...localElement,
                x: Math.round(newX * 10) / 10,
                y: Math.round(newY * 10) / 10,
                width: Math.round(newWidth * 10) / 10,
                height: Math.round(newHeight * 10) / 10
            };
        }

        setLocalElement(updatedElement);
        finalElementRef.current = updatedElement; // 마지막 상태 저장
        
        // 성능 최적화: 업데이트 빈도 제한
        const now = Date.now();
        if (!lastUpdateRef.current || now - lastUpdateRef.current.timestamp > throttleTimeRef.current) {
            onUpdate(updatedElement);
            lastUpdateRef.current = {
                timestamp: now,
                element: { ...updatedElement }
            };
        }
    }, [isDragging, dragType, startPos, startDims, startRotation, startAngle, element, localElement, scale, getAngle, onUpdate, isShiftPressed, snapAngleTo15Degrees]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        // 이전 애니메이션 프레임 취소
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        // 새 애니메이션 프레임 요청
        rafRef.current = requestAnimationFrame(() => {
            updateTransform(e);
        });
    }, [isDragging, updateTransform]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            // 드래그가 끝났을 때 최종 업데이트 전달
            if (finalElementRef.current) {
                // 최종 상태를 정리하여 전달 (소수점 처리)
                const finalElement = {
                    ...finalElementRef.current,
                    x: Math.round(finalElementRef.current.x * 10) / 10,
                    y: Math.round(finalElementRef.current.y * 10) / 10,
                    width: Math.round(finalElementRef.current.width * 10) / 10,
                    height: Math.round(finalElementRef.current.height * 10) / 10,
                    rotation: Math.round(finalElementRef.current.rotation || 0)
                };
                
                onUpdate(finalElement);
                // 마우스 업 후에도 로컬 상태를 최종 상태로 유지
                setLocalElement(finalElement);
            } else {
                // 최종 상태가 없는 경우 현재 로컬 상태 사용
                const roundedElement = {
                    ...localElement,
                    x: Math.round(localElement.x * 10) / 10,
                    y: Math.round(localElement.y * 10) / 10,
                    width: Math.round(localElement.width * 10) / 10,
                    height: Math.round(localElement.height * 10) / 10,
                    rotation: Math.round(localElement.rotation || 0)
                };
                
                onUpdate(roundedElement);
            }
            lastUpdateRef.current = null;
        }
        setIsDragging(false);
        setDragType(null);
        
        // 애니메이션 프레임 취소
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, [isDragging, localElement, onUpdate]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove, { passive: false, capture: true });
            window.addEventListener('mouseup', handleMouseUp, { passive: false, capture: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { passive: false, capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { passive: false, capture: true });
            
            // 컴포넌트 언마운트 시 애니메이션 프레임 취소
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // 현재 표시할 요소 결정 (드래깅 중이면 로컬 상태, 아니면 props에서 받은 상태)
    const displayElement = isDragging ? localElement : (finalElementRef.current || element);

    // 뷰포트 오프셋 적용 및 소수점 처리
    const positionWithOffset = {
        x: displayElement.x,
        y: displayElement.y,
        width: displayElement.width,
        height: displayElement.height
    };

    // 스케일에 따른 핸들 크기 조정 (스케일이 작을수록 핸들은 상대적으로 커짐)
    const scaleCompensation = scale ? 1 / scale : 1;
    
    return (
        <div 
            ref={controlRef}
            className={ss.TCTransformControl}
            style={{
                left: `${positionWithOffset.x}px`,
                top: `${positionWithOffset.y}px`,
                width: `${positionWithOffset.width}px`,
                height: `${positionWithOffset.height}px`,
                transform: `rotate(${displayElement.rotation || 0}deg)`,
                transformOrigin: 'center center',
                // 스케일 보상을 위한 스타일 추가
                '--scale-factor': scaleCompensation
            }}
        >
            <div className={ss.TCRotateLine}></div>
            <div className={ss.TCRotateHandle} onMouseDown={(e) => handleMouseDown(e, 'rotate')}></div>
            
            <div className={`${ss.TCTransformHandle} ${ss.nw}`} onMouseDown={(e) => handleMouseDown(e, 'nw')} />
            <div className={`${ss.TCTransformHandle} ${ss.n}`} onMouseDown={(e) => handleMouseDown(e, 'n')} />
            <div className={`${ss.TCTransformHandle} ${ss.ne}`} onMouseDown={(e) => handleMouseDown(e, 'ne')} />
            <div className={`${ss.TCTransformHandle} ${ss.w}`} onMouseDown={(e) => handleMouseDown(e, 'w')} />
            <div className={`${ss.TCTransformHandle} ${ss.e}`} onMouseDown={(e) => handleMouseDown(e, 'e')} />
            <div className={`${ss.TCTransformHandle} ${ss.sw}`} onMouseDown={(e) => handleMouseDown(e, 'sw')} />
            <div className={`${ss.TCTransformHandle} ${ss.s}`} onMouseDown={(e) => handleMouseDown(e, 's')} />
            <div className={`${ss.TCTransformHandle} ${ss.se}`} onMouseDown={(e) => handleMouseDown(e, 'se')} />
            
            {isDragging && dragType === 'rotate' && (
                <div className={`${ss.TCAngleIndicator} ${isShiftPressed ? ss.snapMode : ''}`}>
                    {Math.round(displayElement.rotation || 0)}°
                    {isShiftPressed && <span className={ss.TCSnapHint}>15° Snap</span>}
                </div>
            )}
            
            {isDragging && (
                <div className={`${ss.TCSizeIndicator} ${ss.TCBottomRight} ${isDragging ? ss.TCActiveDrag : ''}`}>
                    <span className={ss.TCSizeValue}>{Math.round(displayElement.width)}</span>
                    <span className={ss.TCSizeSeparator}>×</span>
                    <span className={ss.TCSizeValue}>{Math.round(displayElement.height)}</span>
                    <span className={ss.TCSizeUnit}>px</span>
                </div>
            )}
            
            {isDragging && dragType !== 'rotate' && isShiftPressed && (
                <div className={`${ss.TCAspectRatioHint} ${ss.TCNextToSize}`}>
                    Fixed Ratio
                </div>
            )}
        </div>
    );
});

export default TransformControl;