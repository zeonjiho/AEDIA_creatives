// 가상 데이터베이스 파일
// 모든 페이지에서 사용할 데이터를 정의합니다.

// 포지션 데이터 (직책 정보)
export const positions = {
  PRODUCER: { id: 'PRODUCER', name: '프로듀서', nameEn: 'Producer' },
  SENIOR_DIRECTOR: { id: 'SENIOR_DIRECTOR', name: '선임 디렉터', nameEn: 'Senior Director' },
  VISUAL_DESIGNER: { id: 'VISUAL_DESIGNER', name: '시각 디자이너', nameEn: 'Visual Designer' },
  MARKETING_MANAGER: { id: 'MARKETING_MANAGER', name: '마케팅 매니저', nameEn: 'Marketing Manager' },
  CINEMATOGRAPHER: { id: 'CINEMATOGRAPHER', name: '촬영 감독', nameEn: 'Cinematographer' },
  EDITOR: { id: 'EDITOR', name: '편집자', nameEn: 'Editor' },
  SOUND_DESIGNER: { id: 'SOUND_DESIGNER', name: '음향 디자이너', nameEn: 'Sound Designer' },
  LIGHTING_DIRECTOR: { id: 'LIGHTING_DIRECTOR', name: '조명 감독', nameEn: 'Lighting Director' },
};

// 부서 데이터
export const departments = {
  PLANNING: { id: 'PLANNING', name: '기획팀', nameEn: 'Planning Team' },
  DIRECTING: { id: 'DIRECTING', name: '연출팀', nameEn: 'Directing Team' },
  DESIGN: { id: 'DESIGN', name: '디자인팀', nameEn: 'Design Team' },
  MARKETING: { id: 'MARKETING', name: '마케팅팀', nameEn: 'Marketing Team' },
  CAMERA: { id: 'CAMERA', name: '촬영팀', nameEn: 'Camera Team' },
  EDITING: { id: 'EDITING', name: '편집팀', nameEn: 'Editing Team' },
  SOUND: { id: 'SOUND', name: '음향팀', nameEn: 'Sound Team' },
};

