import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    FaHome, 
    FaSave, 
    FaMousePointer, 
    FaPen, 
    FaFont, 
    FaImage, 
    FaEraser, 
    FaSearchPlus, 
    FaSearchMinus, 
    FaMoon,
    FaSquare,
    FaCircle,
    FaDrawPolygon,
    FaStar,
    FaHeart,
    FaChevronDown,
    FaKeyboard,
    FaTimes
} from 'react-icons/fa';
import { 
    MdGridOn, 
    MdGridOff, 
    MdOutlineColorLens 
} from 'react-icons/md';
import { 
    BsArrowsMove, 
    BsGrid3X3, 
    BsCircleFill,
    BsTriangle,
    BsQuestionCircle
} from 'react-icons/bs';
import { 
    IoColorPaletteOutline, 
    IoSettingsSharp 
} from 'react-icons/io5';
import { 
    HiOutlineDocumentDuplicate 
} from 'react-icons/hi';
import { 
    BiNetworkChart 
} from 'react-icons/bi';
import styles from './Toolbar.module.css';

const Toolbar = ({ 
    tool, 
    onToolChange, 
    backgroundStyle, 
    onBackgroundStyleChange,
    onZoomIn,
    onZoomOut,
    scale,
    onOpenColorPicker,
    onOpenHomeModal,
    onSaveProject,
    currentProject
}) => {
    const [showShapeDropdown, setShowShapeDropdown] = useState(false);
    const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
    const [selectedShape, setSelectedShape] = useState('rectangle');
    const shapeDropdownRef = useRef(null);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);
    const [showTooltip, setShowTooltip] = useState(null);
    const tooltipTimeoutRef = useRef(null);

    // 단축키 정의
    const shortcuts = {
        'v': 'select',        // V: Selection tool
        'p': 'pen',           // P: Pen tool
        'r': 'shape_rectangle', // R: Rectangle
        'e': 'shape_ellipse',   // E: Ellipse
        't': 'text',          // T: Text
        'i': 'image',         // I: Image
        'h': 'move',          // H: Hand tool (move)
        'c': 'connect',       // C: Connect tool
        'z': 'eraser',        // Z: Eraser (Adobe uses E, but we use E for Ellipse)
        '+': 'zoom_in',       // +: Zoom in
        '-': 'zoom_out',      // -: Zoom out
        's': 'save'           // S: Save
    };

    // 도형 단축키 매핑
    const shapeShortcuts = {
        'r': 'rectangle',
        'e': 'ellipse',
        'u': 'triangle',
        'p': 'polygon',
        '*': 'star',
        'h': 'heart'
    };

    // 단축키 설명 데이터
    const shortcutGuides = [
        { key: 'V', description: 'Select Tool - 객체 선택 및 이동' },
        { key: 'P', description: 'Pen Tool - 자유롭게 그리기' },
        { key: 'R', description: 'Rectangle - 사각형 그리기' },
        { key: 'E', description: 'Ellipse - 원형 그리기' },
        { key: 'U', description: 'Triangle - 삼각형 그리기' },
        { key: 'P', description: 'Polygon - 다각형 그리기' },
        { key: '*', description: 'Star - 별 모양 그리기' },
        { key: 'H', description: 'Heart - 하트 모양 그리기' },
        { key: 'T', description: 'Text Tool - 텍스트 추가' },
        { key: 'I', description: 'Image Tool - 이미지 추가' },
        { key: 'Z', description: 'Eraser - 지우개 도구' },
        { key: 'H', description: 'Move Tool - 캔버스 이동' },
        { key: 'C', description: 'Connect Tool - 객체 연결' },
        { key: 'Ctrl/Cmd + +', description: 'Zoom In - 확대' },
        { key: 'Ctrl/Cmd + -', description: 'Zoom Out - 축소' },
        { key: 'Ctrl/Cmd + S', description: 'Save - 프로젝트 저장' },
        { key: '?', description: 'Shortcuts - 단축키 가이드 표시' },
        { key: 'C', description: '연결 도구' }
    ];

    // 도구 설명 데이터
    const toolDescriptions = {
        'select': '객체를 선택하고 이동할 수 있습니다. 여러 객체를 선택하려면 Shift 키를 누른 상태에서 클릭하세요.',
        'pen': '자유롭게 그릴 수 있습니다. 클릭하여 시작하고 드래그하여 그린 후 마우스를 놓으면 완료됩니다.',
        'shape_rectangle': '사각형을 그립니다. 클릭하여 시작점을 지정하고 드래그하여 크기를 조절한 후 마우스를 놓으면 완료됩니다.',
        'shape_ellipse': '원이나 타원을 그립니다. 클릭하여 시작점을 지정하고 드래그하여 크기를 조절한 후 마우스를 놓으면 완료됩니다.',
        'shape_triangle': '삼각형을 그립니다. 클릭하여 시작점을 지정하고 드래그하여 크기를 조절한 후 마우스를 놓으면 완료됩니다.',
        'shape_polygon': '다각형을 그립니다. 클릭하여 각 꼭지점을 지정하고 시작점을 다시 클릭하면 완료됩니다.',
        'shape_star': '별 모양을 그립니다. 클릭하여 시작점을 지정하고 드래그하여 크기를 조절한 후 마우스를 놓으면 완료됩니다.',
        'shape_heart': '하트 모양을 그립니다. 클릭하여 시작점을 지정하고 드래그하여 크기를 조절한 후 마우스를 놓으면 완료됩니다.',
        'text': '텍스트를 추가합니다. 클릭하여 텍스트 상자를 생성하고 내용을 입력하세요.',
        'image': '이미지를 추가합니다. 클릭하여 이미지 파일을 선택하세요.',
        'eraser': '그려진 객체를 지웁니다. 클릭하거나 드래그하여 지우세요.',
        'move': '캔버스를 이동합니다. 클릭하고 드래그하여 캔버스를 이동하세요.',
        'connect': '요소들을 연결선으로 이어줍니다. 요소의 상하좌우 모서리에 있는 앵커 포인트를 드래그하여 다른 요소에 연결할 수 있습니다.'
    };

    // 도형 옵션 정의
    const shapeOptions = [
        { id: 'rectangle', icon: <FaSquare />, title: 'Rectangle' },
        { id: 'ellipse', icon: <FaCircle />, title: 'Circle' },
        { id: 'triangle', icon: <BsTriangle />, title: 'Triangle' },
        { id: 'polygon', icon: <FaDrawPolygon />, title: 'Polygon' },
        { id: 'star', icon: <FaStar />, title: 'Star' },
        { id: 'heart', icon: <FaHeart />, title: 'Heart' }
    ];

    // 도구 변경 핸들러
    const handleToolClick = useCallback((toolName) => {
        requestAnimationFrame(() => {
            onToolChange(toolName);
        });
    }, [onToolChange]);

    // 도형 선택 핸들러
    const handleShapeSelect = useCallback((shapeType) => {
        setSelectedShape(shapeType);
        handleToolClick(`shape_${shapeType}`);
        setShapeDropdownOpen(false);
    }, [handleToolClick]);

    // 도형 드롭다운 토글
    const toggleShapeDropdown = useCallback(() => {
        setShapeDropdownOpen(prev => !prev);
    }, []);

    // 선택된 도형 아이콘 가져오기
    const getSelectedShapeIcon = useCallback(() => {
        const selectedShapeOption = shapeOptions.find(shape => shape.id === selectedShape);
        return selectedShapeOption ? selectedShapeOption.icon : <FaSquare />;
    }, [selectedShape, shapeOptions]);

    // 키보드 이벤트 핸들러
    useEffect(() => {
        const handleKeyDown = (e) => {
            // 입력 필드에서 단축키가 작동하지 않도록 함
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // 단축키 가이드 표시 (물음표 키)
            if (e.key === '?' || e.key === '/') {
                e.preventDefault();
                setShowShortcutsModal(prev => !prev);
                return;
            }

            // 수정자 키 확인 (Ctrl/Cmd)
            const isModifierKey = e.ctrlKey || e.metaKey;
            
            // 단축키 처리
            const key = e.key.toLowerCase();
            
            // Ctrl+S 또는 Cmd+S: 저장
            if (isModifierKey && key === 's') {
                e.preventDefault();
                onSaveProject();
                return;
            }
            
            // Ctrl+Plus 또는 Cmd+Plus: 확대
            if (isModifierKey && (key === '+' || key === '=')) {
                e.preventDefault();
                onZoomIn();
                return;
            }
            
            // Ctrl+Minus 또는 Cmd+Minus: 축소
            if (isModifierKey && key === '-') {
                e.preventDefault();
                onZoomOut();
                return;
            }

            // 수정자 키가 없는 일반 단축키
            if (!isModifierKey && !e.altKey && !e.shiftKey) {
                const action = shortcuts[key];
                
                if (action) {
                    e.preventDefault();
                    
                    // 줌 인/아웃 처리
                    if (action === 'zoom_in') {
                        onZoomIn();
                        return;
                    }
                    
                    if (action === 'zoom_out') {
                        onZoomOut();
                        return;
                    }
                    
                    // 저장 처리
                    if (action === 'save') {
                        onSaveProject();
                        return;
                    }
                    
                    // 도형 도구 처리
                    if (action.startsWith('shape_')) {
                        const shapeType = action.replace('shape_', '');
                        handleShapeSelect(shapeType);
                        return;
                    }
                    
                    // 일반 도구 처리
                    handleToolClick(action);
                }
            }
        };

        // 이벤트 리스너 등록
        window.addEventListener('keydown', handleKeyDown);
        
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onToolChange, onZoomIn, onZoomOut, onSaveProject, handleToolClick, handleShapeSelect]);

    // 툴팁 표시 함수
    const handleShowTooltip = useCallback((toolId) => {
        // 이전 타이머 취소
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
        
        // 툴팁 표시
        setShowTooltip(toolId);
    }, []);

    // 툴팁 숨김 함수
    const handleHideTooltip = useCallback(() => {
        // 약간의 지연 후 툴팁 숨김 (마우스가 빠르게 이동할 때 깜빡임 방지)
        tooltipTimeoutRef.current = setTimeout(() => {
            setShowTooltip(null);
        }, 100);
    }, []);

    // 단축키 모달 토글 함수
    const toggleShortcutsModal = useCallback(() => {
        setShowShortcutsModal(prev => !prev);
    }, []);

    // 도형 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (shapeDropdownRef.current && !shapeDropdownRef.current.contains(event.target)) {
                setShapeDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleBackgroundStyleChange = useCallback((style) => {
        requestAnimationFrame(() => {
            onBackgroundStyleChange(style);
        });
    }, [onBackgroundStyleChange]);

    const handleColorPickerClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onOpenColorPicker('fill', {
            x: rect.left,
            y: rect.bottom + 5
        }, '#FFFFFF');
    };

    return (
        <div className={styles.toolbar}>
            {/* 단축키 가이드 버튼 */}
            <div className={styles.toolGroup}>
                <button
                    className={styles.tool}
                    onClick={toggleShortcutsModal}
                    title="Keyboard Shortcuts (?)"
                >
                    <FaKeyboard />
                </button>
            </div>

            {/* 툴바 좌측 그룹 - 홈 및 저장 */}
            <div className={styles.toolGroup}>
                <button
                    className={styles.tool}
                    onClick={onOpenHomeModal}
                    title="Home"
                    onMouseEnter={() => handleShowTooltip('home')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaHome />
                    {showTooltip === 'home' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Home</div>
                            <div className={styles.tooltipDescription}>
                                홈 화면으로 돌아갑니다. 프로젝트 목록을 볼 수 있습니다.
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={styles.tool}
                    onClick={onSaveProject}
                    title="Save (Ctrl/Cmd + S)"
                    onMouseEnter={() => handleShowTooltip('save')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaSave />
                    {showTooltip === 'save' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Save (Ctrl/Cmd + S)</div>
                            <div className={styles.tooltipDescription}>
                                현재 프로젝트를 저장합니다. 단축키: Ctrl/Cmd + S
                            </div>
                        </div>
                    )}
                </button>
                {currentProject && (
                    <div className={styles.projectInfo}>
                        <span className={styles.projectName}>{currentProject.name}</span>
                    </div>
                )}
            </div>

            {/* 메인 도구 그룹 */}
            <div className={styles.toolGroup}>
                <button
                    className={`${styles.tool} ${tool === 'select' ? styles.active : ''}`}
                    onClick={() => handleToolClick('select')}
                    title="Select (V)"
                    onMouseEnter={() => handleShowTooltip('select')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaMousePointer />
                    {showTooltip === 'select' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Select Tool (V)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.select}
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${tool === 'pen' ? styles.active : ''}`}
                    onClick={() => handleToolClick('pen')}
                    title="Pen (P)"
                    onMouseEnter={() => handleShowTooltip('pen')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaPen />
                    {showTooltip === 'pen' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Pen Tool (P)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.pen}
                            </div>
                        </div>
                    )}
                </button>
                
                {/* 도형 드롭다운 버튼 */}
                <div className={styles.shapeDropdownContainer} ref={shapeDropdownRef}>
                    <button
                        className={`${styles.tool} ${styles.hasDropdown} ${tool.startsWith('shape_') ? styles.active : ''} ${shapeDropdownOpen ? styles.open : ''}`}
                        onClick={toggleShapeDropdown}
                        title="Shapes (R/E)"
                        onMouseEnter={() => handleShowTooltip('shapes')}
                        onMouseLeave={handleHideTooltip}
                    >
                        {getSelectedShapeIcon()}
                        <FaChevronDown className={styles.dropdownIcon} />
                        {showTooltip === 'shapes' && (
                            <div className={styles.extendedTooltip}>
                                <div className={styles.tooltipTitle}>Shape Tools</div>
                                <div className={styles.tooltipDescription}>
                                    다양한 도형을 그릴 수 있습니다. 클릭하여 도형 목록을 확인하세요.
                                    <br />
                                    단축키: R (사각형), E (원형), U (삼각형) 등
                                </div>
                            </div>
                        )}
                    </button>
                    
                    {shapeDropdownOpen && (
                        <div className={`${styles.shapeDropdown} ${styles.iconsOnly}`}>
                            {shapeOptions.map(shape => {
                                // 도형에 해당하는 단축키 찾기
                                const shortcutKey = Object.keys(shapeShortcuts).find(
                                    key => shapeShortcuts[key] === shape.id
                                );
                                const shortcutText = shortcutKey ? ` (${shortcutKey.toUpperCase()})` : '';
                                
                                return (
                                    <button
                                        key={shape.id}
                                        className={`${styles.shapeOption} ${selectedShape === shape.id ? styles.active : ''}`}
                                        onClick={() => handleShapeSelect(shape.id)}
                                        title={`${shape.title}${shortcutText}`}
                                        onMouseEnter={() => handleShowTooltip(`shape_${shape.id}`)}
                                        onMouseLeave={handleHideTooltip}
                                    >
                                        {shape.icon}
                                        {showTooltip === `shape_${shape.id}` && (
                                            <div className={styles.extendedTooltip}>
                                                <div className={styles.tooltipTitle}>{shape.title}{shortcutText}</div>
                                                <div className={styles.tooltipDescription}>
                                                    {toolDescriptions[`shape_${shape.id}`]}
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                <button
                    className={`${styles.tool} ${tool === 'text' ? styles.active : ''}`}
                    onClick={() => handleToolClick('text')}
                    title="Text (T)"
                    onMouseEnter={() => handleShowTooltip('text')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaFont />
                    {showTooltip === 'text' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Text Tool (T)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.text}
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${tool === 'image' ? styles.active : ''}`}
                    onClick={() => handleToolClick('image')}
                    title="Image (I)"
                    onMouseEnter={() => handleShowTooltip('image')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaImage />
                    {showTooltip === 'image' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Image Tool (I)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.image}
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${tool === 'eraser' ? styles.active : ''}`}
                    onClick={() => handleToolClick('eraser')}
                    title="Eraser (Z)"
                    onMouseEnter={() => handleShowTooltip('eraser')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaEraser />
                    {showTooltip === 'eraser' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Eraser Tool (Z)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.eraser}
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${tool === 'move' ? styles.active : ''}`}
                    onClick={() => handleToolClick('move')}
                    title="Move (H)"
                    onMouseEnter={() => handleShowTooltip('move')}
                    onMouseLeave={handleHideTooltip}
                >
                    <BsArrowsMove />
                    {showTooltip === 'move' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Move Tool (H)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.move}
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* 배경 스타일 도구 */}
            <div className={styles.toolGroup}>
                <button
                    className={`${styles.tool} ${backgroundStyle === 'none' ? styles.active : ''}`}
                    onClick={() => handleBackgroundStyleChange('none')}
                    title="No Background"
                    onMouseEnter={() => handleShowTooltip('none')}
                    onMouseLeave={handleHideTooltip}
                >
                    <BsCircleFill style={{ opacity: 0.2 }} />
                    {showTooltip === 'none' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>No Background</div>
                            <div className={styles.tooltipDescription}>
                                배경을 없애고 캔버스를 투명하게 만듭니다.
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${backgroundStyle === 'lines' ? styles.active : ''}`}
                    onClick={() => handleBackgroundStyleChange('lines')}
                    title="Grid Lines"
                    onMouseEnter={() => handleShowTooltip('lines')}
                    onMouseLeave={handleHideTooltip}
                >
                    <MdGridOn />
                    {showTooltip === 'lines' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Grid Lines</div>
                            <div className={styles.tooltipDescription}>
                                그리드 선을 표시합니다.
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${backgroundStyle === 'dots' ? styles.active : ''}`}
                    onClick={() => handleBackgroundStyleChange('dots')}
                    title="Dot Grid"
                    onMouseEnter={() => handleShowTooltip('dots')}
                    onMouseLeave={handleHideTooltip}
                >
                    <BsGrid3X3 />
                    {showTooltip === 'dots' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Dot Grid</div>
                            <div className={styles.tooltipDescription}>
                                점 그리드를 표시합니다.
                            </div>
                        </div>
                    )}
                </button>
                <button
                    className={`${styles.tool} ${backgroundStyle === 'crosshatch' ? styles.active : ''}`}
                    onClick={() => handleBackgroundStyleChange('crosshatch')}
                    title="Crosshatch"
                    onMouseEnter={() => handleShowTooltip('crosshatch')}
                    onMouseLeave={handleHideTooltip}
                >
                    <HiOutlineDocumentDuplicate />
                    {showTooltip === 'crosshatch' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Crosshatch</div>
                            <div className={styles.tooltipDescription}>
                                크로스핫치 패턴을 표시합니다.
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* 확대/축소 도구 */}
            <div className={styles.toolGroup}>
                <button
                    className={styles.tool}
                    onClick={onZoomIn}
                    title="Zoom In (Ctrl/Cmd +)"
                    onMouseEnter={() => handleShowTooltip('zoom_in')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaSearchPlus />
                    {showTooltip === 'zoom_in' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Zoom In (Ctrl/Cmd +)</div>
                            <div className={styles.tooltipDescription}>
                                캔버스를 확대합니다. 단축키: Ctrl/Cmd + +
                            </div>
                        </div>
                    )}
                </button>
                <span className={styles.scaleDisplay}>{Math.round(scale * 100)}%</span>
                <button
                    className={styles.tool}
                    onClick={onZoomOut}
                    title="Zoom Out (Ctrl/Cmd -)"
                    onMouseEnter={() => handleShowTooltip('zoom_out')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaSearchMinus />
                    {showTooltip === 'zoom_out' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Zoom Out (Ctrl/Cmd -)</div>
                            <div className={styles.tooltipDescription}>
                                캔버스를 축소합니다. 단축키: Ctrl/Cmd + -
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* 테마 전환 도구 */}
            <div className={styles.toolGroup}>
                <button
                    className={`${styles.tool}`}
                    onClick={() => {}}
                    title="Toggle Theme"
                    onMouseEnter={() => handleShowTooltip('theme')}
                    onMouseLeave={handleHideTooltip}
                >
                    <FaMoon />
                    {showTooltip === 'theme' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Toggle Theme</div>
                            <div className={styles.tooltipDescription}>
                                다크 모드와 라이트 모드를 전환합니다.
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* 연결 도구 그룹 */}
            <div className={styles.toolGroup}>
                <button
                    className={`${styles.tool} ${tool === 'connect' ? styles.active : ''}`}
                    onClick={() => handleToolClick('connect')}
                    title="Connect (C)"
                    onMouseEnter={() => handleShowTooltip('connect')}
                    onMouseLeave={handleHideTooltip}
                >
                    <BiNetworkChart />
                    {showTooltip === 'connect' && (
                        <div className={styles.extendedTooltip}>
                            <div className={styles.tooltipTitle}>Connect Tool (C)</div>
                            <div className={styles.tooltipDescription}>
                                {toolDescriptions.connect}
                            </div>
                        </div>
                    )}
                </button>
            </div>

            {/* 단축키 가이드 모달 */}
            {showShortcutsModal && (
                <div className={styles.modalOverlay} onClick={toggleShortcutsModal}>
                    <div className={styles.shortcutsModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>키보드 단축키 가이드</h2>
                            <button className={styles.closeButton} onClick={toggleShortcutsModal}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <div className={styles.shortcutsList}>
                                {shortcutGuides.map((guide, index) => (
                                    <div key={index} className={styles.shortcutItem}>
                                        <div className={styles.shortcutKey}>{guide.key}</div>
                                        <div className={styles.shortcutDescription}>{guide.description}</div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.shortcutTip}>
                                <BsQuestionCircle />
                                <span>언제든지 <kbd>?</kbd> 키를 눌러 이 가이드를 열 수 있습니다.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Toolbar; 