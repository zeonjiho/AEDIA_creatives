/**
 * 검색 유틸리티 함수
 * 검색 관련 기능을 모아둔 유틸리티 파일입니다.
 */

// 검색 모달 상태 관리를 위한 이벤트 이름
export const SEARCH_EVENTS = {
  OPEN: 'search:open',
  CLOSE: 'search:close',
};

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
  // 실제 검색 로직은 여기에 구현
  // API 호출이나 로컬 데이터 검색 등을 수행할 수 있음
  
  // 예시: 간단한 로컬 검색 시뮬레이션
  setTimeout(() => {
    // 실제 구현에서는 여기에 API 호출 등의 로직이 들어갈 수 있음
    const mockResults = [
      { id: 1, title: '검색 결과 1', description: `'${query}'와 관련된 첫 번째 결과입니다.` },
      { id: 2, title: '검색 결과 2', description: `'${query}'에 대한 두 번째 검색 결과입니다.` },
      { id: 3, title: '검색 결과 3', description: `'${query}'와 일치하는 세 번째 항목입니다.` },
    ];
    
    callback(mockResults);
  }, 500); // 검색 시뮬레이션을 위한 지연
};

/**
 * 검색 결과 페이지로 이동
 * @param {string} query - 검색어
 * @param {function} navigate - react-router-dom의 navigate 함수
 */
export const navigateToSearchResults = (query, navigate) => {
  if (query && query.trim()) {
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }
}; 