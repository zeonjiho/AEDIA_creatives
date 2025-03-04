import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faMagicWandSparkles,
  faPlus,
  faPalette,
  faTheaterMasks,
  faShapes,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import ss from './MasterHandleModal.module.css';

const MasterHandleModal = ({ onClose, position, onOpenPaste }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAiTooltip, setShowAiTooltip] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);

  const handleMouseLeave = () => {
    if (activeTab !== 'filter') {
      setActiveTab(null);
    }
    setShowAiTooltip(false);
    setHoveredIcon(null);
  };

  const handlePasteClick = () => {
    onClose();
    onOpenPaste();
  };

  const handleAiClick = () => {
    setShowAiTooltip(true);
    setTimeout(() => {
      setShowAiTooltip(false);
    }, 2000);
  };

  const filterCategories = [
    { id: 'color', icon: faPalette, label: 'Color' },
    { id: 'genre', icon: faTheaterMasks, label: 'Genre' },
    { id: 'type', icon: faShapes, label: 'Type' }
  ];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div 
      className={ss.modalContainer}
      style={{
        top: position.y - 32,
        left: position.x,
      }}
    >
      {activeTab === 'filter' ? (
        <div className={ss.filterModeContainer}>
          <div 
            className={ss.backButton}
            onClick={() => setActiveTab(null)}
          >
            <FontAwesomeIcon icon={faChevronLeft} className={ss.icon} />
          </div>
          {filterCategories.map(category => (
            <div key={category.id} className={ss.filterItem}>
              <FontAwesomeIcon icon={category.icon} className={ss.filterIcon} />
              <span>
                <span className={ss.byText}>by</span>
                <span className={ss.categoryText}>{category.label}</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={ss.iconContainer}>
          <div 
            className={`${ss.iconWrapper} ${activeTab === 'search' ? ss.active : ''}`}
            data-expandable="true"
            onMouseEnter={() => setActiveTab('search')}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon icon={faSearch} className={ss.icon} />
            {activeTab === 'search' && (
              <input
                type="text"
                className={ss.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search term"
                autoFocus
              />
            )}
          </div>

          <div 
            className={ss.iconWrapper}
            onClick={() => setActiveTab('filter')}
            onMouseEnter={() => setHoveredIcon('filter')}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon icon={faFilter} className={ss.icon} />
            {hoveredIcon === 'filter' && !activeTab && (
              <div className={ss.tooltip}>
                <span>Filter</span>
                <span className={ss.shortcut}>F</span>
              </div>
            )}
          </div>

          <div 
            className={ss.iconWrapper}
            onClick={handleAiClick}
            onMouseEnter={() => setHoveredIcon('ai')}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon icon={faMagicWandSparkles} className={ss.icon} />
            {(showAiTooltip || hoveredIcon === 'ai') && (
              <div className={ss.tooltip}>
                <span>{showAiTooltip ? 'Coming Soon!' : 'AI Tools'}</span>
                {!showAiTooltip && <span className={ss.shortcut}>A</span>}
              </div>
            )}
          </div>

          <div 
            className={ss.iconWrapper}
            onClick={handlePasteClick}
            onMouseEnter={() => setHoveredIcon('paste')}
            onMouseLeave={handleMouseLeave}
          >
            <FontAwesomeIcon icon={faPlus} className={ss.icon} />
            {hoveredIcon === 'paste' && (
              <div className={ss.tooltip}>
                <span>Paste</span>
                <span className={ss.shortcut}>{modKey} + V</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterHandleModal; 