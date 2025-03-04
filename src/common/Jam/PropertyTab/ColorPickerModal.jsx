import React, { forwardRef, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { FaEyeDropper } from 'react-icons/fa';
import ss from './ColorPickerModal.module.css';
import { useClickOutside } from '../hooks/useClickOutside';

const ColorPickerModal = React.memo(forwardRef(({
    show,
    onClose,
    color,
    onChange,
    opacity,
    onOpacityChange,
    colorFormat,
    onColorFormatChange
}, ref) => {
    const handleContentClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    if (!show) return null;

    return (
        <div className={ss.modal} onClick={onClose}>
            <div 
                ref={ref}
                className={ss.content} 
                onClick={handleContentClick}
            >
                <div className={ss.header}>
                    <div className={ss.tabs}>
                        <button className={`${ss.tab} ${ss.active}`}>Custom</button>
                        <button className={ss.tab}>Libraries</button>
                    </div>
                    <div className={ss.tools}>
                        <button className={ss.toolButton}>+</button>
                        <button className={ss.toolButton} onClick={onClose}>×</button>
                    </div>
                </div>

                <div className={ss.main}>
                    <div className={ss.picker}>
                        <HexColorPicker color={color} onChange={onChange} />
                        <div className={ss.controls}>
                            <button className={ss.eyedropper}>
                                <FaEyeDropper />
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={opacity}
                                onChange={(e) => onOpacityChange(e.target.value)}
                                className={ss.opacitySlider}
                            />
                        </div>
                    </div>

                    <div className={ss.inputs}>
                        <select 
                            value={colorFormat}
                            onChange={(e) => onColorFormatChange(e.target.value)}
                            className={ss.formatSelect}
                        >
                            <option value="hex">Hex</option>
                            <option value="rgb">RGB</option>
                            <option value="hsl">HSL</option>
                        </select>
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => onChange(e.target.value)}
                            className={ss.colorInput}
                        />
                        <div className={ss.opacityInput}>
                            <input
                                type="number"
                                value={opacity}
                                onChange={(e) => onOpacityChange(e.target.value)}
                                min="0"
                                max="100"
                            />
                            <span>%</span>
                        </div>
                    </div>

                    <div className={ss.swatches}>
                        <h4>On this page</h4>
                        <div className={ss.swatchGrid}>
                            {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
                              '#FFFF00', '#FF00FF', '#00FFFF', '#808080'].map(color => (
                                <div
                                    key={color}
                                    className={ss.swatch}
                                    style={{ background: color }}
                                    onClick={() => onChange(color)}
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