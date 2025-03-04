import React, { forwardRef, useCallback, useState, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { FaEyeDropper } from 'react-icons/fa';
import ss from './ColorPickerModal.module.css';
import { useClickOutside } from '../hooks/useClickOutside';

const ColorPickerModal = React.memo(forwardRef(({
    position,
    show = true,
    onClose,
    color = '#FFFFFF',
    onColorChange,
    opacity = 100,
    onOpacityChange,
    colorFormat = 'hex',
    onColorFormatChange,
    onOpenColorPicker
}, ref) => {
    const [currentColor, setCurrentColor] = useState(color);
    const [currentOpacity, setCurrentOpacity] = useState(opacity);
    const [currentFormat, setCurrentFormat] = useState(colorFormat);
    const modalRef = useRef(null);

    // ref 전달
    React.useImperativeHandle(ref, () => ({
        // 필요한 경우 여기에 메서드 추가
        getColor: () => currentColor,
        setColor: (color) => setCurrentColor(color)
    }));

    // 모달 외부 클릭 시 닫기
    useClickOutside(modalRef, onClose);

    const handleContentClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    const handleColorChange = useCallback((newColor) => {
        // 유효한 색상 형식인지 확인
        const isValidColor = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newColor);
        
        if (isValidColor) {
            setCurrentColor(newColor);
            if (onColorChange) {
                // 색상 변경 즉시 반영
                requestAnimationFrame(() => {
                    onColorChange(newColor);
                });
            }
        }
    }, [onColorChange]);

    const handleOpacityChange = useCallback((newOpacity) => {
        const value = parseInt(newOpacity, 10);
        if (!isNaN(value)) {
            const safeValue = Math.min(100, Math.max(0, value));
            setCurrentOpacity(safeValue);
            if (onOpacityChange) {
                // 투명도 변경 즉시 반영
                requestAnimationFrame(() => {
                    onOpacityChange(safeValue);
                });
            }
        }
    }, [onOpacityChange]);

    const handleFormatChange = (format) => {
        if (onColorFormatChange) {
            onColorFormatChange(format);
        }
    };

    // 스포이드 버튼 클릭 핸들러
    const handleEyeDropperClick = useCallback(() => {
        if (onOpenColorPicker) {
            onOpenColorPicker();
        }
    }, [onOpenColorPicker]);

    // 파스텔톤과 세련된 색상으로 프리셋 컬러 팔레트 업데이트 - 더 많은 색상 추가
    const presetColors = [
        // 파스텔톤
        '#FFD1DC', '#FFADAD', '#FFD6A5', '#FDFFB6', 
        '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', 
        
        // 세련된 색상
        '#264653', '#2A9D8F', '#E9C46A', '#F4A261', 
        '#E76F51', '#606C38', '#283618', '#001219', 
        
        // 중간 톤
        '#8ECAE6', '#219EBC', '#023047', '#FFB703', 
        '#FB8500', '#3D405B', '#81B29A', '#F2CC8F',
        
        // 기본 색상
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
        '#00FFFF', '#FF00FF', '#FFFFFF', '#000000'
    ];

    // 모달이 화면 밖으로 나가지 않도록 위치 조정 함수 추가
    const adjustPositionToViewport = (pos) => {
        if (!pos || typeof window === 'undefined') return pos;
        
        const modalWidth = 280;
        const modalHeight = 500; // 대략적인 모달 높이
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // x 좌표 조정 (왼쪽, 오른쪽 경계 확인)
        let adjustedX = Math.max(10, pos.x);
        adjustedX = Math.min(adjustedX, viewportWidth - modalWidth - 10);
        
        // y 좌표 조정 (위, 아래 경계 확인)
        let adjustedY = Math.max(10, pos.y);
        adjustedY = Math.min(adjustedY, viewportHeight - modalHeight - 10);
        
        return {
            x: adjustedX,
            y: adjustedY
        };
    };

    // position 객체가 유효한지 확인하고 화면 밖으로 나가지 않도록 조정
    const adjustedPosition = position && position.x !== undefined && position.y !== undefined
        ? adjustPositionToViewport(position)
        : {};

    const positionStyle = adjustedPosition && {
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`
    };

    if (!show) return null;

    return (
        <div 
            className={ss.colorPickerModal} 
            ref={modalRef}
            style={positionStyle}
            onClick={handleContentClick}
        >
            <div className={ss.colorPickerHeader}>
                <h3>Color Selection</h3>
                <button className={ss.closeButton} onClick={onClose}>
                    <span>×</span>
                </button>
            </div>
            
            <div className={ss.colorPickerContent}>
                <div className={ss.picker}>
                    <div 
                        className={ss.colorPreviewBox} 
                        style={{ backgroundColor: currentColor }}
                    ></div>
                    
                    <div className={ss.colorPickerWrapper}>
                        <HexColorPicker 
                            color={currentColor} 
                            onChange={handleColorChange}
                            className={ss.reactColorful}
                        />
                    </div>
                    
                    <div className={ss.controlsSection}>
                        <div className={ss.controlsTopRow}>
                            <button 
                                className={ss.eyedropperButton}
                                onClick={handleEyeDropperClick}
                                title="Pick color from screen"
                            >
                                <FaEyeDropper />
                            </button>
                            
                            <div className={ss.formatSelectorGroup}>
                                <button 
                                    className={`${ss.formatButton} ${colorFormat === 'hex' ? ss.activeFormatButton : ''}`} 
                                    onClick={() => handleFormatChange('hex')}
                                >
                                    HEX
                                </button>
                                <button 
                                    className={`${ss.formatButton} ${colorFormat === 'rgb' ? ss.activeFormatButton : ''}`} 
                                    onClick={() => handleFormatChange('rgb')}
                                >
                                    RGB
                                </button>
                                <button 
                                    className={`${ss.formatButton} ${colorFormat === 'hsl' ? ss.activeFormatButton : ''}`} 
                                    onClick={() => handleFormatChange('hsl')}
                                >
                                    HSL
                                </button>
                            </div>
                        </div>
                        
                        <div className={ss.hexInputWrapper}>
                            <input
                                type="text"
                                value={currentColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className={ss.hexInputField}
                            />
                        </div>
                        
                        {onOpacityChange && (
                            <div className={ss.opacityControlWrapper}>
                                <div className={ss.opacityLabelRow}>
                                    <label className={ss.opacityLabel}>Opacity</label>
                                    <div className={ss.opacityValueBox}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={currentOpacity}
                                            onChange={(e) => {
                                                const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                setCurrentOpacity(value);
                                                onOpacityChange(value);
                                            }}
                                            className={ss.opacityNumberInput}
                                        />
                                        <span className={ss.percentSymbol}>%</span>
                                    </div>
                                </div>
                                <div className={ss.opacitySliderWrapper}>
                                    <div 
                                        className={ss.opacityGradient} 
                                        style={{
                                            background: `linear-gradient(to right, transparent, ${currentColor})`
                                        }}
                                    ></div>
                                    <input
                                        className={ss.opacityRangeSlider}
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={currentOpacity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            setCurrentOpacity(value);
                                            onOpacityChange(value);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={ss.presetSection}>
                        <div className={ss.presetHeader}>
                            <span>Presets</span>
                        </div>
                        <div className={ss.presetColorsGrid}>
                            {presetColors.map((presetColor, index) => (
                                <button
                                    key={index}
                                    className={ss.presetColorButton}
                                    style={{ backgroundColor: presetColor }}
                                    onClick={() => handleColorChange(presetColor)}
                                    title={presetColor}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}));

ColorPickerModal.displayName = 'ColorPickerModal';

export default ColorPickerModal; 