// 사용자 데이터
export const users = [
  { id: 1, name: '김민준', position: positions.PRODUCER.id, department: departments.PLANNING.id, email: 'minjun.kim@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: 2, name: '이서연', position: positions.SENIOR_DIRECTOR.id, department: departments.DIRECTING.id, email: 'seoyeon.lee@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: 3, name: '박지훈', position: positions.VISUAL_DESIGNER.id, department: departments.DESIGN.id, email: 'jihoon.park@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: 4, name: '최수아', position: positions.MARKETING_MANAGER.id, department: departments.MARKETING.id, email: 'sua.choi@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: 5, name: '정도윤', position: positions.CINEMATOGRAPHER.id, department: departments.CAMERA.id, email: 'doyoon.jung@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { id: 6, name: '한지민', position: positions.EDITOR.id, department: departments.EDITING.id, email: 'jimin.han@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { id: 7, name: '윤성호', position: positions.SOUND_DESIGNER.id, department: departments.SOUND.id, email: 'sungho.yoon@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { id: 8, name: '송하은', position: positions.LIGHTING_DIRECTOR.id, department: departments.CAMERA.id, email: 'haeun.song@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
];

// 현재 로그인한 사용자
export const currentUser = users[0];

// 할 일 목록 데이터
export const todos = [
  { id: 1, userId: 1, text: '클라이언트 킥오프 미팅 준비', completed: false, dueDate: '2023-03-10' },
  { id: 2, userId: 1, text: '프로젝트 예산안 검토', completed: true, dueDate: '2023-03-08' },
  { id: 3, userId: 2, text: '스토리보드 검토 회의', completed: false, dueDate: '2023-03-12' },
  { id: 4, userId: 3, text: '타이틀 시퀀스 디자인 완성', completed: false, dueDate: '2023-03-15' },
  { id: 5, userId: 4, text: '마케팅 캠페인 전략 수립', completed: true, dueDate: '2023-03-07' },
  { id: 6, userId: 5, text: '촬영 장비 점검 및 예약', completed: false, dueDate: '2023-03-14' },
  { id: 7, userId: 6, text: '러프 컷 편집 완료', completed: false, dueDate: '2023-03-18' },
  { id: 8, userId: 7, text: '음향 효과 라이브러리 구축', completed: true, dueDate: '2023-03-05' },
];

// 캘린더 이벤트 데이터
export const events = [
  { id: 1, title: '주간 제작 회의', start: '2023-03-06T10:00:00', end: '2023-03-06T11:00:00', location: '회의실 A', participants: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 2, title: '브랜드 광고 프로젝트 킥오프', start: '2023-03-08T14:00:00', end: '2023-03-08T16:00:00', location: '회의실 B', participants: [1, 2, 5, 6] },
  { id: 3, title: '클라이언트 피드백 미팅', start: '2023-03-10T11:00:00', end: '2023-03-10T12:30:00', location: '회의실 C', participants: [1, 4] },
  { id: 4, title: '콘셉트 디자인 리뷰', start: '2023-03-13T15:00:00', end: '2023-03-13T16:00:00', location: '회의실 A', participants: [1, 2, 3] },
  { id: 5, title: '팀 빌딩 워크숍', start: '2023-03-17T13:00:00', end: '2023-03-17T17:00:00', location: '외부 스튜디오', participants: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 6, title: '촬영 준비 회의', start: '2023-03-15T10:00:00', end: '2023-03-15T11:30:00', location: '회의실 B', participants: [1, 2, 5, 8] },
  { id: 7, title: '편집 리뷰 세션', start: '2023-03-20T14:00:00', end: '2023-03-20T16:00:00', location: '편집실', participants: [1, 2, 6] },
  { id: 8, title: '사운드 믹싱 세션', start: '2023-03-22T11:00:00', end: '2023-03-22T13:00:00', location: '음향 스튜디오', participants: [2, 7] },
];

// 회의실 데이터
export const rooms = [
  { id: 1, name: '회의실 A', capacity: 10, facilities: ['프로젝터', '화이트보드', '화상회의 장비'] },
  { id: 2, name: '회의실 B', capacity: 6, facilities: ['화이트보드', '화상회의 장비'] },
  { id: 3, name: '회의실 C', capacity: 4, facilities: ['화이트보드'] },
  { id: 4, name: '편집실', capacity: 3, facilities: ['편집 워크스테이션', '모니터링 시스템'] },
  { id: 5, name: '음향 스튜디오', capacity: 4, facilities: ['녹음 장비', '믹싱 콘솔', '모니터 스피커'] },
  { id: 6, name: '촬영 스튜디오', capacity: 15, facilities: ['그린 스크린', '조명 장비', '카메라 리그'] },
];

// 회의실 예약 데이터
export const roomReservations = [
  { id: 1, roomId: 1, userId: 1, title: '주간 제작 회의', start: '2023-03-06T10:00:00', end: '2023-03-06T11:00:00', participants: [1, 2, 3, 4, 5, 6, 7, 8] },
  { id: 2, roomId: 2, userId: 1, title: '브랜드 광고 프로젝트 킥오프', start: '2023-03-08T14:00:00', end: '2023-03-08T16:00:00', participants: [1, 2, 5, 6] },
  { id: 3, roomId: 3, userId: 4, title: '클라이언트 피드백 미팅', start: '2023-03-10T11:00:00', end: '2023-03-10T12:30:00', participants: [1, 4] },
  { id: 4, roomId: 1, title: '콘셉트 디자인 리뷰', start: '2023-03-13T15:00:00', end: '2023-03-13T16:00:00', participants: [1, 2, 3] },
  { id: 5, roomId: 2, userId: 1, title: '촬영 준비 회의', start: '2023-03-15T10:00:00', end: '2023-03-15T11:30:00', participants: [1, 2, 5, 8] },
  { id: 6, roomId: 4, userId: 6, title: '편집 리뷰 세션', start: '2023-03-20T14:00:00', end: '2023-03-20T16:00:00', participants: [1, 2, 6] },
  { id: 7, roomId: 5, userId: 7, title: '사운드 믹싱 세션', start: '2023-03-22T11:00:00', end: '2023-03-22T13:00:00', participants: [2, 7] },
  { id: 8, roomId: 6, userId: 5, title: '제품 촬영 세션', start: '2023-03-25T09:00:00', end: '2023-03-25T17:00:00', participants: [1, 5, 8] },
];

// 프로젝트 데이터
export const projects = [
  { 
    id: 1, 
    title: '럭셔리 브랜드 광고 캠페인', 
    description: '럭셔리 패션 브랜드의 신제품 라인을 위한 30초 광고 제작',
    createdAt: '2023-02-15',
    deadline: '2023-04-30',
    status: '진행 중',
    tasks: [
      { id: 1, title: '컨셉 기획 및 스토리보드 작성', status: '완료', assigneeId: 2, deadline: '2023-02-28', createdAt: '2023-02-15' },
      { id: 2, title: '촬영 장소 섭외', status: '완료', assigneeId: 1, deadline: '2023-03-10', createdAt: '2023-02-20' },
      { id: 3, title: '모델 캐스팅', status: '완료', assigneeId: 4, deadline: '2023-03-15', createdAt: '2023-02-25' },
      { id: 4, title: '촬영 준비 및 장비 점검', status: '진행 중', assigneeId: 5, deadline: '2023-03-20', createdAt: '2023-03-01' },
      { id: 5, title: '메인 촬영', status: '할 일', assigneeId: 5, deadline: '2023-04-05', createdAt: '2023-03-10' },
      { id: 6, title: '편집 및 VFX', status: '할 일', assigneeId: 6, deadline: '2023-04-20', createdAt: '2023-03-15' },
      { id: 7, title: '음향 디자인 및 믹싱', status: '할 일', assigneeId: 7, deadline: '2023-04-25', createdAt: '2023-03-15' },
      { id: 8, title: '최종 마스터링 및 납품', status: '할 일', assigneeId: 1, deadline: '2023-04-30', createdAt: '2023-03-15' },
    ]
  },
  { 
    id: 2, 
    title: '기업 홍보 다큐멘터리', 
    description: '친환경 에너지 기업의 10주년 기념 다큐멘터리 제작',
    createdAt: '2023-03-01',
    deadline: '2023-06-30',
    status: '진행 중',
    tasks: [
      { id: 1, title: '기획 및 리서치', status: '완료', assigneeId: 1, deadline: '2023-03-15', createdAt: '2023-03-01' },
      { id: 2, title: '인터뷰 대상자 섭외', status: '진행 중', assigneeId: 4, deadline: '2023-04-15', createdAt: '2023-03-16' },
      { id: 3, title: '촬영 일정 조율', status: '진행 중', assigneeId: 1, deadline: '2023-04-20', createdAt: '2023-03-20' },
      { id: 4, title: '인터뷰 촬영', status: '할 일', assigneeId: 5, deadline: '2023-05-15', createdAt: '2023-03-25' },
      { id: 5, title: '현장 촬영', status: '할 일', assigneeId: 5, deadline: '2023-05-30', createdAt: '2023-03-25' },
      { id: 6, title: '편집 및 내레이션 녹음', status: '할 일', assigneeId: 6, deadline: '2023-06-15', createdAt: '2023-03-30' },
      { id: 7, title: '음향 작업 및 BGM 제작', status: '할 일', assigneeId: 7, deadline: '2023-06-25', createdAt: '2023-03-30' },
      { id: 8, title: '최종 검수 및 납품', status: '할 일', assigneeId: 1, deadline: '2023-06-30', createdAt: '2023-03-30' },
    ]
  },
  { 
    id: 3, 
    title: '뮤직비디오 제작', 
    description: '신인 아티스트의 데뷔 싱글 뮤직비디오 제작',
    createdAt: '2023-03-15',
    deadline: '2023-05-31',
    status: '계획',
    tasks: [
      { id: 1, title: '컨셉 회의 및 스토리보드 작성', status: '할 일', assigneeId: 2, deadline: '2023-04-01', createdAt: '2023-03-15' },
      { id: 2, title: '촬영 장소 섭외', status: '할 일', assigneeId: 1, deadline: '2023-04-15', createdAt: '2023-03-15' },
      { id: 3, title: '안무가 및 댄서 섭외', status: '할 일', assigneeId: 4, deadline: '2023-04-15', createdAt: '2023-03-15' },
      { id: 4, title: '의상 및 소품 준비', status: '할 일', assigneeId: 3, deadline: '2023-04-20', createdAt: '2023-03-20' },
      { id: 5, title: '촬영', status: '할 일', assigneeId: 5, deadline: '2023-05-10', createdAt: '2023-03-20' },
      { id: 6, title: '편집 및 VFX', status: '할 일', assigneeId: 6, deadline: '2023-05-25', createdAt: '2023-03-20' },
      { id: 7, title: '컬러 그레이딩', status: '할 일', assigneeId: 6, deadline: '2023-05-28', createdAt: '2023-03-20' },
      { id: 8, title: '최종 마스터링 및 납품', status: '할 일', assigneeId: 1, deadline: '2023-05-31', createdAt: '2023-03-20' },
    ]
  },
  { 
    id: 4, 
    title: '웹 시리즈 제작', 
    description: '스타트업 기업을 위한 10부작 웹 시리즈 제작',
    createdAt: '2023-02-01',
    deadline: '2023-07-31',
    status: '진행 중',
    tasks: [
      { id: 1, title: '시나리오 작성', status: '완료', assigneeId: 2, deadline: '2023-03-15', createdAt: '2023-02-01' },
      { id: 2, title: '배우 캐스팅', status: '완료', assigneeId: 4, deadline: '2023-03-30', createdAt: '2023-02-15' },
      { id: 3, title: '촬영 장소 섭외', status: '완료', assigneeId: 1, deadline: '2023-04-15', createdAt: '2023-03-01' },
      { id: 4, title: '1-3화 촬영', status: '진행 중', assigneeId: 5, deadline: '2023-05-15', createdAt: '2023-04-01' },
      { id: 5, title: '4-6화 촬영', status: '할 일', assigneeId: 5, deadline: '2023-06-15', createdAt: '2023-04-01' },
      { id: 6, title: '7-10화 촬영', status: '할 일', assigneeId: 5, deadline: '2023-07-15', createdAt: '2023-04-01' },
      { id: 7, title: '편집 및 후반 작업', status: '할 일', assigneeId: 6, deadline: '2023-07-25', createdAt: '2023-04-15' },
      { id: 8, title: '최종 납품', status: '할 일', assigneeId: 1, deadline: '2023-07-31', createdAt: '2023-04-15' },
    ]
  },
];

// 알림 데이터
export const notifications = [
  { id: 1, title: '촬영 일정 알림', message: '내일 오전 9시 럭셔리 브랜드 광고 촬영이 스튜디오 A에서 진행됩니다.', type: '일반', recipients: 'all', read: false, createdAt: '2023-03-06T09:50:00' },
  { id: 2, title: '장비 대여 승인', message: '요청하신 RED Komodo 카메라 대여가 승인되었습니다. 내일 오전 8시부터 수령 가능합니다.', type: '중요', recipients: 'dev', read: true, createdAt: '2023-03-07T09:00:00' },
  { id: 3, title: '프로젝트 마감일 변경', message: '럭셔리 브랜드 광고 캠페인의 마감일이 5월 10일로 연장되었습니다.', type: '중요', recipients: 'all', read: false, createdAt: '2023-03-05T14:30:00' },
  { id: 4, title: '편집실 예약 확정', message: '편집실 예약이 3월 20일 14:00-16:00로 확정되었습니다.', type: '일반', recipients: 'design', read: false, createdAt: '2023-03-12T10:15:00' },
  { id: 5, title: '신규 장비 도입 안내', message: '새로운 DJI Ronin 4D 카메라 시스템이 도입되었습니다. 다음 주 수요일 교육 세션에 참석해주세요.', type: '공지사항', recipients: 'all', read: true, createdAt: '2023-03-01T09:00:00' },
  { id: 6, title: '클라이언트 피드백', message: '웹 시리즈 1화 러프컷에 대한 클라이언트 피드백이 도착했습니다. 확인 부탁드립니다.', type: '긴급', recipients: 'dev', read: false, createdAt: '2023-03-08T16:30:00' },
  { id: 7, title: '월간 회의 일정', message: '이번 달 전체 회의가 3월 25일 오후 2시에 진행됩니다. 프로젝트 진행 상황을 준비해주세요.', type: '공지사항', recipients: 'all', read: false, createdAt: '2023-03-10T11:00:00' },
  { id: 8, title: '음향 장비 점검', message: '스튜디오 음향 장비 정기 점검이 내일 오전에 진행됩니다. 해당 시간에는 녹음 작업이 불가합니다.', type: '일반', recipients: 'dev', read: true, createdAt: '2023-03-14T15:45:00' },
];

// 데이터 조회 함수들
// 프로젝트 목록 조회
export const getProjects = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...projects]);
    }, 300);
  });
};

