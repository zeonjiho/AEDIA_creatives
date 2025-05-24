import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaArrowRight } from 'react-icons/fa';
import { SEARCH_EVENTS, performSearch, navigateToFeature } from '../../utils/searchUtils';
import styles from './SearchModal.module.css';

const SearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // 검색 모달 열기/닫기 이벤트 리스너
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsOpen(true);
      // 모달이 열리면 input에 포커스
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    };

    const handleCloseSearch = () => {
      setIsOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    };

    // 이벤트 리스너 등록
    window.addEventListener(SEARCH_EVENTS.OPEN, handleOpenSearch);
    window.addEventListener(SEARCH_EVENTS.CLOSE, handleCloseSearch);

    // ESC 키로 모달 닫기
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener(SEARCH_EVENTS.OPEN, handleOpenSearch);
      window.removeEventListener(SEARCH_EVENTS.CLOSE, handleCloseSearch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsLoading(true);
      
      // 디바운스 처리
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery, (results) => {
          setSearchResults(results);
          setIsLoading(false);
        });
      }, 200);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
      setIsLoading(false);
    }
  }, [searchQuery]);

  // 검색 결과 클릭 핸들러
  const handleResultClick = (result) => {
    navigateToFeature(result.path, navigate);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // 검색 제출 핸들러 (엔터키 누르면 첫 번째 결과로 이동)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  };

  // 모달 외부 클릭 시 닫기
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains(styles.modal_overlay)) {
      setIsOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal_overlay} onClick={handleOutsideClick}>
      <div className={styles.modal_container}>
        <div className={styles.modal_header}>
          <h2 className={styles.modal_title}>앱 기능 검색</h2>
          <button className={styles.close_button} onClick={() => setIsOpen(false)}>
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.search_container}>
          <form onSubmit={handleSubmit} className={styles.search_form}>
            <div className={styles.search_input_container}>
              <FaSearch className={styles.search_icon} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="찾고 있는 기능을 검색하세요... (예: 출석, 할일, 캘린더)"
                className={styles.search_input}
                autoFocus
              />
            </div>
          </form>
          
          {isLoading && (
            <div className={styles.loading_indicator}>
              <div className={styles.spinner}></div>
              <span>검색 중...</span>
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className={styles.search_results}>
              <div className={styles.results_header}>
                <span className={styles.results_count}>
                  {searchResults.length}개의 기능을 찾았습니다
                </span>
              </div>
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className={styles.result_item}
                  onClick={() => handleResultClick(result)}
                >
                  <div className={styles.result_content}>
                    <div className={styles.result_header}>
                      <h3 className={styles.result_title}>{result.title}</h3>
                      <span className={styles.result_category}>{result.category}</span>
                    </div>
                    <p className={styles.result_description}>{result.description}</p>
                  </div>
                  <FaArrowRight className={styles.result_arrow} />
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.trim().length > 0 && searchResults.length === 0 && !isLoading && (
            <div className={styles.no_results}>
              <h3>검색 결과가 없습니다</h3>
              <p>다른 키워드로 검색해보세요.</p>
              <div className={styles.search_tips}>
                <p><strong>검색 팁:</strong></p>
                <ul>
                  <li>• "출석" - 출석 관리 페이지</li>
                  <li>• "할일" - 할일 목록 관리</li>
                  <li>• "캘린더" - 일정 관리</li>
                  <li>• "회의실" - 회의실 예약</li>
                  <li>• "설정" - 앱 설정</li>
                </ul>
              </div>
            </div>
          )}

          {searchQuery.trim().length === 0 && (
            <div className={styles.search_guide}>
              <h3>원하는 기능을 빠르게 찾아보세요</h3>
              <div className={styles.popular_searches}>
                <h4>인기 검색어</h4>
                <div className={styles.search_tags}>
                  {['출석', '할일', '캘린더', '회의실', '프로젝트', '영수증'].map(tag => (
                    <button
                      key={tag}
                      className={styles.search_tag}
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 