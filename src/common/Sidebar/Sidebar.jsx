import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch,
  faSort,
  faXmark,
  faCheck,
  faList,
  faListUl,
  faTableCells,
  faHeart,
  faPen,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import ss from './Sidebar.module.css';

const Sidebar = ({ 
  title = "Collections",
  collections = [],
  activeCollectionId,
  onCollectionSelect,
  sortOptions = [
    { id: 'recents', label: 'Recents', color: '#1ed760' },
    { id: 'recently_added', label: 'Recently added' },
    { id: 'alphabetical', label: 'Alphabetical' },
    { id: 'creator', label: 'Creator' }
  ],
  viewOptions = [
    { id: 'compact', label: 'Compact', icon: faList },
    { id: 'list', label: 'List', icon: faListUl },
    { id: 'grid', label: 'Grid', icon: faTableCells }
  ]
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState(() => 
    localStorage.getItem('sidebarSortOption') || 'recents'
  );
  const [viewMode, setViewMode] = useState(() => 
    localStorage.getItem('sidebarViewMode') || 'list'
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [gridSize, setGridSize] = useState(() => 
    parseInt(localStorage.getItem('sidebarGridSize')) || 50
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const sortMenuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sidebarSortOption', sortOption);
  }, [sortOption]);

  useEffect(() => {
    localStorage.setItem('sidebarViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('sidebarGridSize', gridSize.toString());
  }, [gridSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortOptionSelect = (optionId) => {
    setSortOption(optionId);
    setShowSortMenu(false);
  };

  const handleViewModeSelect = (mode) => {
    setViewMode(mode);
    setShowSortMenu(false);
  };

  const filteredCollections = collections.filter(col => 
    col.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    col.owner.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const sortedCollections = useMemo(() => {
    let result = [...filteredCollections];
    
    switch (sortOption) {
      case 'recently_added':
        result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'creator':
        result.sort((a, b) => a.owner.localeCompare(b.owner));
        break;
      // recents는 기본 정렬 유지
    }

    // 고정된 항목 우선 정렬
    return result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [filteredCollections, sortOption]);

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setSelectedItems([]);
    }
  };

  const handleItemSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleDelete = () => {
    // TODO: 삭제 로직 구현
    console.log('Delete items:', selectedItems);
    setSelectedItems([]);
    setIsEditMode(false);
  };

  return (
    <aside className={ss.sidebar}>
      <div className={ss.sidebarHeader}>
        <div className={ss.searchRow}>
          <div className={ss.searchInputContainer}>
            <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
            <input
              type="text"
              className={ss.searchInput}
              placeholder="Search in Collections"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={ss.clearSearchButton} onClick={() => setSearchQuery('')}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>
        </div>

        <div className={ss.actionRow}>
          <button className={ss.editButton} onClick={toggleEditMode}>
            <FontAwesomeIcon icon={faPen} />
            <span>Edit</span>
          </button>
          <div className={ss.sortContainer} ref={sortMenuRef}>
            {isEditMode ? (
              <div className={ss.editButtonGroup}>
                <button className={ss.createButton}>
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Create</span>
                </button>
                <button 
                  className={`${ss.deleteButton} ${selectedItems.length === 0 ? ss.disabled : ''}`}
                  onClick={handleDelete}
                  disabled={selectedItems.length === 0}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Delete</span>
                </button>
              </div>
            ) : (
              <button 
                className={ss.sortButton}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <FontAwesomeIcon icon={faSort} className={ss.sortIcon} />
                <span className={ss.sortLabel}>
                  {sortOptions.find(opt => opt.id === sortOption)?.label}
                </span>
              </button>
            )}
            {showSortMenu && (
              <div className={ss.sortMenu}>
                <div className={ss.sortSection}>
                  <h3 className={ss.sortSectionTitle}>Sort by</h3>
                  {sortOptions.map(option => (
                    <button
                      key={option.id}
                      className={`${ss.sortOption} ${sortOption === option.id ? ss.active : ''}`}
                      onClick={() => handleSortOptionSelect(option.id)}
                      style={{ color: option.id === sortOption ? option.color : undefined }}
                    >
                      {option.label}
                      {sortOption === option.id && (
                        <FontAwesomeIcon icon={faCheck} className={ss.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>

                <div className={ss.divider} />

                <div className={ss.sortSection}>
                  <h3 className={ss.sortSectionTitle}>View as</h3>
                  {viewOptions.map(option => (
                    <button
                      key={option.id}
                      className={`${ss.viewOption} ${viewMode === option.id ? ss.active : ''}`}
                      onClick={() => handleViewModeSelect(option.id)}
                    >
                      <FontAwesomeIcon icon={option.icon} className={ss.viewIcon} />
                      {option.label}
                      {viewMode === option.id && (
                        <FontAwesomeIcon icon={faCheck} className={ss.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>

                {viewMode === 'grid' && (
                  <div className={ss.gridSizeControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gridSize}
                      onChange={(e) => setGridSize(Number(e.target.value))}
                      className={ss.gridSizeSlider}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={ss.collectionContainer}>
        <h1 className={ss.sidebarTitle}>my collections</h1>
        <div className={`${ss.collectionList} ${ss[viewMode]}`}>
          {sortedCollections.map(col => (
            <button
              key={col._id}
              className={`${ss.collectionItem} ${col._id === activeCollectionId ? ss.active : ''}`}
              onClick={() => isEditMode ? handleItemSelect(col._id) : onCollectionSelect?.(col)}
            >
              {isEditMode && (
                <div className={`${ss.checkbox} ${selectedItems.includes(col._id) ? ss.checked : ''}`} />
              )}
              <div className={ss.collectionThumb}>
                <img src={col.thumbnail} alt={col.title} />
              </div>
              <div className={ss.collectionInfo}>
                <span className={ss.collectionName}>{col.title}</span>
                <span className={ss.collectionMeta}>
                  {col.pinned ? (
                    <>
                      <FontAwesomeIcon icon={faHeart} className={ss.pinnedIcon} />
                      Collection • {col.count} items
                    </>
                  ) : (
                    <>Collection • {col.owner}</>
                  )}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 