// 알림 목록 조회
export const getNotifications = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...notifications]);
    }, 300);
  });
};

// 데이터 조작 함수들
// 실제 백엔드가 없으므로 로컬 상태를 변경하는 함수들을 제공합니다.

// 할 일 관련 함수
let todoIdCounter = todos.length + 1;

export const addTodo = (newTodo) => {
  const todoToAdd = {
    id: todoIdCounter++,
    ...newTodo,
    completed: false
  };
  todos.push(todoToAdd);
  return todoToAdd;
};

export const updateTodo = (id, updates) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index !== -1) {
    todos[index] = { ...todos[index], ...updates };
    return todos[index];
  }
  return null;
};

export const deleteTodo = (id) => {
  const index = todos.findIndex(todo => todo.id === id);
  if (index !== -1) {
    const deleted = todos[index];
    todos.splice(index, 1);
    return deleted;
  }
  return null;
};

// 캘린더 이벤트 관련 함수
let eventIdCounter = events.length + 1;

export const addEvent = (newEvent) => {
  const eventToAdd = {
    id: eventIdCounter++,
    ...newEvent
  };
  events.push(eventToAdd);
  return eventToAdd;
};

export const updateEvent = (id, updates) => {
  const index = events.findIndex(event => event.id === id);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    return events[index];
  }
  return null;
};

