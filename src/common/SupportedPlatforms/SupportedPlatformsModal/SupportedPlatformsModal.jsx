import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, 
  faCircleCheck, 
  faCircleXmark,
  faGlobe,
  faLaptop,
  faMobile,
  faDesktop,
  faPuzzlePiece,
  faCode,
  faRocket,
  faEnvelope,
  faMusic,
  faGamepad,
  faShoppingCart,
  faFilter,
  faLink,
  faImage,
  faVideo,
  faSearch,
  faShoppingBag
} from '@fortawesome/free-solid-svg-icons';
import {
  faChrome,
  faSafari,
  faWindows,
  faApple,
  faAndroid,
  faLinux,
  faAmazon
} from '@fortawesome/free-brands-svg-icons';
import PlatformIcon from '../PlatformIcons';
import { supportedPlatforms } from '../PlatformIcons';
import ss from './SupportedPlatformsModal.module.css';

const devicePlatforms = [
  {
    name: 'Android App',
    type: 'device',
    status: 'coming',
    icon: faAndroid,
    category: 'Mobile',
    categoryIcon: faMobile
  },
  {
    name: 'iOS App',
    type: 'device',
    status: 'coming',
    icon: faApple,
    category: 'Mobile',
    categoryIcon: faMobile
  },
  {
    name: 'macOS App',
    type: 'device',
    status: 'coming',
    icon: faApple,
    category: 'Desktop',
    categoryIcon: faDesktop
  },
  {
    name: 'Windows App',
    type: 'device',
    status: 'coming',
    icon: faWindows,
    category: 'Desktop',
    categoryIcon: faDesktop
  },
  {
    name: 'Linux App',
    type: 'device',
    status: 'coming',
    icon: faLinux,
    category: 'Desktop',
    categoryIcon: faDesktop
  },
  {
    name: 'Chrome Extension',
    type: 'device',
    status: 'active',
    icon: faChrome,
    category: 'Browser',
    categoryIcon: faPuzzlePiece
  },
  {
    name: 'Safari Extension',
    type: 'device',
    status: 'coming',
    icon: faSafari,
    category: 'Browser',
    categoryIcon: faPuzzlePiece
  }
];

// Category icons mapping to match TypeSelector
const categoryIcons = {
  'Link': faLink,
  'Image': faImage,
  'Video': faVideo,
  'Music': faMusic,
  'Code': faCode
};

