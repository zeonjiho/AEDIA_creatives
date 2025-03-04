import React, { useState, useRef, useEffect, useCallback } from 'react';
import ss from './Jam.module.css';
import Toolbar from '../../common/Jam/Toolbar/Toolbar';
import PropertyTab from '../../common/Jam/PropertyTab/PropertyTab';
import Canvas from '../../common/Jam/Canvas/Canvas';
import Sidebar from '../../common/Jam/Sidebar/Sidebar';
import ColorPickerModal from '../../common/Jam/ColorPickerModal/ColorPickerModal';
import HomeModal from '../../common/Jam/HomeModal/HomeModal';
import ActiveUsers from './components/ActiveUsers';
import { toast } from 'react-toastify';

// 유틸리티 함수 임포트
import {
  generateUniqueId,
  createTextElement,
  createRectangleElement,
  createEllipseElement,
  createImageElement,
  createHyperlinkElement,
  createConnection,
  updateElement,
  deleteElements,
  moveElements,
  isPointInElement,
  findElementsInSelection,
  createTriangleElement,
  createPolygonElement,
  createStarElement,
  createHeartElement
} from '../../common/Jam/utils/ElementUtils';

import {
  getMousePosition,
  zoomIn,
  zoomOut,
  handleWheelZoom,
  handlePanning,
  centerViewport
} from '../../common/Jam/utils/ViewportUtils';

import {
  getAllProjects,
  getRecentProjects,
  saveProject,
  loadProject,
  deleteProject,
  exportProject,
  importProject
} from '../../common/Jam/utils/ProjectUtils';

// 요소 타입 정의
const ElementTypes = {
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  STICKY: 'sticky'
};

