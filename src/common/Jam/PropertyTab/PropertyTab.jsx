import React, { useState, useRef, useEffect, useCallback } from 'react';
import ss from './PropertyTab.module.css';
import { HexColorPicker } from 'react-colorful';
import {
    FaAlignLeft, FaAlignCenter, FaAlignRight,
    FaAlignJustify, FaExpandAlt, FaCompressAlt,
    FaUndo, FaRedo, FaLayerGroup, FaEye,
    FaChevronDown, FaChevronRight, FaPlus,
    FaPalette, FaFillDrip, FaMagic, FaEyeDropper,
    FaBold, FaItalic, FaUnderline
} from 'react-icons/fa';
import { BiMoveVertical, BiMoveHorizontal } from 'react-icons/bi';
import useClickOutside from '../hooks/useClickOutside';
import ColorPickerModal from '../ColorPickerModal/ColorPickerModal';

const PropertyTab = React.memo(({ selectedElements, onUpdate, onOpenColorPicker }) => {
    const [mounted, setMounted] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        position: true,
        autoLayout: true,
        appearance: true,
        fill: false,
        stroke: false,
        effects: false,
        text: false
    });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColorType, setActiveColorType] = useState(null);
    const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
    const colorPickerRef = useRef(null);
    const colorPreviewRef = useRef(null);
    const [colorFormat, setColorFormat] = useState('hex');
    const [opacity, setOpacity] = useState(100);

    // Component animation effect on mount
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleInputChange = useCallback((propertyName, value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        requestAnimationFrame(() => {
            const element = selectedElements[0];
            
            // Number value processing
            if (['opacity', 'strokeWidth', 'width', 'height', 'x', 'y', 'rotation', 'fontSize', 'cornerRadius'].includes(propertyName)) {
                const numValue = Number(value);
                const safeValue = isNaN(numValue) ? 0 : numValue;
                
                // Apply restrictions to specific properties
                let finalValue = safeValue;
                if (propertyName === 'opacity') {
                    finalValue = Math.min(100, Math.max(0, safeValue));
                } else if (propertyName === 'strokeWidth' || propertyName === 'cornerRadius') {
                    finalValue = Math.max(0, safeValue);
                } else if (propertyName === 'rotation') {
                    finalValue = safeValue % 360;
                }
                
                onUpdate({
                    ...element,
                    [propertyName]: finalValue
                });
            } else {
                // Text value processing
                onUpdate({
                    ...element,
                    [propertyName]: value
                });
            }
        });
    }, [onUpdate, selectedElements]);

    const handleColorChange = useCallback((color) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        requestAnimationFrame(() => {
            const element = selectedElements[0];
            if (activeColorType === 'fill') {
                onUpdate({
                    ...element,
                    fill: color,
                    fillOpacity: (opacity || 100) / 100
                });
            } else if (activeColorType === 'stroke') {
                onUpdate({
                    ...element,
                    stroke: color,
                    strokeOpacity: (opacity || 100) / 100
                });
            } else if (activeColorType === 'textColor' && element.type === 'text') {
                onUpdate({
                    ...element,
                    fill: color,
                    fillOpacity: (opacity || 100) / 100
                });
            } else if (activeColorType === 'backgroundColor') {
                onUpdate({
                    ...element,
                    backgroundColor: color,
                    backgroundOpacity: (opacity || 100) / 100
                });
            }
        });
    }, [activeColorType, selectedElements, opacity, onUpdate]);

    const openColorPicker = (type, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        
        // 방법 1: 더 많이 왼쪽으로 이동
        setColorPickerPosition({
            x: rect.left - 400, // 더 많이 왼쪽으로 이동
            y: rect.top
        });
        
        // 방법 2: 화면 너비를 고려하여 위치 조정
        // const modalWidth = 280; // 컬러피커 모달의 너비
        // setColorPickerPosition({
        //     x: Math.max(10, rect.left - modalWidth - 20), // 모달 너비와 여백 고려
        //     y: rect.top
        // });
        
        // 방법 3: 완전히 다른 위치에 배치
        // setColorPickerPosition({
        //     x: 10, // 화면 왼쪽에 고정
        //     y: rect.top
        // });
        
        setActiveColorType(type);
        setShowColorPicker(true);
    };

    const handleColorPickerClick = useCallback((type, e) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        if (onOpenColorPicker) {
            const currentElement = selectedElements[0];
            const rect = e.currentTarget.getBoundingClientRect();
            onOpenColorPicker(type, {
                x: rect.left - 300,
                y: rect.bottom + 5
            }, type === 'fill' ? currentElement.fill : currentElement.stroke);
        } else {
            openColorPicker(type, e);
        }
    }, [selectedElements, onOpenColorPicker]);

    useEffect(() => {
        if (!showColorPicker || !colorPreviewRef.current) return;
        
        const rect = colorPreviewRef.current.getBoundingClientRect();
        const updatePosition = () => {
            setColorPickerPosition({
                x: rect.left - 240,
                y: rect.top
            });
        };
        requestAnimationFrame(updatePosition);
    }, [showColorPicker]);

    useClickOutside(colorPickerRef, useCallback(() => {
        if (showColorPicker) {
            setShowColorPicker(false);
        }
    }, [showColorPicker]));

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handlePositionChange = (field, value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        onUpdate({
            ...element,
            [field]: numValue
        });
    };

    const handleRotationChange = (value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        onUpdate({
            ...element,
            rotation: numValue
        });
    };

    const handleOpacityChange = (value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        onUpdate({
            ...element,
            opacity: Math.min(100, Math.max(0, numValue))
        });
    };

    const handleCornerRadiusChange = (value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        onUpdate({
            ...element,
            cornerRadius: Math.max(0, numValue)
        });
    };

    const handleStrokeWidthChange = (value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        onUpdate({
            ...element,
            strokeWidth: Math.max(0, numValue)
        });
    };

    const handleEffectChange = (effect, value) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        const element = selectedElements[0];
        onUpdate({
            ...element,
            effects: {
                ...element.effects,
                [effect]: value
            }
        });
    };

    const handleElementUpdate = (updatedElement) => {
        if (!selectedElements || selectedElements.length === 0) return;
        
        onUpdate(updatedElement);
    };

    // If no elements are selected, display an empty screen
    if (!selectedElements || selectedElements.length === 0) {
        return (
            <div className={`${ss.container} ${mounted ? ss.mounted : ''}`}>
                <div className={ss.emptyState}>
                    Select an element to edit its properties
                </div>
            </div>
        );
    }

    // First selected element
    const element = selectedElements[0];

    return (
        <div className={`${ss.container} ${mounted ? ss.mounted : ''}`}>
            {/* Position section */}
            <div className={ss.section}>
                <div className={ss.sectionHeader} onClick={() => toggleSection('position')}>
                    <h3>Position</h3>
                    {expandedSections.position ? <FaChevronDown /> : <FaChevronRight />}
                </div>
                {expandedSections.position && (
                    <>
                        <div className={ss.alignmentTools}>
                            <button><FaAlignLeft /></button>
                            <button><FaAlignCenter /></button>
                            <button><FaAlignRight /></button>
                            <button><FaAlignJustify /></button>
                            <button><BiMoveVertical /></button>
                            <button><BiMoveHorizontal /></button>
                        </div>
                        <div className={ss.positionInputs}>
                            <div className={ss.inputGroup}>
                                <label>X</label>
                                <input
                                    type="number"
                                    value={element.x || 0}
                                    onChange={(e) => handleInputChange('x', e.target.value)}
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div className={ss.inputGroup}>
                                <label>Y</label>
                                <input
                                    type="number"
                                    value={element.y || 0}
                                    onChange={(e) => handleInputChange('y', e.target.value)}
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div className={ss.inputGroup}>
                                <label>Rotation</label>
                                <input
                                    type="number"
                                    value={element.rotation || 0}
                                    onChange={(e) => handleInputChange('rotation', e.target.value)}
                                    min={0}
                                    max={360}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Auto Layout section */}
            <div className={ss.section}>
                <div className={ss.sectionHeader} onClick={() => toggleSection('autoLayout')}>
                    <h3>Auto layout</h3>
                    {expandedSections.autoLayout ? <FaChevronDown /> : <FaChevronRight />}
                </div>
                {expandedSections.autoLayout && (
                    <div className={ss.autoLayoutContent}>
                        <div className={ss.inputGroup}>
                            <label>W</label>
                            <input
                                type="number"
                                value={element.width || 0}
                                onChange={(e) => handleInputChange('width', e.target.value)}
                                min={0}
                                max={2000}
                            />
                        </div>
                        <div className={ss.inputGroup}>
                            <label>H</label>
                            <input
                                type="number"
                                value={element.height || 0}
                                onChange={(e) => handleInputChange('height', e.target.value)}
                                min={0}
                                max={2000}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Shape section - Display only for shape elements */}
            {element.type === 'shape' && (
                <div className={ss.section}>
                    <div className={ss.sectionHeader} onClick={() => toggleSection('appearance')}>
                        <h3>Shape</h3>
                        {expandedSections.appearance ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                    {expandedSections.appearance && (
                        <div className={ss.appearanceContent}>
                            <div className={ss.inputGroup}>
                                <label>Corner radius</label>
                                <input
                                    type="number"
                                    value={element.cornerRadius || 0}
                                    onChange={(e) => handleInputChange('cornerRadius', e.target.value)}
                                    min={0}
                                    max={100}
                                />
                            </div>
                            <div className={ss.inputGroup}>
                                <label>Opacity</label>
                                <input
                                    type="number"
                                    value={element.opacity || 100}
                                    onChange={(e) => handleInputChange('opacity', e.target.value)}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fill section */}
            <div className={ss.section}>
                <div className={ss.sectionHeader} onClick={() => toggleSection('fill')}>
                    <h3>Fill</h3>
                    {expandedSections.fill ? <FaChevronDown /> : <FaChevronRight />}
                </div>
                {expandedSections.fill && (
                    <div className={ss.fillContent}>
                        <div className={ss.inputGroup}>
                            <label>Color</label>
                            <div 
                                className={ss.colorPreview}
                                style={{ backgroundColor: element.fill || '#FFFFFF' }}
                                onClick={(e) => handleColorPickerClick('fill', e)}
                            ></div>
                        </div>
                        <div className={ss.inputGroup}>
                            <label>Opacity</label>
                            <input
                                type="number"
                                value={element.fillOpacity ? Math.round(element.fillOpacity * 100) : 100}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    const safeValue = isNaN(value) ? 100 : Math.min(100, Math.max(0, value));
                                    onUpdate({
                                        ...element,
                                        fillOpacity: safeValue / 100
                                    });
                                }}
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stroke section */}
            <div className={ss.section}>
                <div className={ss.sectionHeader} onClick={() => toggleSection('stroke')}>
                    <h3>Stroke</h3>
                    {expandedSections.stroke ? <FaChevronDown /> : <FaChevronRight />}
                </div>
                {expandedSections.stroke && (
                    <div className={ss.strokeContent}>
                        <div className={ss.inputGroup}>
                            <label>Color</label>
                            <div 
                                className={ss.colorPreview}
                                style={{ backgroundColor: element.stroke || '#000000' }}
                                onClick={(e) => handleColorPickerClick('stroke', e)}
                            ></div>
                        </div>
                        <div className={ss.inputGroup}>
                            <label>Thickness</label>
                            <input
                                type="number"
                                value={element.strokeWidth || 0}
                                onChange={(e) => handleInputChange('strokeWidth', e.target.value)}
                                min={0}
                                max={20}
                            />
                        </div>
                        <div className={ss.inputGroup}>
                            <label>Opacity</label>
                            <input
                                type="number"
                                value={element.strokeOpacity ? Math.round(element.strokeOpacity * 100) : 100}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    const safeValue = isNaN(value) ? 100 : Math.min(100, Math.max(0, value));
                                    onUpdate({
                                        ...element,
                                        strokeOpacity: safeValue / 100
                                    });
                                }}
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Text style section - Display only for text elements */}
            {element.type === 'text' && (
                <div className={ss.section}>
                    <div className={ss.sectionHeader} onClick={() => toggleSection('text')}>
                        <h3>Text style</h3>
                        {expandedSections.text ? <FaChevronDown /> : <FaChevronRight />}
                    </div>
                    {expandedSections.text && (
                        <div className={ss.textStyleContent}>
                            <div className={ss.inputGroup}>
                                <label>Font size</label>
                                <input
                                    type="number"
                                    value={element.fontSize || 16}
                                    onChange={(e) => handleInputChange('fontSize', e.target.value)}
                                    min={8}
                                    max={72}
                                />
                            </div>
                            <div className={ss.inputGroup}>
                                <label>Font</label>
                                <select
                                    value={element.fontFamily || 'Arial'}
                                    onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                                >
                                    <option value="Arial">Arial</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Courier New">Courier New</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Noto Sans KR">Noto Sans KR</option>
                                    <option value="Nanum Gothic">Nanum Gothic</option>
                                </select>
                            </div>
                            <div className={ss.inputGroup}>
                                <label>Alignment</label>
                                <div className={ss.textAlignButtons}>
                                    <button 
                                        className={element.textAlign === 'left' ? ss.active : ''}
                                        onClick={() => handleInputChange('textAlign', 'left')}
                                    >
                                        <FaAlignLeft />
                                    </button>
                                    <button 
                                        className={element.textAlign === 'center' ? ss.active : ''}
                                        onClick={() => handleInputChange('textAlign', 'center')}
                                    >
                                        <FaAlignCenter />
                                    </button>
                                    <button 
                                        className={element.textAlign === 'right' ? ss.active : ''}
                                        onClick={() => handleInputChange('textAlign', 'right')}
                                    >
                                        <FaAlignRight />
                                    </button>
                                </div>
                            </div>
                            <div className={ss.inputGroup}>
                                <label>스타일</label>
                                <div className={ss.textStyleButtons}>
                                    <button 
                                        className={element.fontWeight === 'bold' ? ss.active : ''}
                                        onClick={() => handleInputChange('fontWeight', element.fontWeight === 'bold' ? 'normal' : 'bold')}
                                    >
                                        <FaBold />
                                    </button>
                                    <button 
                                        className={element.fontStyle === 'italic' ? ss.active : ''}
                                        onClick={() => handleInputChange('fontStyle', element.fontStyle === 'italic' ? 'normal' : 'italic')}
                                    >
                                        <FaItalic />
                                    </button>
                                    <button 
                                        className={element.textDecoration === 'underline' ? ss.active : ''}
                                        onClick={() => handleInputChange('textDecoration', element.textDecoration === 'underline' ? 'none' : 'underline')}
                                    >
                                        <FaUnderline />
                                    </button>
                                </div>
                            </div>
                            <div className={ss.inputGroup}>
                                <label>텍스트 색상</label>
                                <div 
                                    className={ss.colorPreview}
                                    style={{ backgroundColor: element.fill || '#000000' }}
                                    onClick={(e) => handleColorPickerClick('textColor', e)}
                                    ref={colorPreviewRef}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ColorPickerModal
                show={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                color={activeColorType === 'fill' && element ? element.fill : element ? element.stroke : '#000000'}
                onColorChange={handleColorChange}
                opacity={opacity}
                onOpacityChange={setOpacity}
                colorFormat={colorFormat}
                onColorFormatChange={setColorFormat}
                position={colorPickerPosition}
            />
        </div>
    );
});

export default PropertyTab; 