const SupportedPlatformsModal = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('all');
  const [platformType, setPlatformType] = useState('sites');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlatformClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPlatformIcon = (platform) => {
    if (platform.type === 'device') {
      return platform.icon;
    }
    return <PlatformIcon url={`https://${platform.domains[0]}`} />;
  };

  // Group platforms by category
  const groupPlatformsByCategory = (platforms) => {
    const grouped = {};
    
    // Define the order of categories to match TypeSelector
    const categoryOrder = ['Link', 'Image', 'Video', 'Music', 'Code'];
    
    // Initialize categories in the desired order
    categoryOrder.forEach(category => {
      grouped[category] = [];
    });
    
    // Group platforms by their categories - 각 플랫폼이 여러 카테고리에 나타날 수 있음
    platforms.forEach(platform => {
      const categories = platform.categories || [platform.category];
      
      categories.forEach(category => {
        if (!grouped[category]) {
          grouped[category] = [];
        }
        // 중복 방지를 위해 이미 추가된 플랫폼인지 확인
        if (!grouped[category].some(p => p.key === platform.key)) {
          grouped[category].push(platform);
        }
      });
    });
    
    // Filter out empty categories
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, platforms]) => platforms.length > 0)
    );
  };

  // 검색어 처리 함수
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // 검색어 초기화 함수
  const clearSearch = () => {
    setSearchQuery('');
  };

  // 검색어를 기반으로 플랫폼 필터링
  const filteredPlatforms = supportedPlatforms.filter(platform => {
    // 상태 필터 적용
    const statusMatch = filter === 'all' || platform.status === filter;
    
    // 검색어가 없으면 상태 필터만 적용
    if (!searchQuery.trim()) return statusMatch;
    
    // 검색어가 있으면 이름, 도메인에서 검색
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = platform.name.toLowerCase().includes(query);
    const domainMatch = platform.domains.some(domain => 
      domain.toLowerCase().includes(query)
    );
    
    return statusMatch && (nameMatch || domainMatch);
  });
  
  const groupedPlatforms = groupPlatformsByCategory(filteredPlatforms);
  
  // Get categories in the order defined in TypeSelector
  const categories = Object.keys(groupedPlatforms).sort((a, b) => {
    const order = ['Link', 'Image', 'Video', 'Music', 'Code'];
    return order.indexOf(a) - order.indexOf(b);
  });

  // 검색 결과가 있는지 확인
  const hasSearchResults = Object.values(groupedPlatforms).some(platforms => platforms.length > 0);

  // 카테고리별 컴팩트 뷰를 위한 함수 수정
  const renderCompactCategoryView = (category, platforms) => (
    <div key={category} className={ss.categorySection}>
      <div className={ss.categoryHeader}>
        <h3>
          <FontAwesomeIcon icon={categoryIcons[category]} className={ss.categoryIcon} />
          {category}
        </h3>
      </div>
      <div className={ss.platformGrid}>
        {platforms.map(platform => (
          <div 
            key={platform.key} 
            className={`${ss.platformCard} ${platform.status === 'active' ? ss.clickable : ''}`}
            onClick={() => platform.status === 'active' && handlePlatformClick(`https://${platform.domains[0]}`)}
            title={platform.status === 'active' ? `Visit ${platform.name}` : 'Coming Soon'}
          >
            <div className={ss.platformIcon}>
              <FontAwesomeIcon icon={platform.icon} />
            </div>
            <div className={ss.platformInfo}>
              <h3>{platform.name}</h3>
              <span className={ss.domain}>{platform.domains[0]}</span>
            </div>
            <div className={ss.status}>
              {platform.status === 'active' ? (
                <FontAwesomeIcon 
                  icon={faCircleCheck} 
                  className={ss.activeIcon}
                  title="Active"
                />
              ) : (
                <FontAwesomeIcon 
                  icon={faCircleXmark} 
                  className={ss.inactiveIcon}
                  title="Coming Soon"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 디바이스 플랫폼 필터링
  const filteredDevicePlatforms = devicePlatforms.filter(platform => {
    // 상태 필터 적용
    const statusMatch = filter === 'all' || platform.status === filter;
    
    // 검색어가 없으면 상태 필터만 적용
    if (!searchQuery.trim()) return statusMatch;
    
    // 검색어가 있으면 이름, 카테고리에서 검색
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = platform.name.toLowerCase().includes(query);
    const categoryMatch = platform.category.toLowerCase().includes(query);
    
    return statusMatch && (nameMatch || categoryMatch);
  });

  return (
    <div className={`${ss.overlay} ${isOpen ? ss.visible : ''}`}>
      <div className={ss.modal}>
        <header className={ss.header}>
          <h2>Supported Platforms</h2>
          <button onClick={onClose} className={ss.closeButton}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className={ss.typeFilters}>
          <button 
            className={`${ss.typeButton} ${platformType === 'sites' ? ss.active : ''}`}
            onClick={() => setPlatformType('sites')}
          >
            <FontAwesomeIcon icon={faGlobe} />
            <span>Websites</span>
          </button>
          <button 
            className={`${ss.typeButton} ${platformType === 'devices' ? ss.active : ''}`}
            onClick={() => setPlatformType('devices')}
          >
            <FontAwesomeIcon icon={faRocket} />
            <span>Apps & Extensions</span>
          </button>
        </div>

        <div className={ss.filters}>
          <div className={ss.filterButtons}>
            <button 
              className={`${ss.filterButton} ${filter === 'all' ? ss.active : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`${ss.filterButton} ${filter === 'active' ? ss.active : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button 
              className={`${ss.filterButton} ${filter === 'coming' ? ss.active : ''}`}
              onClick={() => setFilter('coming')}
            >
              Coming Soon
            </button>
          </div>
          
          <div className={ss.searchContainer}>
            <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
            <input
              type="text"
              className={ss.searchInput}
              placeholder="Search platforms..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button 
              className={`${ss.clearSearch} ${searchQuery ? ss.visible : ''}`}
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        {platformType === 'sites' ? (
          <>
            <div className={ss.categorizedPlatforms}>
              {hasSearchResults ? (
                categories.map(category => 
                  groupedPlatforms[category] && groupedPlatforms[category].length > 0 ? 
                    renderCompactCategoryView(category, groupedPlatforms[category]) : null
                )
              ) : (
                <div className={ss.noResults}>
                  No platforms found matching your search criteria.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {filteredDevicePlatforms.length > 0 ? (
              <div className={ss.platformGrid}>
                {filteredDevicePlatforms.map(platform => (
                  <div 
                    key={platform.name} 
                    className={`${ss.platformCard} ${platform.status === 'active' ? ss.clickable : ''}`}
                    onClick={() => platform.status === 'active' && handlePlatformClick(platform.url || '#')}
                    title={platform.status === 'active' ? `Get ${platform.name}` : 'Coming Soon'}
                  >
                    <div className={ss.platformIcon}>
                      <FontAwesomeIcon icon={platform.icon} />
                    </div>
                    <div className={ss.platformInfo}>
                      <h3>{platform.name}</h3>
                      <div className={ss.category}>
                        <FontAwesomeIcon icon={platform.categoryIcon} />
                        <span>{platform.category}</span>
                      </div>
                    </div>
                    <div className={ss.status}>
                      {platform.status === 'active' ? (
                        <FontAwesomeIcon 
                          icon={faCircleCheck} 
                          className={ss.activeIcon}
                          title="Active"
                        />
                      ) : (
                        <FontAwesomeIcon 
                          icon={faCircleXmark} 
                          className={ss.inactiveIcon}
                          title="Coming Soon"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={ss.noResults}>
                No devices or extensions found matching your search criteria.
              </div>
            )}
          </>
        )}

        <div className={ss.requestSection}>
          <p className={ss.requestText}>
            Want to integrate your platform with HYPER™?<br />
            We're always looking to expand our supported platforms.
          </p>
          <a 
            href="mailto:team@hyper.bz?subject=Platform Integration Request"
            className={ss.requestLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faEnvelope} />
            <span>Contact Us for Integration</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SupportedPlatformsModal;