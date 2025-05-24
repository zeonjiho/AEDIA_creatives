/**
 * 검색 유틸리티 함수
 * 검색 관련 기능을 모아둔 유틸리티 파일입니다.
 */

// 검색 모달 상태 관리를 위한 이벤트 이름
export const SEARCH_EVENTS = {
    OPEN: 'search:open',
    CLOSE: 'search:close',
};

// 앱 기능 데이터
const APP_FEATURES = [{
        id: 'dashboard',
        title: 'Dashboard',
        description: '대시보드 - 메인 화면으로 이동합니다',
        keywords: ['대시보드', 'dashboard', '메인', 'main', '홈', 'home'],
        path: '/',
        category: '메인'
    },
    {
        id: 'attendance',
        title: 'Attendance',
        description: '출석 관리 - 출석체크 및 근태 관리',
        keywords: ['출석', 'attendance', '근태', '체크인', 'checkin', '근무시간'],
        path: '/attendance',
        category: '근태'
    },
    {
        id: 'todo',
        title: 'Todo',
        description: '할일 관리 - 업무 및 할일 목록 관리',
        keywords: ['할일', 'todo', '업무', 'task', '작업', '일정', '계획'],
        path: '/todo',
        category: '업무'
    },
    {
        id: 'calendar',
        title: 'Calendar',
        description: '캘린더 - 일정 및 스케줄 관리',
        keywords: ['캘린더', 'calendar', '일정', 'schedule', '스케줄', '날짜', '약속'],
        path: '/calendar',
        category: '일정'
    },
    {
        id: 'room-reservation',
        title: 'Room Reservation',
        description: '회의실 예약 - 회의실 및 공간 예약 관리',
        keywords: ['회의실', 'room', 'reservation', '예약', '공간', '미팅룸', 'meeting'],
        path: '/room-reservation',
        category: '예약'
    },
    {
        id: 'projects',
        title: 'Projects',
        description: '프로젝트 관리 - 프로젝트 현황 및 관리',
        keywords: ['프로젝트', 'project', '현황', 'status', '관리', '진행상황'],
        path: '/projects',
        category: '프로젝트'
    },
    {
        id: 'receipts',
        title: 'Receipts',
        description: '영수증 관리 - 영수증 및 경비 관리',
        keywords: ['영수증', 'receipt', '경비', '지출', '비용', '청구서'],
        path: '/receipts',
        category: '경비'
    },
    {
        id: 'notifications',
        title: 'Notifications',
        description: '알림 - 모든 알림 보기',
        keywords: ['알림', 'notification', '소식', '메시지', '공지'],
        path: '/notifications',
        category: '알림'
    },
    {
        id: 'profile',
        title: 'Profile',
        description: '프로필 - 개인 프로필 관리',
        keywords: ['프로필', 'profile', '개인정보', '내정보', '계정'],
        path: '/profile',
        category: '개인'
    },
    {
        id: 'settings',
        title: 'Settings',
        description: '설정 - 앱 설정 및 환경설정',
        keywords: ['설정', 'settings', '환경설정', '옵션', '테마', '구성'],
        path: '/settings',
        category: '설정'
    }
];

/**
 * 검색 모달 열기
 * 검색 모달을 열기 위한 이벤트를 발생시킵니다.
 */
export const openSearchModal = () => {
    const event = new CustomEvent(SEARCH_EVENTS.OPEN);
    window.dispatchEvent(event);
};

/**
 * 검색 모달 닫기
 * 검색 모달을 닫기 위한 이벤트를 발생시킵니다.
 */
export const closeSearchModal = () => {
    const event = new CustomEvent(SEARCH_EVENTS.CLOSE);
    window.dispatchEvent(event);
};

/**
 * 검색 실행 함수
 * @param {string} query - 검색어
 * @param {function} callback - 검색 결과를 처리할 콜백 함수
 */
export const performSearch = (query, callback) => {
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) {
        callback([]);
        return;
    }

    // 앱 기능들 중에서 검색
    const results = APP_FEATURES.filter(feature => {
        // 제목, 설명, 키워드에서 검색
        const titleMatch = feature.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = feature.description.toLowerCase().includes(searchTerm);
        const keywordMatch = feature.keywords.some(keyword =>
            keyword.toLowerCase().includes(searchTerm)
        );

        return titleMatch || descriptionMatch || keywordMatch;
    }).map(feature => ({
        id: feature.id,
        title: feature.title,
        description: feature.description,
        path: feature.path,
        category: feature.category
    }));

    // 검색 시뮬레이션을 위한 약간의 지연
    setTimeout(() => {
        callback(results);
    }, 150);
};

/**
 * 검색 결과로 직접 이동
 * @param {string} path - 이동할 경로
 * @param {function} navigate - react-router-dom의 navigate 함수
 */
export const navigateToFeature = (path, navigate) => {
    if (path) {
        navigate(path);
    }
};

/**
 * 검색 결과 페이지로 이동 (기존 호환성 유지)
 * @param {string} query - 검색어
 * @param {function} navigate - react-router-dom의 navigate 함수
 */
export const navigateToSearchResults = (query, navigate) => {
    // 첫 번째 검색 결과로 바로 이동하도록 변경
    performSearch(query, (results) => {
        if (results.length > 0) {
            navigateToFeature(results[0].path, navigate);
        }
    });
};