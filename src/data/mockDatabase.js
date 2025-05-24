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
export const users = [{
        id: 1,
        name: '김민준',
        position: positions.PRODUCER.id,
        department: departments.PLANNING.id,
        email: 'minjun.kim@aedia.com',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        phone: '010-1234-5678',
        bio: '10년 경력의 프로듀서로서 다양한 기업 홍보 영상과 광고 캠페인을 성공적으로 진행했습니다. 창의적인 아이디어와 효율적인 프로젝트 관리를 통해 최고의 결과물을 만들어내는 것을 목표로 합니다.',
        role: '프로듀서',
        joinDate: '2018-03-15'
    },
    { id: 2, name: '이서연', position: positions.SENIOR_DIRECTOR.id, department: departments.DIRECTING.id, email: 'seoyeon.lee@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { id: 3, name: '박지훈', position: positions.VISUAL_DESIGNER.id, department: departments.DESIGN.id, email: 'jihoon.park@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { id: 4, name: '최수아', position: positions.MARKETING_MANAGER.id, department: departments.MARKETING.id, email: 'sua.choi@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
    { id: 5, name: '정도윤', position: positions.CINEMATOGRAPHER.id, department: departments.CAMERA.id, email: 'doyoon.jung@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
    { id: 6, name: '한지민', position: positions.EDITOR.id, department: departments.EDITING.id, email: 'jimin.han@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
    { id: 7, name: '윤성호', position: positions.SOUND_DESIGNER.id, department: departments.SOUND.id, email: 'sungho.yoon@aedia.com', avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
    { id: 8, name: '송하은', position: positions.LIGHTING_DIRECTOR.id, department: departments.CAMERA.id, email: 'haeun.song@aedia.com', avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
];

// 현재 로그인한 사용자 - 확장된 정보 포함
export const currentUser = {
    ...users[0],
    username: 'minjun.kim',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    department: departments.PLANNING.name,
    role: positions.PRODUCER.name,
    phone: '010-1234-5678',
    bio: '10년 경력의 프로듀서로서 다양한 기업 홍보 영상과 광고 캠페인을 성공적으로 진행했습니다. 창의적인 아이디어와 효율적인 프로젝트 관리를 통해 최고의 결과물을 만들어내는 것을 목표로 합니다.',
    joinDate: '2018-03-15',
    skills: ['프로젝트 관리', '예산 기획', '클라이언트 커뮤니케이션', '콘텐츠 기획'],
    education: '한국대학교 영상제작학과',
    address: '서울시 강남구',
    emergencyContact: '010-9876-5432'
};

// 할 일 목록 데이터
export const todos = [
    { id: 1, userId: 1, text: '클라이언트 킥오프 미팅 준비', completed: false, dueDate: '2023-03-10', dueTime: '14:00' },
    { id: 2, userId: 1, text: '프로젝트 예산안 검토', completed: true, dueDate: '2023-03-08', dueTime: '10:30' },
    { id: 3, userId: 2, text: '스토리보드 검토 회의', completed: false, dueDate: '2023-03-12', dueTime: '15:00' },
    { id: 4, userId: 3, text: '타이틀 시퀀스 디자인 완성', completed: false, dueDate: '2023-03-15', dueTime: null },
    { id: 5, userId: 4, text: '마케팅 캠페인 전략 수립', completed: true, dueDate: '2023-03-07', dueTime: '09:00' },
    { id: 6, userId: 5, text: '촬영 장비 점검 및 예약', completed: false, dueDate: '2023-03-14', dueTime: null },
    { id: 7, userId: 6, text: '러프 컷 편집 완료', completed: false, dueDate: '2023-03-18', dueTime: '17:00' },
    { id: 8, userId: 7, text: '음향 효과 라이브러리 구축', completed: true, dueDate: '2023-03-05', dueTime: '13:30' },
];

// 프로젝트 상태 데이터
export const projectStatuses = {
    KICKOFF: { id: 1, name: 'Kickoff', color: 'var(--status-kickoff)' },
    PRE_PRODUCTION: { id: 2, name: 'Pre-production', color: 'var(--status-pre-production)' },
    PRODUCTION: { id: 3, name: 'Production', color: 'var(--status-production)' },
    POST_PRODUCTION: { id: 4, name: 'Post-production', color: 'var(--status-post-production)' },
    DELIVERY: { id: 5, name: 'Delivery', color: 'var(--status-delivery)' },
    REVIEW: { id: 6, name: 'Review', color: 'var(--status-review)' },
    IN_PROGRESS: { id: 7, name: 'In Progress', color: 'var(--status-in-progress)' },
    COMPLETED: { id: 8, name: 'Completed', color: 'var(--status-completed)' },
    ON_HOLD: { id: 9, name: 'On Hold', color: 'var(--status-on-hold)' },
    CANCELLED: { id: 10, name: 'Cancelled', color: 'var(--status-cancelled)' }
};

// 캘린더 이벤트 데이터
export const events = [
    { id: 1, title: '주간 제작 회의', start: '2023-03-06T10:00:00', end: '2023-03-06T11:00:00', location: '회의실 A', participants: [1, 2, 3, 4, 5, 6, 7, 8], colorTag: 1, projectId: 1, projectStatus: projectStatuses.IN_PROGRESS.id },
    { id: 2, title: '브랜드 광고 프로젝트 킥오프', start: '2023-03-08T14:00:00', end: '2023-03-08T16:00:00', location: '회의실 B', participants: [1, 2, 5, 6], colorTag: 2, projectId: 2, projectStatus: projectStatuses.KICKOFF.id },
    { id: 3, title: '클라이언트 피드백 미팅', start: '2023-03-10T11:00:00', end: '2023-03-10T12:30:00', location: '회의실 C', participants: [1, 4], colorTag: 3, projectId: 3, projectStatus: projectStatuses.REVIEW.id },
    { id: 4, title: '콘셉트 디자인 리뷰', start: '2023-03-13T15:00:00', end: '2023-03-13T16:00:00', location: '회의실 A', participants: [1, 2, 3], colorTag: 4, projectId: 1, projectStatus: projectStatuses.PRE_PRODUCTION.id },
    { id: 5, title: '팀 빌딩 워크숍', start: '2023-03-17T13:00:00', end: '2023-03-17T17:00:00', location: '외부 스튜디오', participants: [1, 2, 3, 4, 5, 6, 7, 8], colorTag: 5, projectId: 4, projectStatus: projectStatuses.IN_PROGRESS.id },
    { id: 6, title: '촬영 준비 회의', start: '2023-03-15T10:00:00', end: '2023-03-15T11:30:00', location: '회의실 B', participants: [1, 2, 5, 8], colorTag: 6, projectId: 2, projectStatus: projectStatuses.PRE_PRODUCTION.id },
    { id: 7, title: '편집 리뷰 세션', start: '2023-03-20T14:00:00', end: '2023-03-20T16:00:00', location: '편집실', participants: [1, 2, 6], colorTag: 7, projectId: 3, projectStatus: projectStatuses.POST_PRODUCTION.id },
    { id: 8, title: '사운드 믹싱 세션', start: '2023-03-22T11:00:00', end: '2023-03-22T13:00:00', location: '음향 스튜디오', participants: [2, 7], colorTag: 8, projectId: 3, projectStatus: projectStatuses.POST_PRODUCTION.id },
];

// 회의실 데이터
export const rooms = [
    { id: 1, name: '3F 회의실 A', capacity: 10, facilities: ['프로젝터', '화이트보드', '화상회의 장비'] },
    { id: 2, name: '3F 회의실 B', capacity: 8, facilities: ['프로젝터', '화상회의 장비'] },
    { id: 3, name: '4F 회의실 A', capacity: 4, facilities: ['화이트보드'] },
    { id: 4, name: '4F 회의실 B', capacity: 3, facilities: ['편집 워크스테이션', '모니터링 시스템'] },
    { id: 5, name: '음향 스튜디오', capacity: 4, facilities: ['음향 시스템', '녹음 장비'] },
    { id: 6, name: '촬영 스튜디오', capacity: 15, facilities: ['조명 장비', '크로마키 월', '카메라 리그'] },
];

// 회의실 예약 데이터
export let roomReservations = [
    { id: 1, roomId: 1, userId: 1, title: '주간 제작 회의', start: '2023-03-06T10:00:00', end: '2023-03-06T11:00:00', participants: [1, 2, 3, 4, 5, 6, 7, 8], project: '기업 홍보 영상' },
    { id: 2, roomId: 2, userId: 1, title: '브랜드 광고 프로젝트 킥오프', start: '2023-03-08T14:00:00', end: '2023-03-08T16:00:00', participants: [1, 2, 5, 6], project: '신제품 광고' },
    { id: 3, roomId: 3, userId: 4, title: '클라이언트 피드백 미팅', start: '2023-03-10T11:00:00', end: '2023-03-10T12:30:00', participants: [1, 4], project: '웹 시리즈' },
    { id: 4, roomId: 1, title: '콘셉트 디자인 리뷰', start: '2023-03-13T15:00:00', end: '2023-03-13T16:00:00', participants: [1, 2, 3], project: '기업 홍보 영상' },
    { id: 5, roomId: 2, userId: 1, title: '촬영 준비 회의', start: '2023-03-15T10:00:00', end: '2023-03-15T11:30:00', participants: [1, 2, 5, 8], project: '신제품 광고' },
    { id: 6, roomId: 4, userId: 6, title: '편집 리뷰 세션', start: '2023-03-20T14:00:00', end: '2023-03-20T16:00:00', participants: [1, 2, 6], project: '웹 시리즈' },
    { id: 7, roomId: 5, userId: 7, title: '사운드 믹싱 세션', start: '2023-03-22T11:00:00', end: '2023-03-22T13:00:00', participants: [2, 7], project: '웹 시리즈' },
    { id: 8, roomId: 6, userId: 5, title: '제품 촬영 세션', start: '2023-03-25T09:00:00', end: '2023-03-25T17:00:00', participants: [1, 5, 8], project: '신제품 광고' },
];

// 예약 ID 카운터
let reservationIdCounter = roomReservations.length + 1;

// 예약 추가 함수
export const addReservation = (newReservation) => {
    console.log("Adding new reservation:", newReservation);
    const reservationToAdd = {
        id: reservationIdCounter++,
        ...newReservation,
        project: newReservation.project || '일반 회의'
    };

    // 전역 배열에 새 예약 추가
    roomReservations.push(reservationToAdd);
    console.log("Updated reservations:", roomReservations);

    return reservationToAdd;
};

// 예약 수정 함수
export const updateReservation = (id, updates) => {
    console.log(`Updating reservation ${id}:`, updates);
    const index = roomReservations.findIndex(reservation => reservation.id === id);
    if (index !== -1) {
        roomReservations[index] = {...roomReservations[index], ...updates };
        console.log("Updated reservations:", roomReservations);
        return roomReservations[index];
    }
    return null;
};

// 예약 삭제 함수
export const deleteReservation = (id) => {
    console.log(`Deleting reservation ${id}`);
    const index = roomReservations.findIndex(reservation => reservation.id === id);
    if (index !== -1) {
        const deleted = roomReservations[index];
        roomReservations.splice(index, 1);
        console.log("Updated reservations:", roomReservations);
        return deleted;
    }
    return null;
};

// 예약 조회 함수
export const getReservations = () => {
    return [...roomReservations];
};

// 특정 회의실의 예약 조회
export const getReservationsByRoomId = (roomId) => {
    return roomReservations.filter(reservation => reservation.roomId === roomId);
};

// 특정 날짜의 예약 조회
export const getReservationsByDate = (date) => {
    const targetDate = new Date(date);
    return roomReservations.filter(reservation => {
        const reservationDate = new Date(reservation.start);
        return (
            reservationDate.getFullYear() === targetDate.getFullYear() &&
            reservationDate.getMonth() === targetDate.getMonth() &&
            reservationDate.getDate() === targetDate.getDate()
        );
    });
};

// 프로젝트 데이터
export const projects = [{
        id: 1,
        title: '기업 홍보 영상',
        description: '대기업 연간 홍보 영상 제작',
        startDate: '2023-03-01',
        endDate: '2023-04-15',
        deadline: '2023-04-15',
        status: 'pre-production',
        manager: 1,
        team: [1, 2, 3, 5, 6, 7],
        budget: 50000000,
        client: '대한기업',
        colorTag: 1
    },
    {
        id: 2,
        title: '신제품 광고',
        description: '신제품 출시 TV 광고 캠페인',
        startDate: '2023-03-05',
        endDate: '2023-05-10',
        deadline: '2023-05-10',
        status: 'kickoff',
        manager: 2,
        team: [1, 2, 4, 5, 8],
        budget: 80000000,
        client: '테크놀로지 주식회사',
        colorTag: 2
    },
    {
        id: 3,
        title: '웹 시리즈',
        description: '10부작 웹 시리즈 제작',
        startDate: '2023-02-15',
        endDate: '2023-06-30',
        deadline: '2023-06-30',
        status: 'production',
        manager: 1,
        team: [1, 2, 3, 4, 6, 7, 8],
        budget: 120000000,
        client: '스트리밍 플랫폼 A',
        colorTag: 3
    },
    {
        id: 4,
        title: '다큐멘터리',
        description: '환경 다큐멘터리 시리즈',
        startDate: '2023-01-10',
        endDate: '2023-07-20',
        deadline: '2023-07-20',
        status: 'pre-production',
        manager: 3,
        team: [1, 3, 5, 7, 8],
        budget: 90000000,
        client: '방송국 B',
        colorTag: 4
    },
    {
        id: 5,
        title: '모바일 앱 홍보 영상',
        description: '새로운 모바일 앱 런칭 영상',
        startDate: '2023-03-20',
        endDate: '2023-04-30',
        deadline: '2023-04-30',
        status: 'in-progress',
        manager: 2,
        team: [1, 2, 3, 4, 6],
        budget: 35000000,
        client: '스타트업 C',
        colorTag: 5
    },
    {
        id: 6,
        title: '브랜드 캠페인',
        description: '글로벌 브랜드 이미지 캠페인',
        startDate: '2023-04-01',
        endDate: '2023-06-15',
        deadline: '2023-06-15',
        status: 'review',
        manager: 1,
        team: [1, 2, 4, 5, 7, 8],
        budget: 150000000,
        client: '글로벌 브랜드 D',
        colorTag: 6
    }
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

// 프로젝트 캘린더 이벤트 데이터
export const projectEvents = [{
        id: 1,
        title: '럭셔리 브랜드 광고 캠페인 - 컨셉 기획',
        start: '2023-03-06T10:00:00',
        end: '2023-03-06T17:00:00',
        projectId: 1,
        taskId: 1,
        assigneeId: 2,
        colorTag: 1,
        description: '럭셔리 패션 브랜드의 신제품 라인을 위한 컨셉 기획 및 스토리보드 작성',
        location: '회의실 A'
    },
    {
        id: 2,
        title: '럭셔리 브랜드 광고 캠페인 - 촬영 장소 섭외',
        start: '2023-03-08T09:00:00',
        end: '2023-03-10T18:00:00',
        projectId: 1,
        taskId: 2,
        assigneeId: 1,
        colorTag: 1,
        description: '럭셔리 패션 브랜드 광고 촬영을 위한 장소 섭외 및 계약',
        location: '외부 로케이션'
    },
    {
        id: 3,
        title: '럭셔리 브랜드 광고 캠페인 - 모델 캐스팅',
        start: '2023-03-13T10:00:00',
        end: '2023-03-15T16:00:00',
        projectId: 1,
        taskId: 3,
        assigneeId: 4,
        colorTag: 1,
        description: '광고 캠페인을 위한 모델 캐스팅 및 계약',
        location: '회의실 B'
    },
    {
        id: 4,
        title: '기업 홍보 다큐멘터리 - 기획 및 리서치',
        start: '2023-03-01T09:00:00',
        end: '2023-03-15T18:00:00',
        projectId: 2,
        taskId: 1,
        assigneeId: 1,
        colorTag: 2,
        description: '친환경 에너지 기업의 10주년 기념 다큐멘터리 기획 및 리서치',
        location: '회의실 C'
    },
    {
        id: 5,
        title: '기업 홍보 다큐멘터리 - 인터뷰 대상자 섭외',
        start: '2023-03-16T09:00:00',
        end: '2023-04-15T18:00:00',
        projectId: 2,
        taskId: 2,
        assigneeId: 4,
        colorTag: 2,
        description: '다큐멘터리 인터뷰 대상자 섭외 및 일정 조율',
        location: '회의실 A'
    },
    {
        id: 6,
        title: '뮤직비디오 제작 - 컨셉 회의',
        start: '2023-03-20T13:00:00',
        end: '2023-03-20T17:00:00',
        projectId: 3,
        taskId: 1,
        assigneeId: 2,
        colorTag: 3,
        description: '신인 아티스트 데뷔 싱글 뮤직비디오 컨셉 회의',
        location: '회의실 B'
    },
    {
        id: 7,
        title: '웹 시리즈 제작 - 1-3화 촬영',
        start: '2023-03-25T08:00:00',
        end: '2023-03-30T19:00:00',
        projectId: 4,
        taskId: 4,
        assigneeId: 5,
        colorTag: 4,
        description: '웹 시리즈 1-3화 촬영',
        location: '촬영 스튜디오'
    },
    {
        id: 8,
        title: '럭셔리 브랜드 광고 캠페인 - 촬영 준비',
        start: '2023-03-18T09:00:00',
        end: '2023-03-20T18:00:00',
        projectId: 1,
        taskId: 4,
        assigneeId: 5,
        colorTag: 1,
        description: '럭셔리 패션 브랜드 광고 촬영 준비 및 장비 점검',
        location: '장비실'
    }
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
        todos[index] = {...todos[index], ...updates };
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
        colorTag: Math.floor(Math.random() * 10) + 1, // 기본값으로 1-10 사이의 랜덤 컬러 태그 설정
        ...newEvent
    };
    events.push(eventToAdd);
    return eventToAdd;
};

export const updateEvent = (id, updates) => {
    const index = events.findIndex(event => event.id === id);
    if (index !== -1) {
        events[index] = {...events[index], ...updates };
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
        projects[index] = {...projects[index], ...updates, tasks };
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

// 프로젝트 이벤트 관련 함수
let projectEventIdCounter = projectEvents.length + 1;

export const getProjectEvents = () => {
    return [...projectEvents];
};

export const addProjectEvent = (newEvent) => {
    const id = projectEvents.length > 0 ? Math.max(...projectEvents.map(event => event.id)) + 1 : 1;
    const event = {
        id,
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        location: newEvent.location || '',
        description: newEvent.description || '',
        projectId: newEvent.projectId || 1,
        taskId: newEvent.taskId,
        assignees: newEvent.assignees || [], // 다중 담당자 배열
        assigneeId: newEvent.assigneeId, // 이전 버전 호환성 유지
        projectStatus: newEvent.projectStatus || projectStatuses.IN_PROGRESS.id, // 프로젝트 상태
        colorTag: newEvent.colorTag || getProjectColorTag(newEvent.projectId || 1)
    };

    projectEvents.push(event);
    return event;
};

export const updateProjectEvent = (id, updates) => {
    const index = projectEvents.findIndex(event => event.id === id);
    if (index !== -1) {
        projectEvents[index] = {
            ...projectEvents[index],
            ...updates,
            assignees: updates.assignees || projectEvents[index].assignees || [], // 다중 담당자 배열
            projectStatus: updates.projectStatus || projectEvents[index].projectStatus || projectStatuses.IN_PROGRESS.id // 프로젝트 상태
        };
        return projectEvents[index];
    }
    return null;
};

export const deleteProjectEvent = (id) => {
    const index = projectEvents.findIndex(event => event.id === id);
    if (index !== -1) {
        const deleted = projectEvents[index];
        projectEvents.splice(index, 1);
        return deleted;
    }
    return null;
};

// 프로젝트 ID에 따른 색상 태그 반환 (프로젝트별 일관된 색상 사용)
export const getProjectColorTag = (projectId) => {
    // 프로젝트 ID에 따라 일관된 색상 태그 반환 (1-10 사이)
    return ((projectId % 10) || 10);
};

// 프로젝트 ID로 프로젝트 정보 조회
export const getProjectById = (projectId) => {
    return projects.find(project => project.id === projectId);
};

// 프로젝트 ID와 태스크 ID로 태스크 정보 조회
export const getTaskById = (projectId, taskId) => {
    const project = getProjectById(projectId);
    if (project && project.tasks) {
        return project.tasks.find(task => task.id === taskId);
    }
    return null;
};

// 영수증 카테고리 데이터
export const receiptCategories = [
    { id: 'OFFICE_SUPPLIES', name: '사무용품', nameEn: 'Office Supplies' },
    { id: 'MEAL', name: '식비', nameEn: 'Meal Expenses' },
    { id: 'TRANSPORTATION', name: '교통비', nameEn: 'Transportation' },
    { id: 'IT_SOFTWARE', name: 'IT/소프트웨어', nameEn: 'IT/Software' },
    { id: 'ENTERTAINMENT', name: '접대비', nameEn: 'Entertainment' },
    { id: 'ACCOMMODATION', name: '숙박비', nameEn: 'Accommodation' },
    { id: 'EQUIPMENT', name: '장비구매/대여', nameEn: 'Equipment' },
    { id: 'OTHER', name: '기타', nameEn: 'Other' }
];

// 영수증 결제 방법 데이터
export const paymentMethods = [
    { id: 'CORPORATE_CARD', name: '법인카드', nameEn: 'Corporate Card' },
    { id: 'PERSONAL_PAYMENT', name: '개인결제', nameEn: 'Personal Payment' },
    { id: 'CASH', name: '현금', nameEn: 'Cash' },
    { id: 'BANK_TRANSFER', name: '계좌이체', nameEn: 'Bank Transfer' }
];

// 영수증 상태 데이터
export const receiptStatuses = [
    { id: 'PENDING', name: '승인대기', nameEn: 'Pending' },
    { id: 'APPROVED', name: '승인완료', nameEn: 'Approved' },
    { id: 'REJECTED', name: '반려', nameEn: 'Rejected' }
];

// 영수증 유형 데이터
export const receiptTypes = [
    { id: 'MEAL', name: '식대', nameEn: 'Meal Expenses' },
    { id: 'TAXI', name: '택시', nameEn: 'Taxi Expenses' },
    { id: 'OTHER', name: '기타', nameEn: 'Other' }
];

// 영수증 데이터
export const receipts = [{
        id: 1,
        userId: 1,
        date: '2023-03-01',
        title: '사무용품 구매',
        amount: 150000,
        category: 'OFFICE_SUPPLIES',
        paymentMethod: 'CORPORATE_CARD',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'OTHER',
        projectId: 1,
        description: '프로젝트 진행을 위한 사무용품 구매',
        createdAt: '2023-03-01T10:30:00',
        updatedAt: '2023-03-02T14:20:00'
    },
    {
        id: 2,
        userId: 1,
        date: '2023-03-05',
        title: '팀 회식비',
        amount: 320000,
        category: 'MEAL',
        paymentMethod: 'CORPORATE_CARD',
        status: 'PENDING',
        attachmentUrl: null,
        type: 'MEAL',
        projectId: 2,
        description: '프로젝트 킥오프 후 팀 회식',
        createdAt: '2023-03-05T21:45:00',
        updatedAt: '2023-03-05T21:45:00'
    },
    {
        id: 3,
        userId: 2,
        date: '2023-03-10',
        title: '교통비 정산',
        amount: 45000,
        category: 'TRANSPORTATION',
        paymentMethod: 'PERSONAL_PAYMENT',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'TAXI',
        projectId: 1,
        description: '클라이언트 미팅 참석을 위한 택시비',
        createdAt: '2023-03-10T18:20:00',
        updatedAt: '2023-03-11T09:15:00'
    },
    {
        id: 4,
        userId: 3,
        date: '2023-03-15',
        title: '소프트웨어 구독료',
        amount: 250000,
        category: 'IT_SOFTWARE',
        paymentMethod: 'CORPORATE_CARD',
        status: 'PENDING',
        attachmentUrl: null,
        type: 'OTHER',
        projectId: 3,
        description: '디자인 작업을 위한 소프트웨어 구독',
        createdAt: '2023-03-15T11:30:00',
        updatedAt: '2023-03-15T11:30:00'
    },
    {
        id: 5,
        userId: 1,
        date: '2023-03-20',
        title: '외부 미팅 식비',
        amount: 85000,
        category: 'MEAL',
        paymentMethod: 'CORPORATE_CARD',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'MEAL',
        projectId: 2,
        description: '클라이언트와의 중간 점검 미팅 식대',
        createdAt: '2023-03-20T14:10:00',
        updatedAt: '2023-03-21T10:05:00'
    },
    {
        id: 6,
        userId: 5,
        date: '2023-03-22',
        title: '택시비 (야근)',
        amount: 25000,
        category: 'TRANSPORTATION',
        paymentMethod: 'CORPORATE_CARD',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'TAXI',
        projectId: 3,
        description: '야간 촬영 후 귀가 택시비',
        createdAt: '2023-03-22T23:45:00',
        updatedAt: '2023-03-23T09:30:00'
    },
    {
        id: 7,
        userId: 4,
        date: '2023-03-25',
        title: '고객 미팅 식대',
        amount: 120000,
        category: 'MEAL',
        paymentMethod: 'CORPORATE_CARD',
        status: 'PENDING',
        attachmentUrl: null,
        type: 'MEAL',
        projectId: 4,
        description: '신규 프로젝트 논의를 위한 고객 미팅 식대',
        createdAt: '2023-03-25T13:20:00',
        updatedAt: '2023-03-25T13:20:00'
    },
    {
        id: 8,
        userId: 2,
        date: '2023-03-28',
        title: '택시비 (출장)',
        amount: 35000,
        category: 'TRANSPORTATION',
        paymentMethod: 'PERSONAL_PAYMENT',
        status: 'PENDING',
        attachmentUrl: null,
        type: 'TAXI',
        projectId: 2,
        description: '지방 출장 시 이동 택시비',
        createdAt: '2023-03-28T09:15:00',
        updatedAt: '2023-03-28T09:15:00'
    },
    {
        id: 9,
        userId: 6,
        date: '2023-04-02',
        title: '장비 대여비',
        amount: 450000,
        category: 'EQUIPMENT',
        paymentMethod: 'CORPORATE_CARD',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'OTHER',
        projectId: 3,
        description: '특수 촬영을 위한 장비 대여',
        createdAt: '2023-04-02T10:00:00',
        updatedAt: '2023-04-03T11:20:00'
    },
    {
        id: 10,
        userId: 1,
        date: '2023-04-05',
        title: '팀 점심 식대',
        amount: 95000,
        category: 'MEAL',
        paymentMethod: 'CORPORATE_CARD',
        status: 'APPROVED',
        attachmentUrl: null,
        type: 'MEAL',
        projectId: 1,
        description: '프로젝트 중간 점검 후 팀 점심',
        createdAt: '2023-04-05T13:45:00',
        updatedAt: '2023-04-06T09:10:00'
    }
];

// 모든 영수증 조회
export const getReceipts = () => {
    return [...receipts];
};

// 사용자별 영수증 조회
export const getReceiptsByUserId = (userId) => {
    return receipts.filter(receipt => receipt.userId === userId);
};

// 프로젝트별 영수증 조회
export const getReceiptsByProjectId = (projectId) => {
    return receipts.filter(receipt => receipt.projectId === projectId);
};

// 영수증 유형별 조회
export const getReceiptsByType = (type) => {
    return receipts.filter(receipt => receipt.type === type);
};

// 영수증 상태별 조회
export const getReceiptsByStatus = (status) => {
    return receipts.filter(receipt => receipt.status === status);
};

// 영수증 카테고리별 조회
export const getReceiptsByCategory = (category) => {
    return receipts.filter(receipt => receipt.category === category);
};

// 영수증 추가
export const addReceipt = (newReceipt) => {
    const receipt = {
        ...newReceipt,
        id: receipts.length > 0 ? Math.max(...receipts.map(r => r.id)) + 1 : 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    receipts.push(receipt);
    return receipt;
};

// 영수증 수정
export const updateReceipt = (id, updates) => {
    const index = receipts.findIndex(receipt => receipt.id === id);
    if (index !== -1) {
        receipts[index] = {
            ...receipts[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        return receipts[index];
    }
    return null;
};

// 영수증 삭제
export const deleteReceipt = (id) => {
    const index = receipts.findIndex(receipt => receipt.id === id);
    if (index !== -1) {
        const deletedReceipt = receipts[index];
        receipts.splice(index, 1);
        return deletedReceipt;
    }
    return null;
};

// 영수증 승인
export const approveReceipt = (id) => {
    return updateReceipt(id, { status: 'APPROVED' });
};

// 영수증 반려
export const rejectReceipt = (id, reason) => {
    return updateReceipt(id, {
        status: 'REJECTED',
        rejectionReason: reason
    });
};

// 영수증 ID로 영수증 정보 조회
export const getReceiptById = (id) => {
    return receipts.find(receipt => receipt.id === id);
};

// 영수증 통계 조회 (카테고리별 합계)
export const getReceiptStatsByCategory = () => {
    const stats = {};
    receiptCategories.forEach(category => {
        stats[category.id] = {
            id: category.id,
            name: category.name,
            nameEn: category.nameEn,
            total: 0,
            count: 0
        };
    });

    receipts.forEach(receipt => {
        if (stats[receipt.category]) {
            stats[receipt.category].total += receipt.amount;
            stats[receipt.category].count += 1;
        }
    });

    return Object.values(stats);
};

// 영수증 통계 조회 (유형별 합계)
export const getReceiptStatsByType = () => {
    const stats = {};
    receiptTypes.forEach(type => {
        stats[type.id] = {
            id: type.id,
            name: type.name,
            nameEn: type.nameEn,
            total: 0,
            count: 0
        };
    });

    receipts.forEach(receipt => {
        if (stats[receipt.type]) {
            stats[receipt.type].total += receipt.amount;
            stats[receipt.type].count += 1;
        }
    });

    return Object.values(stats);
};

// 영수증 통계 조회 (프로젝트별 합계)
export const getReceiptStatsByProject = () => {
    const stats = {};

    projects.forEach(project => {
        stats[project.id] = {
            id: project.id,
            name: project.name,
            total: 0,
            count: 0
        };
    });

    receipts.forEach(receipt => {
        if (stats[receipt.projectId]) {
            stats[receipt.projectId].total += receipt.amount;
            stats[receipt.projectId].count += 1;
        }
    });

    return Object.values(stats);
};