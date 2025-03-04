/**
 * 프로젝트 관련 유틸리티 함수
 */

// 로컬 스토리지에서 모든 프로젝트 목록 가져오기
export const getAllProjects = () => {
  try {
    const projectsJson = localStorage.getItem('hyper_jam_projects');
    if (!projectsJson) return [];
    
    const projects = JSON.parse(projectsJson);
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error('프로젝트 목록을 불러오는 중 오류 발생:', error);
    return [];
  }
};

// 최근 프로젝트 목록 가져오기 (최대 10개)
export const getRecentProjects = () => {
  const allProjects = getAllProjects();
  return allProjects
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, 10);
};

// 프로젝트 저장하기
export const saveProject = (name, elements, connections, viewportOffset, scale, backgroundStyle) => {
  try {
    const allProjects = getAllProjects();
    
    // 프로젝트 ID 생성 (타임스탬프 + 랜덤 문자열)
    const projectId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 썸네일 생성 (캔버스 스냅샷)
    const thumbnail = generateThumbnail(elements);
    
    // 새 프로젝트 객체 생성
    const newProject = {
      id: projectId,
      name,
      elements,
      connections,
      viewportOffset,
      scale,
      backgroundStyle,
      thumbnail,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      color: getRandomColor()
    };
    
    // 기존 프로젝트 중 같은 이름이 있는지 확인
    const existingProjectIndex = allProjects.findIndex(p => p.name === name);
    
    if (existingProjectIndex >= 0) {
      // 기존 프로젝트 업데이트
      newProject.id = allProjects[existingProjectIndex].id;
      newProject.createdAt = allProjects[existingProjectIndex].createdAt;
      allProjects[existingProjectIndex] = newProject;
    } else {
      // 새 프로젝트 추가
      allProjects.push(newProject);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('hyper_jam_projects', JSON.stringify(allProjects));
    
    return newProject;
  } catch (error) {
    console.error('프로젝트 저장 중 오류 발생:', error);
    throw new Error('프로젝트를 저장할 수 없습니다.');
  }
};

// 프로젝트 불러오기
export const loadProject = (projectId) => {
  try {
    const allProjects = getAllProjects();
    const project = allProjects.find(p => p.id === projectId);
    
    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    
    // 마지막 수정 시간 업데이트
    project.lastModified = new Date().toISOString();
    
    // 로컬 스토리지 업데이트
    localStorage.setItem('hyper_jam_projects', JSON.stringify(allProjects));
    
    return project;
  } catch (error) {
    console.error('프로젝트 불러오기 중 오류 발생:', error);
    throw new Error('프로젝트를 불러올 수 없습니다.');
  }
};

// 프로젝트 삭제
export const deleteProject = (projectId) => {
  try {
    const allProjects = getAllProjects();
    const filteredProjects = allProjects.filter(p => p.id !== projectId);
    
    if (filteredProjects.length === allProjects.length) {
      throw new Error('프로젝트를 찾을 수 없습니다.');
    }
    
    localStorage.setItem('hyper_jam_projects', JSON.stringify(filteredProjects));
    return true;
  } catch (error) {
    console.error('프로젝트 삭제 중 오류 발생:', error);
    throw new Error('프로젝트를 삭제할 수 없습니다.');
  }
};

// 프로젝트 내보내기 (JSON 파일)
export const exportProject = (project) => {
  try {
    const projectJson = JSON.stringify(project, null, 2);
    const blob = new Blob([projectJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('프로젝트 내보내기 중 오류 발생:', error);
    throw new Error('프로젝트를 내보낼 수 없습니다.');
  }
};

// 프로젝트 가져오기 (JSON 파일)
export const importProject = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const projectData = JSON.parse(event.target.result);
          
          // 필수 필드 검증
          if (!projectData.name || !projectData.elements) {
            reject(new Error('유효하지 않은 프로젝트 파일입니다.'));
            return;
          }
          
          // 새 ID 생성 및 시간 업데이트
          projectData.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          projectData.lastModified = new Date().toISOString();
          
          // 썸네일이 없으면 생성
          if (!projectData.thumbnail) {
            projectData.thumbnail = generateThumbnail(projectData.elements);
          }
          
          // 프로젝트 저장
          const allProjects = getAllProjects();
          allProjects.push(projectData);
          localStorage.setItem('hyper_jam_projects', JSON.stringify(allProjects));
          
          resolve(projectData);
        } catch (error) {
          reject(new Error('프로젝트 파일을 파싱할 수 없습니다.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };
      
      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

// 썸네일 생성 (캔버스 요소 기반)
const generateThumbnail = (elements) => {
  try {
    // 요소가 없으면 null 반환
    if (!elements || elements.length === 0) return null;
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // 배경 그리기
    ctx.fillStyle = '#1E1E1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 요소 경계 계산
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    elements.forEach(element => {
      const { x, y, width, height } = element;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    // 경계가 유효하지 않으면 기본 이미지 반환
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      return null;
    }
    
    // 스케일 계산 (모든 요소가 썸네일에 맞도록)
    const elementWidth = maxX - minX;
    const elementHeight = maxY - minY;
    const scaleX = (canvas.width - 40) / elementWidth;
    const scaleY = (canvas.height - 40) / elementHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 최대 1배
    
    // 중앙 위치 계산
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const elementCenterX = minX + elementWidth / 2;
    const elementCenterY = minY + elementHeight / 2;
    
    // 요소 그리기
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-elementCenterX, -elementCenterY);
    
    elements.forEach(element => {
      if (element.type === 'rectangle') {
        ctx.fillStyle = element.fill || '#4A90E2';
        ctx.strokeStyle = element.stroke || 'transparent';
        ctx.lineWidth = element.strokeWidth || 0;
        
        ctx.beginPath();
        ctx.rect(element.x, element.y, element.width, element.height);
        ctx.fill();
        if (element.strokeWidth > 0) ctx.stroke();
      } else if (element.type === 'ellipse') {
        ctx.fillStyle = element.fill || '#4A90E2';
        ctx.strokeStyle = element.stroke || 'transparent';
        ctx.lineWidth = element.strokeWidth || 0;
        
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radiusX = element.width / 2;
        const radiusY = element.height / 2;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        if (element.strokeWidth > 0) ctx.stroke();
      } else if (element.type === 'text') {
        ctx.fillStyle = element.fill || '#FFFFFF';
        ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
        ctx.textBaseline = 'top';
        
        ctx.fillText(element.text || '', element.x, element.y);
      }
    });
    
    ctx.restore();
    
    // 캔버스를 데이터 URL로 변환
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('썸네일 생성 중 오류 발생:', error);
    return null;
  }
};

// 랜덤 색상 생성
const getRandomColor = () => {
  const colors = [
    '#4A90E2', '#50E3C2', '#F5A623', '#D0021B', '#9013FE',
    '#7ED321', '#B8E986', '#BD10E0', '#8B572A', '#417505'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}; 