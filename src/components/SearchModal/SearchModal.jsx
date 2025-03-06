import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { SEARCH_EVENTS, performSearch, navigateToSearchResults } from '../../utils/searchUtils';
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
    if (searchQuery.trim().length > 1) {
      setIsLoading(true);
      
      // 디바운스 처리
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery, (results) => {
          setSearchResults(results);
          setIsLoading(false);
        });
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // 검색 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateToSearchResults(searchQuery, navigate);
      setIsOpen(false);
    }
  };

  // 모달 외부 클릭 시 닫기
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains(styles.modal_overlay)) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal_overlay} onClick={handleOutsideClick}>
      <div className={styles.modal_container}>
        <div className={styles.modal_header}>
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
                placeholder="검색어를 입력하세요..."
                className={styles.search_input}
                autoFocus
              />
            </div>
          </form>
          
          {isLoading && (
            <div className={styles.loading_indicator}>
              <div className={styles.spinner}></div>
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className={styles.search_results}>
              {searchResults.map((result) => (
                <div 
                  key={result.id} 
                  className={styles.result_item}
                  onClick={() => {
                    navigateToSearchResults(searchQuery, navigate);
                    setIsOpen(false);
                  }}
                >
                  <h3 className={styles.result_title}>{result.title}</h3>
                  <p className={styles.result_description}>{result.description}</p>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery.trim().length > 0 && searchResults.length === 0 && !isLoading && (
            <div className={styles.no_results}>
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal; 