// UUID 생성 함수
export const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 텍스트 요소 생성 함수
export const createTextElement = (mousePos) => {
  return {
    id: generateUniqueId(),
    type: 'text',
    x: mousePos.x,
    y: mousePos.y,
    width: 100, // 초기 너비
    height: 24, // 초기 높이
    text: '',
    fill: '#FFFFFF',
    stroke: 'transparent',
    strokeWidth: 0,
    rotation: 0,
    opacity: 100,
    fontSize: 14,
    fontFamily: 'Arial',
    textAlign: 'left'
  };
};

// 사각형 요소 생성 함수
export const createRectangleElement = (startPos, endPos) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);

  return {
    id: generateUniqueId(),
    type: 'rectangle',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100
  };
};

// 타원 요소 생성 함수
export const createEllipseElement = (startPos, endPos) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);

  return {
    id: generateUniqueId(),
    type: 'ellipse',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100
  };
};

// 이미지 요소 생성 함수
export const createImageElement = (imageUrl, position) => {
  return {
    id: generateUniqueId(),
    type: 'image',
    x: position.x,
    y: position.y,
    width: 200,
    height: 200,
    src: imageUrl,
    rotation: 0,
    opacity: 100,
    isLoading: true
  };
};

// 연결선 생성 함수
export const createConnection = (startElement, endElement) => {
  if (startElement && endElement && startElement !== endElement) {
    return {
      id: generateUniqueId(),
      startId: startElement.id,
      endId: endElement.id,
      type: 'straight' // 나중에 curved 등 다른 타입 추가 가능
    };
  }
  return null;
};

// 요소 업데이트 함수
export const updateElement = (elements, updatedElement) => {
  return elements.map(element => 
    element.id === updatedElement.id ? updatedElement : element
  );
};

// 요소 삭제 함수
export const deleteElements = (elements, elementsToDelete) => {
  return elements.filter(element => !elementsToDelete.includes(element));
};

// 요소 이동 함수
export const moveElements = (elements, selectedElements, dx, dy) => {
  // 성능 최적화: 선택된 요소의 ID를 Set으로 변환하여 빠른 조회
  const selectedIds = new Set(selectedElements.map(el => el.id));
  
  return elements.map(element => {
    if (selectedIds.has(element.id)) {
      return {
        ...element,
        x: element.x + dx,
        y: element.y + dy
      };
    }
    return element;
  });
};

// 요소 충돌 감지 함수
export const isPointInElement = (point, element) => {
  // 회전을 고려하지 않은 간단한 충돌 감지
  return (
    point.x >= element.x && 
    point.x <= element.x + element.width &&
    point.y >= element.y && 
    point.y <= element.y + element.height
  );
};

// 선택 영역 내 요소 찾기 함수
export const findElementsInSelection = (elements, selectionBox, scale, viewportOffset) => {
  const selectionRect = {
    x: (Math.min(selectionBox.startX, selectionBox.currentX) - viewportOffset.x) / scale,
    y: (Math.min(selectionBox.startY, selectionBox.currentY) - viewportOffset.y) / scale,
    width: Math.abs(selectionBox.currentX - selectionBox.startX) / scale,
    height: Math.abs(selectionBox.currentY - selectionBox.startY) / scale
  };

  return elements.filter(element => {
    // 요소의 경계 상자가 선택 영역과 겹치는지 확인
    return (
      element.x < selectionRect.x + selectionRect.width &&
      element.x + element.width > selectionRect.x &&
      element.y < selectionRect.y + selectionRect.height &&
      element.y + element.height > selectionRect.y
    );
  });
};

/**
 * 하이퍼링크 요소 생성 함수
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {number} width - 너비
 * @param {number} height - 높이
 * @param {Object} cardData - 카드 데이터
 * @returns {Object} 하이퍼링크 요소 객체
 */
export const createHyperlinkElement = (x, y, width = 250, height = 200, cardData = {}) => {
  return {
    id: generateUniqueId(),
    type: 'hyperlink',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 100,
    cardData: {
      url: cardData.url || '',
      title: cardData.title || 'Untitled',
      description: cardData.description || '',
      thumbnail: cardData.thumbnail || '',
      type: cardData.type || 'link',
      img: cardData.img || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
};

// 삼각형 요소 생성 함수
export const createTriangleElement = (startPos, endPos) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);

  return {
    id: generateUniqueId(),
    type: 'triangle',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100,
    // 삼각형 꼭지점 정보 (상대적 좌표)
    points: [
      { x: width / 2, y: 0 },        // 상단 중앙
      { x: 0, y: height },           // 좌측 하단
      { x: width, y: height }        // 우측 하단
    ]
  };
};

// 다각형 요소 생성 함수
export const createPolygonElement = (startPos, endPos, sides = 6) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);
  
  // 다각형 꼭지점 계산
  const points = [];
  const radius = Math.min(width, height) / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI / sides) - Math.PI / 2; // 첫 점이 상단 중앙에 오도록 조정
    const pointX = centerX + radius * Math.cos(angle);
    const pointY = centerY + radius * Math.sin(angle);
    points.push({ x: pointX, y: pointY });
  }

  return {
    id: generateUniqueId(),
    type: 'polygon',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100,
    sides,
    points
  };
};

// 별 요소 생성 함수
export const createStarElement = (startPos, endPos, points = 5) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);
  
  // 별 꼭지점 계산
  const starPoints = [];
  const outerRadius = Math.min(width, height) / 2;
  const innerRadius = outerRadius * 0.4; // 내부 반지름 비율
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI / points) - Math.PI / 2; // 첫 점이 상단 중앙에 오도록 조정
    const pointX = centerX + radius * Math.cos(angle);
    const pointY = centerY + radius * Math.sin(angle);
    starPoints.push({ x: pointX, y: pointY });
  }

  return {
    id: generateUniqueId(),
    type: 'star',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100,
    points: starPoints,
    numPoints: points
  };
};

// 하트 요소 생성 함수
export const createHeartElement = (startPos, endPos) => {
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);

  return {
    id: generateUniqueId(),
    type: 'heart',
    x,
    y,
    width,
    height,
    fill: 'rgba(255, 255, 255, 0.1)',
    stroke: '#FFFFFF',
    strokeWidth: 1,
    rotation: 0,
    opacity: 100,
    // 하트 모양을 그리기 위한 SVG 경로 데이터
    pathData: `
      M ${width / 2} ${height * 0.15}
      C ${width * 0.1} ${height * -0.1}, ${width * -0.1} ${height * 0.5}, ${width / 2} ${height * 0.85}
      C ${width * 1.1} ${height * 0.5}, ${width * 0.9} ${height * -0.1}, ${width / 2} ${height * 0.15}
      Z
    `.trim().replace(/\s+/g, ' ')
  };
}; 