const Jam = () => {
  // 상태 관리
  const workspaceRef = useRef(null);
  const [tool, setTool] = useState('select');
  const [elements, setElements] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const [activeUsers, setActiveUsers] = useState([
    { id: 1, name: '사용자1', color: '#4285F4' },
    { id: 2, name: '사용자2', color: '#EA4335' },
    { id: 3, name: '사용자3', color: '#FBBC05' }
  ]);
  const [backgroundStyle, setBackgroundStyle] = useState('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const textInputRef = useRef(null);
  const [connections, setConnections] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState('#000000');
  const dragAnimationFrame = useRef(null);
  
  // 홈 모달 관련 상태
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const fileInputRef = useRef(null);

  // 프로젝트 변경 상태 추가
  const [isProjectChanged, setIsProjectChanged] = useState(false);

  // 프로젝트 목록 로드
  useEffect(() => {
    const loadProjects = () => {
      const allProjects = getAllProjects();
      setProjects(allProjects);
    };
    
    loadProjects();
  }, []);

  // 격자 오프셋 계산
  const gridOffset = {
    x: (viewportOffset.x % 20) * scale,
    y: (viewportOffset.y % 20) * scale
  };

  // 휠 이벤트 핸들러
  const handleWheel = (e) => {
    // Ctrl 키를 누른 상태에서 휠 이벤트 발생 시 줌 처리
    if (e.ctrlKey) {
      e.preventDefault(); // 브라우저 기본 줌 동작 방지
      const result = handleWheelZoom(e, scale, viewportOffset, workspaceRef);
      setScale(result.scale);
      setViewportOffset(result.viewportOffset);
    } 
    // Ctrl 키 없이 휠 이벤트 발생 시 스크롤 처리
    else {
      // Shift 키를 누른 상태에서 휠 이벤트 발생 시 가로 스크롤
      const dx = e.shiftKey ? e.deltaY : 0;
      const dy = e.shiftKey ? 0 : e.deltaY;
      
      setViewportOffset(prev => ({
        x: prev.x - dx,
        y: prev.y - dy
      }));
    }
  };

  // 줌 이벤트 처리
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    workspace.addEventListener('wheel', handleWheel, { passive: false });
    return () => workspace.removeEventListener('wheel', handleWheel);
  }, [scale, viewportOffset]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 텍스트 편집 중에는 키보드 단축키 비활성화
      if (isEditing) return;

      // Delete 키로 선택된 요소 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElements.length > 0) {
          const newElements = elements.filter(el => !selectedElements.includes(el));
          setElements(newElements);
          setSelectedElements([]);
        }
      }

      // Ctrl+A로 모든 요소 선택
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedElements([...elements]);
      }

      // Ctrl+S로 저장
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentProject) {
          setIsHomeModalOpen(true);
          return;
        }
        
        try {
          const savedProject = saveProject(
            currentProject.name,
            elements,
            connections,
            viewportOffset,
            scale,
            backgroundStyle
          );
          
          setCurrentProject(savedProject);
          
          // 프로젝트 목록 업데이트
          setProjects(getAllProjects());
          
          // 저장 성공 메시지
          alert('프로젝트가 저장되었습니다.');
        } catch (error) {
          console.error('프로젝트 저장 중 오류 발생:', error);
          alert('프로젝트를 저장할 수 없습니다.');
        }
      }

      // Ctrl+O로 홈 모달 열기
      if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsHomeModalOpen(true);
      }

      // Escape 키로 선택 해제
      if (e.key === 'Escape') {
        setSelectedElements([]);
        setTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [elements, selectedElements, isEditing, currentProject, connections, viewportOffset, scale, backgroundStyle]);

  // 텍스트 편집 시작
  const startEditing = (element) => {
    setIsEditing(true);
    setEditingText(element.text || '');
    setSelectedElements([element]);
  };

  // 텍스트 편집 종료
  const finishEditing = () => {
    // TextElement 컴포넌트에서 실시간으로 업데이트하므로
    // 여기서는 편집 상태만 초기화
    setIsEditing(false);
    setEditingText('');
  };

  // 요소 업데이트 핸들러
  const handleElementUpdate = (updatedElement) => {
    setElements(prev => updateElement(prev, updatedElement));
    
    // 텍스트 편집 중이면 편집 텍스트도 업데이트
    if (isEditing && updatedElement.type === 'text') {
      setEditingText(updatedElement.text || '');
    }
  };

  // 마우스 다운 핸들러
  const handleMouseDown = (e) => {
    // 텍스트 편집 중인 경우
    if (isEditing) {
      const mousePos = getMousePosition(e, workspaceRef, viewportOffset, scale);
      const editingElement = selectedElements[0];
      
      // 클릭한 위치가 현재 편집 중인 텍스트 요소 내부인지 확인
      const isClickInsideEditingElement = editingElement && isPointInElement(mousePos, editingElement);
      
      // 텍스트 요소 외부를 클릭한 경우에만 편집 종료
      if (!isClickInsideEditingElement) {
        finishEditing();
      } else {
        // 텍스트 요소 내부 클릭은 이벤트 전파 중지하여 편집 계속
        e.stopPropagation();
        return;
      }
    }

    // 중간 마우스 버튼(휠 클릭)으로 패닝 시작
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }

    // 마우스 위치 계산 - 캔버스 좌표계로 변환
    const mousePos = getMousePosition(e, workspaceRef, viewportOffset, scale);

    // 텍스트 도구 선택 시 텍스트 요소 생성
    if (tool === 'text') {
      const newElement = createTextElement(mousePos);
      setElements(prev => [...prev, newElement]);
      setSelectedElements([newElement]);
      
      // 텍스트 요소 생성 후 즉시 편집 모드로 전환
      setTimeout(() => {
        startEditing(newElement);
      }, 10);
      return;
    }

    // 선택 도구 선택 시 요소 선택 처리
    if (tool === 'select') {
      // 요소 선택 로직 개선 - 뒤에서부터 검색하여 맨 위에 있는 요소 선택
      const clickedElement = [...elements].reverse().find(element => 
        isPointInElement(mousePos, element)
      );

      if (clickedElement) {
        // 텍스트 요소를 더블 클릭하면 편집 시작
        if (clickedElement.type === 'text' && e.detail === 2) {
          setSelectedElements([clickedElement]);
          startEditing(clickedElement);
          return;
        }
        
        // Shift 키를 누른 상태에서 클릭하면 다중 선택
        if (e.shiftKey) {
          if (selectedElements.includes(clickedElement)) {
            setSelectedElements(prev => prev.filter(el => el !== clickedElement));
          } else {
            setSelectedElements(prev => [...prev, clickedElement]);
          }
        } else {
          // 클릭한 요소가 이미 선택되어 있지 않으면 선택
          if (!selectedElements.includes(clickedElement)) {
            setSelectedElements([clickedElement]);
          }
          // 클릭 시 바로 드래그 시작
          setIsDragging(true);
          setDragStart(mousePos);
        }
      } else {
        // 빈 공간 클릭 시 선택 해제 및 선택 영역 시작
        setSelectedElements([]);
        
        // 선택 상자 좌표 계산 개선
        const rect = workspaceRef.current.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        
        setSelectionBox({
          startX,
          startY,
          currentX: startX,
          currentY: startY
        });
      }
    } else if (tool === 'rectangle' || tool === 'ellipse' || 
              tool.startsWith('shape_')) {
      setDrawing(true);
      setPosition(mousePos);
    } else if (tool === 'connect') {
      // 연결 도구 선택 시 요소 연결 처리
      const clickedElement = elements.find(element => 
        isPointInElement(mousePos, element)
      );
      
      if (clickedElement) {
        if (!isConnecting) {
          setIsConnecting(true);
          setConnectionStart(clickedElement);
        } else {
          const newConnection = createConnection(connectionStart, clickedElement);
          if (newConnection) {
            setConnections(prev => [...prev, newConnection]);
          }
          setIsConnecting(false);
          setConnectionStart(null);
        }
      }
    }
  };

  // 마우스 이동 핸들러
  const handleMouseMove = (e) => {
    // 패닝 중인 경우
    if (isPanning) {
      const result = handlePanning(e, lastMousePos, viewportOffset);
      setViewportOffset(result.viewportOffset);
      setLastMousePos(result.lastMousePos);
      return;
    }

    // 선택 상자 그리는 중인 경우
    if (selectionBox) {
      // 선택 상자 좌표 계산 개선
      const rect = workspaceRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      setSelectionBox(prev => ({
        ...prev,
        currentX,
        currentY
      }));
      return;
    }

    // 마우스 위치 계산 - 캔버스 좌표계로 변환
    const mousePos = getMousePosition(e, workspaceRef, viewportOffset, scale);

    // 도형 그리는 중인 경우
    if (drawing) {
      // 쉬프트 키가 눌려있는지 확인
      const isShiftPressed = e.shiftKey;
      
      // 쉬프트 키가 눌려있으면 비율 유지
      let adjustedMousePos = { ...mousePos };
      
      if (isShiftPressed) {
        const width = Math.abs(mousePos.x - position.x);
        const height = Math.abs(mousePos.y - position.y);
        const size = Math.max(width, height);
        
        // 마우스 위치 방향에 따라 조정
        if (mousePos.x >= position.x) {
          adjustedMousePos.x = position.x + size;
        } else {
          adjustedMousePos.x = position.x - size;
        }
        
        if (mousePos.y >= position.y) {
          adjustedMousePos.y = position.y + size;
        } else {
          adjustedMousePos.y = position.y - size;
        }
      }
      
      if (tool === 'rectangle' || tool === 'shape_rectangle') {
        const newElement = createRectangleElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      } else if (tool === 'ellipse' || tool === 'shape_ellipse') {
        const newElement = createEllipseElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      } else if (tool === 'shape_triangle') {
        const newElement = createTriangleElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      } else if (tool === 'shape_polygon') {
        const newElement = createPolygonElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      } else if (tool === 'shape_star') {
        const newElement = createStarElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      } else if (tool === 'shape_heart') {
        const newElement = createHeartElement(position, isShiftPressed ? adjustedMousePos : mousePos);
        setElements(prev => {
          const filtered = prev.filter(el => el.id !== 'temp');
          return [...filtered, { ...newElement, id: 'temp' }];
        });
      }
    } 
    // 요소 드래그 중인 경우
    else if (isDragging && selectedElements.length > 0) {
      // 드래그 중 성능 최적화를 위해 requestAnimationFrame 사용
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
      }
      
      dragAnimationFrame.current = requestAnimationFrame(() => {
        const dx = mousePos.x - dragStart.x;
        const dy = mousePos.y - dragStart.y;
        
        // 요소 이동 및 상태 업데이트
        const updatedElements = moveElements(elements, selectedElements, dx, dy);
        setElements(updatedElements);
        
        // 선택된 요소도 업데이트하여 TransformControl이 따라오도록 함
        const updatedSelectedElements = selectedElements.map(selectedElement => {
          const updatedElement = updatedElements.find(el => el.id === selectedElement.id);
          return updatedElement || selectedElement;
        });
        setSelectedElements(updatedSelectedElements);
        
        // 드래그 시작점 업데이트
        setDragStart(mousePos);
      });
    }
  };

  // 마우스 업 핸들러
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (selectionBox) {
      // 선택 영역 내 요소 찾기 개선
      const selectedInBox = findElementsInSelection(elements, selectionBox, scale, viewportOffset);
      setSelectedElements(selectedInBox);
      setSelectionBox(null);
      return;
    }

    if (drawing) {
      setDrawing(false);
      setElements(prev => {
        const tempElement = prev.find(el => el.id === 'temp');
        if (!tempElement) return prev;
        
        // 임시 요소를 실제 요소로 변환
        const newElement = {
          ...tempElement,
          id: generateUniqueId()
        };
        
        return prev.filter(el => el.id !== 'temp').concat(newElement);
      });
    }

    if (isDragging) {
      setIsDragging(false);
    }
  };

  // 줌 인 핸들러
  const handleZoomIn = () => {
    const result = zoomIn(scale, viewportOffset, workspaceRef);
    setScale(result.scale);
    setViewportOffset(result.viewportOffset);
  };

  // 줌 아웃 핸들러
  const handleZoomOut = () => {
    const result = zoomOut(scale, viewportOffset, workspaceRef);
    setScale(result.scale);
    setViewportOffset(result.viewportOffset);
  };

  // 배경 스타일 변경 핸들러
  const handleBackgroundStyleChange = (style) => {
    setBackgroundStyle(style);
  };

  // 툴 변경 핸들러
  const handleToolChange = (newTool) => {
    setTool(newTool);
    
    // 연결 도구가 선택되면 선택된 요소 초기화
    if (newTool === 'connect') {
      setSelectedElements([]);
    }
  };

  // 사이드바 토글 핸들러
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 컬러 피커 열기 핸들러
  const handleOpenColorPicker = (target, position, currentColor) => {
    setColorPickerTarget(target);
    // position 객체의 형식 확인 및 변환
    const formattedPosition = position && typeof position === 'object' 
      ? { 
          x: position.x !== undefined ? position.x : position.left, 
          y: position.y !== undefined ? position.y : position.top 
        }
      : { x: 0, y: 0 };
    setColorPickerPosition(formattedPosition);
    setCurrentColor(currentColor);
    setColorPickerOpen(true);
  };

  // 컬러 변경 핸들러
  const handleColorChange = (color) => {
    setCurrentColor(color);
    
    if (colorPickerTarget === 'fill' && selectedElements.length > 0) {
      selectedElements.forEach(element => {
        handleElementUpdate({
          ...element,
          fill: color
        });
      });
    } else if (colorPickerTarget === 'stroke' && selectedElements.length > 0) {
      selectedElements.forEach(element => {
        handleElementUpdate({
          ...element,
          stroke: color
        });
      });
    }
  };

  // 컬러 피커 닫기 핸들러
  const handleCloseColorPicker = () => {
    setColorPickerOpen(false);
    setColorPickerTarget(null);
  };

  // 애니메이션 프레임 정리
  useEffect(() => {
    return () => {
      if (dragAnimationFrame.current) {
        cancelAnimationFrame(dragAnimationFrame.current);
        dragAnimationFrame.current = null;
      }
    };
  }, []);

  // 드롭된 카드 처리 함수
  const handleDropCard = (cardData) => {
    if (!cardData) return;
    
    // 하이퍼링크 요소 생성
    const hyperlinkElement = {
      id: `hyperlink-${Date.now()}`,
      type: 'hyperlink',
      x: cardData.x,
      y: cardData.y,
      width: cardData.width || 250,
      height: cardData.height || 150,
      cardData: cardData,
      rotation: 0,
      opacity: 100
    };
    
    // 요소 배열에 추가
    setElements(prev => [...prev, hyperlinkElement]);
    
    // 새로 추가된 요소 선택
    setSelectedElements([hyperlinkElement]);
  };

  // 새 프로젝트 생성 핸들러
  const handleNewProject = (projectName) => {
    // 새 프로젝트 상태 초기화
    setElements([]);
    setConnections([]);
    setViewportOffset({ x: 0, y: 0 });
    setScale(1);
    setBackgroundStyle('grid');
    setSelectedElements([]);
    
    // 현재 프로젝트 설정
    const newProject = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: projectName,
      elements: [],
      connections: [],
      viewportOffset: { x: 0, y: 0 },
      scale: 1,
      backgroundStyle: 'grid',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    setCurrentProject(newProject);
    
    // 프로젝트 저장
    try {
      const savedProject = saveProject(
        projectName,
        [],
        [],
        { x: 0, y: 0 },
        1,
        'grid'
      );
      
      // 프로젝트 목록 업데이트
      setProjects(getAllProjects());
    } catch (error) {
      console.error('새 프로젝트 생성 중 오류 발생:', error);
      alert('프로젝트를 생성할 수 없습니다.');
    }
  };

  // 프로젝트 열기 핸들러
  const handleOpenProject = (project) => {
    try {
      // 프로젝트 데이터 로드
      const loadedProject = loadProject(project.id);
      
      // 상태 업데이트
      setElements(loadedProject.elements || []);
      setConnections(loadedProject.connections || []);
      setViewportOffset(loadedProject.viewportOffset || { x: 0, y: 0 });
      setScale(loadedProject.scale || 1);
      setBackgroundStyle(loadedProject.backgroundStyle || 'grid');
      setSelectedElements([]);
      setCurrentProject(loadedProject);
      
      // 프로젝트 목록 업데이트
      setProjects(getAllProjects());
    } catch (error) {
      console.error('프로젝트 열기 중 오류 발생:', error);
      alert('프로젝트를 열 수 없습니다.');
    }
  };

  // 현재 프로젝트 저장 핸들러
  const handleSaveCurrentProject = () => {
    if (!currentProject) return;
    
    const projectData = {
      name: currentProject.name,
      elements,
      connections,
      backgroundStyle
    };
    
    // 로컬 스토리지에 저장
    const projects = JSON.parse(localStorage.getItem('jamProjects') || '[]');
    const updatedProjects = projects.map(p => 
      p.id === currentProject.id ? { ...p, ...projectData, lastModified: new Date().toISOString() } : p
    );
    
    localStorage.setItem('jamProjects', JSON.stringify(updatedProjects));
    setIsProjectChanged(false);
    
    // 현재 프로젝트 정보 업데이트
    setCurrentProject(prev => ({ ...prev, lastModified: new Date().toISOString() }));
    
    // 성공 메시지 표시
    toast.success('프로젝트가 저장되었습니다.');
  };

  // 프로젝트 저장 핸들러 (이름 지정)
  const handleSaveProject = (projectName) => {
    try {
      const savedProject = saveProject(
        projectName,
        elements,
        connections,
        viewportOffset,
        scale,
        backgroundStyle
      );
      
      setCurrentProject(savedProject);
      
      // 프로젝트 목록 업데이트
      setProjects(getAllProjects());
      
      // 저장 성공 메시지
      alert('프로젝트가 저장되었습니다.');
    } catch (error) {
      console.error('프로젝트 저장 중 오류 발생:', error);
      alert('프로젝트를 저장할 수 없습니다.');
    }
  };

  // 프로젝트 내보내기 핸들러
  const handleExportProject = () => {
    if (!currentProject) {
      alert('내보낼 프로젝트가 없습니다.');
      return;
    }
    
    try {
      // 현재 상태로 프로젝트 객체 생성
      const projectToExport = {
        ...currentProject,
        elements,
        connections,
        viewportOffset,
        scale,
        backgroundStyle,
        lastModified: new Date().toISOString()
      };
      
      exportProject(projectToExport);
    } catch (error) {
      console.error('프로젝트 내보내기 중 오류 발생:', error);
      alert('프로젝트를 내보낼 수 없습니다.');
    }
  };

  // 프로젝트 가져오기 핸들러
  const handleImportProject = () => {
    fileInputRef.current?.click();
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const importedProject = await importProject(file);
      
      // 상태 업데이트
      setElements(importedProject.elements || []);
      setConnections(importedProject.connections || []);
      setViewportOffset(importedProject.viewportOffset || { x: 0, y: 0 });
      setScale(importedProject.scale || 1);
      setBackgroundStyle(importedProject.backgroundStyle || 'grid');
      setSelectedElements([]);
      setCurrentProject(importedProject);
      
      // 프로젝트 목록 업데이트
      setProjects(getAllProjects());
      
      // 모달 닫기
      setIsHomeModalOpen(false);
    } catch (error) {
      console.error('프로젝트 가져오기 중 오류 발생:', error);
      alert(`프로젝트를 가져올 수 없습니다: ${error.message}`);
    }
    
    // 파일 입력 초기화
    e.target.value = '';
  };

  // 연결 정보 변경 핸들러
  const handleConnectionsChange = (newConnections) => {
    setConnections(newConnections);
    
    // 프로젝트 변경 상태 업데이트
    setIsProjectChanged(true);
  };

  return (
    <div className={ss.container}>
      <div className={ss.content}>
        <Canvas
          workspaceRef={workspaceRef}
          elements={elements}
          connections={connections}
          selectedElements={selectedElements}
          selectionBox={selectionBox}
          scale={scale}
          viewportOffset={viewportOffset}
          tool={tool}
          backgroundStyle={backgroundStyle}
          isEditing={isEditing}
          editingText={editingText}
          textInputRef={textInputRef}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          startEditing={startEditing}
          handleElementUpdate={handleElementUpdate}
          finishEditing={finishEditing}
          onDropCard={handleDropCard}
          onConnectionsChange={handleConnectionsChange}
        />
        <Toolbar
          tool={tool}
          onToolChange={handleToolChange}
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          backgroundStyle={backgroundStyle}
          onBackgroundStyleChange={handleBackgroundStyleChange}
          onOpenHomeModal={() => setIsHomeModalOpen(true)}
          onSaveProject={handleSaveCurrentProject}
          currentProject={currentProject}
        />
        





{/* ///////////////////////////// 액티브 유저 임시 숨김///////////////////////////// */}
        {/* <ActiveUsers users={activeUsers} /> */}
        






        {selectedElements.length > 0 && (
          <PropertyTab
            selectedElements={selectedElements}
            onUpdate={handleElementUpdate}
            onOpenColorPicker={handleOpenColorPicker}
          />
        )}
        
        {colorPickerOpen && (
          <ColorPickerModal
            position={colorPickerPosition}
            color={currentColor}
            onColorChange={handleColorChange}
            onClose={handleCloseColorPicker}
          />
        )}
      </div>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        cards={[]}
        currentUser={{}}
      />
      
      <HomeModal
        isOpen={isHomeModalOpen}
        onClose={() => setIsHomeModalOpen(false)}
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
        projects={projects}
      />
      
      {/* 파일 입력 (숨김) */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default Jam; 