export const deleteEvent = (id) => {
  const index = events.findIndex(event => event.id === id);
  if (index !== -1) {
    const deleted = events[index];
    events.splice(index, 1);
    return deleted;
  }
  return null;
};

// 회의실 예약 관련 함수
let reservationIdCounter = roomReservations.length + 1;

export const addReservation = (newReservation) => {
  const reservationToAdd = {
    id: reservationIdCounter++,
    ...newReservation
  };
  roomReservations.push(reservationToAdd);
  return reservationToAdd;
};

export const updateReservation = (id, updates) => {
  const index = roomReservations.findIndex(reservation => reservation.id === id);
  if (index !== -1) {
    roomReservations[index] = { ...roomReservations[index], ...updates };
    return roomReservations[index];
  }
  return null;
};

export const deleteReservation = (id) => {
  const index = roomReservations.findIndex(reservation => reservation.id === id);
  if (index !== -1) {
    const deleted = roomReservations[index];
    roomReservations.splice(index, 1);
    return deleted;
  }
  return null;
};

// 프로젝트 관련 함수
let projectIdCounter = projects.length + 1;
let taskIdCounter = 10; // 초기 작업 ID 카운터

export const addProject = (newProject) => {
  const projectToAdd = {
    id: projectIdCounter++,
    ...newProject,
    tasks: newProject.tasks || []
  };
  projects.push(projectToAdd);
  return projectToAdd;
};

