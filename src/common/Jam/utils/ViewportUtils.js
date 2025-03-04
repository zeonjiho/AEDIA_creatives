// 마우스 위치 계산 함수
export const getMousePosition = (e, workspaceRef, viewportOffset, scale) => {
  if (!workspaceRef.current) return { x: 0, y: 0 };
  
  // 성능 최적화: 매번 getBoundingClientRect를 호출하지 않고 캐싱된 값 사용
  const rect = workspaceRef.current.getBoundingClientRect();
  
  // 클라이언트 좌표에서 캔버스 좌표로 변환
  // 주의: viewportOffset은 이미 캔버스에 적용된 상태이므로 역변환 필요
  const x = (e.clientX - rect.left) / scale - viewportOffset.x / scale;
  const y = (e.clientY - rect.top) / scale - viewportOffset.y / scale;
  
  return { x, y };
};

// 줌 인 함수
export const zoomIn = (scale, viewportOffset, workspaceRef) => {
  if (!workspaceRef.current) return { scale, viewportOffset };
  
  const newScale = Math.min(scale * 1.2, 5); // 20% 증가, 최대 5배
  
  if (Math.abs(newScale - scale) < 0.01) return { scale, viewportOffset };
  
  const rect = workspaceRef.current.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // 줌 중심점 계산 개선
  const pointXBeforeZoom = (centerX - viewportOffset.x) / scale;
  const pointYBeforeZoom = (centerY - viewportOffset.y) / scale;
  
  // 새 오프셋 계산 개선
  const newOffsetX = centerX - pointXBeforeZoom * newScale;
  const newOffsetY = centerY - pointYBeforeZoom * newScale;
  
  return {
    scale: newScale,
    viewportOffset: {
      x: newOffsetX,
      y: newOffsetY
    }
  };
};

// 줌 아웃 함수
export const zoomOut = (scale, viewportOffset, workspaceRef) => {
  if (!workspaceRef.current) return { scale, viewportOffset };
  
  const newScale = Math.max(scale / 1.2, 0.1); // 20% 감소, 최소 0.1배
  
  if (Math.abs(newScale - scale) < 0.01) return { scale, viewportOffset };
  
  const rect = workspaceRef.current.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // 줌 중심점 계산 개선
  const pointXBeforeZoom = (centerX - viewportOffset.x) / scale;
  const pointYBeforeZoom = (centerY - viewportOffset.y) / scale;
  
  // 새 오프셋 계산 개선
  const newOffsetX = centerX - pointXBeforeZoom * newScale;
  const newOffsetY = centerY - pointYBeforeZoom * newScale;
  
  return {
    scale: newScale,
    viewportOffset: {
      x: newOffsetX,
      y: newOffsetY
    }
  };
};

// 마우스 휠 이벤트로 줌 처리 함수
export const handleWheelZoom = (e, scale, viewportOffset, workspaceRef) => {
  if (!workspaceRef.current || !e.ctrlKey) return { scale, viewportOffset };
  
  e.preventDefault(); // 브라우저 기본 줌 동작 방지
  
  const rect = workspaceRef.current.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 줌 중심점 계산 개선 - 마우스 위치 기준
  const pointXBeforeZoom = (mouseX - viewportOffset.x) / scale;
  const pointYBeforeZoom = (mouseY - viewportOffset.y) / scale;

  // 줌 비율 계산 개선
  const delta = e.deltaY < 0 ? 1.1 : 0.9; // 휠 업: 확대, 휠 다운: 축소
  const newScale = Math.min(Math.max(scale * delta, 0.1), 5); // 최소 0.1배, 최대 5배

  // 새 오프셋 계산 개선
  const newOffsetX = mouseX - pointXBeforeZoom * newScale;
  const newOffsetY = mouseY - pointYBeforeZoom * newScale;

  return {
    scale: newScale,
    viewportOffset: {
      x: newOffsetX,
      y: newOffsetY
    }
  };
};

// 패닝 처리 함수
export const handlePanning = (e, lastMousePos, viewportOffset) => {
  const dx = e.clientX - lastMousePos.x;
  const dy = e.clientY - lastMousePos.y;
  
  return {
    viewportOffset: {
      x: viewportOffset.x + dx,
      y: viewportOffset.y + dy
    },
    lastMousePos: {
      x: e.clientX,
      y: e.clientY
    }
  };
};

// 화면 중앙으로 이동 함수
export const centerViewport = (workspaceRef, scale) => {
  if (!workspaceRef.current) return { x: 0, y: 0 };
  
  const rect = workspaceRef.current.getBoundingClientRect();
  
  return {
    x: rect.width / 2 - 50000 * scale / 2,
    y: rect.height / 2 - 50000 * scale / 2
  };
};

// 특정 요소로 뷰포트 이동 함수
export const focusOnElement = (element, workspaceRef, scale) => {
  if (!workspaceRef.current || !element) return { x: 0, y: 0 };
  
  const rect = workspaceRef.current.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  return {
    x: centerX - (element.x + element.width / 2) * scale,
    y: centerY - (element.y + element.height / 2) * scale
  };
}; 