export const updateProject = (id, updates) => {
  const index = projects.findIndex(project => project.id === id);
  if (index !== -1) {
    // tasks 필드는 별도로 처리하여 기존 작업 목록을 유지
    const tasks = updates.tasks || projects[index].tasks;
    projects[index] = { ...projects[index], ...updates, tasks };
    return projects[index];
  }
  return null;
};

export const deleteProject = (id) => {
  const index = projects.findIndex(project => project.id === id);
  if (index !== -1) {
    const deleted = projects[index];
    projects.splice(index, 1);
    return deleted;
  }
  return null;
};

export const addTask = (projectId, newTask) => {
  const projectIndex = projects.findIndex(project => project.id === projectId);
  if (projectIndex !== -1) {
    const taskToAdd = {
      id: taskIdCounter++,
      ...newTask,
      assigneeId: newTask.assigneeId || currentUser.id
    };
    projects[projectIndex].tasks.push(taskToAdd);
    return projects[projectIndex];
  }
  return null;
};

export const updateTask = (projectId, taskId, updates) => {
  const projectIndex = projects.findIndex(project => project.id === projectId);
  if (projectIndex !== -1) {
    const taskIndex = projects[projectIndex].tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      projects[projectIndex].tasks[taskIndex] = { 
        ...projects[projectIndex].tasks[taskIndex], 
        ...updates 
      };
      return projects[projectIndex];
    }
  }
  return null;
};

export const deleteTask = (projectId, taskId) => {
  const projectIndex = projects.findIndex(project => project.id === projectId);
  if (projectIndex !== -1) {
    const taskIndex = projects[projectIndex].tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      projects[projectIndex].tasks.splice(taskIndex, 1);
      return projects[projectIndex];
    }
  }
  return null;
};

// 알림 관련 함수
let notificationIdCounter = notifications.length + 1;

export const addNotification = (newNotification) => {
  const notificationToAdd = {
    id: notificationIdCounter++,
    ...newNotification,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notificationToAdd);
  return notificationToAdd;
};

export const markNotificationAsRead = (id) => {
  const index = notifications.findIndex(notification => notification.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    return notifications[index];
  }
  return null;
};

export const deleteNotification = (id) => {
  const index = notifications.findIndex(notification => notification.id === id);
  if (index !== -1) {
    const deleted = notifications[index];
    notifications.splice(index, 1);
    return deleted;
  }
  return null;
}; 