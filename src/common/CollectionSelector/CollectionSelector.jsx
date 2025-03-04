import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faPlus, faXmark, faLayerGroup, faLock, faGlobe, faSearch, faCheck } from '@fortawesome/free-solid-svg-icons';
import ss from './CollectionSelector.module.css';
import img1 from '../../img/image1.jpg';
import img3 from '../../img/image3.jpg';
import img5 from '../../img/image5.jpg';
import img7 from '../../img/image7.jpg';
import img9 from '../../img/image9.jpg';
import { Link } from 'react-router-dom';
import CreateCollectionModal from './CreateCollectionModal/CreateCollectionModal';
import api from '../../util/api';
import { jwtDecode } from 'jwt-decode';
import getThumbnailImage from '../../util/getThumbnailImage';

const CollectionSelector = ({ isOpen, onClose, onSelect, singleSelect = false, initialCreateMode = false }) => {
  const [collections, setCollections] = useState([
    // { 
    //   id: 1, 
    //   name: "Abstract Harmony",
    //   count: 128,
    //   img: img1,
    //   isPublic: true
    // },
    // { 
    //   id: 3, 
    //   name: "Chromatic Dreams",
    //   count: 92,
    //   img: img3,
    //   isPublic: false
    // },
    // { 
    //   id: 5, 
    //   name: "Neon Nights",
    //   count: 167,
    //   img: img5
    // },
    // { 
    //   id: 7, 
    //   name: "Geometric Fusion",
    //   count: 234,
    //   img: img7
    // },
    // { 
    //   id: 9, 
    //   name: "Ethereal Motion",
    //   count: 156,
    //   img: img9
    // },
    // { 
    //   id: 12, 
    //   name: "Code Collection",
    //   count: 89,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?code"
    //   }
    // },
    // {
    //   id: 13,
    //   name: "Urban Landscapes",
    //   count: 145,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?city"
    //   }
    // },
    // {
    //   id: 14,
    //   name: "Nature's Palette",
    //   count: 203,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?nature"
    //   }
    // },
    // {
    //   id: 15,
    //   name: "Digital Dreams",
    //   count: 167,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?digital"
    //   }
    // },
    // {
    //   id: 16,
    //   name: "Minimal Aesthetics",
    //   count: 98,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?minimal"
    //   }
    // },
    // {
    //   id: 17,
    //   name: "Portrait Gallery",
    //   count: 178,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?portrait"
    //   }
    // },
    // {
    //   id: 18,
    //   name: "Tech Innovations",
    //   count: 112,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?technology"
    //   }
    // },
    // {
    //   id: 19,
    //   name: "Architectural Wonders",
    //   count: 143,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?architecture"
    //   }
    // },
    // {
    //   id: 20,
    //   name: "Space Exploration",
    //   count: 87,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?space"
    //   }
    // },
    // {
    //   id: 21,
    //   name: "Ocean Life",
    //   count: 156,
    //   preview: {
    //     thumbnail: "https://source.unsplash.com/random/800x800?ocean"
    //   }
    // }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const [newCollectionName, setNewCollectionName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState(new Set());

  // 생성 모드 상태 변수
  const [isCreateMode, setIsCreateMode] = useState(false);
  
  // initialCreateMode prop이 변경될 때 생성 모드 상태 업데이트
  useEffect(() => {
    if (isOpen && initialCreateMode) {
      setIsCreateMode(true);
    }
  }, [isOpen, initialCreateMode]);
  
  // 컴포넌트가 닫힐 때 생성 모드도 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsCreateMode(false);
    }
  }, [isOpen]);

  const toggleArchive = (id) => {
    setCollections(prev => prev.map(collection =>
      collection._id === id
        ? { ...collection, isArchived: !collection.isArchived }
        : collection
    ));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    fetchCollectionsData()
  }, [])

  const fetchCollectionsData = async () => {
    if (!localStorage.getItem('token')) {
      return
    }
    const userId = jwtDecode(localStorage.getItem('token')).userId
    if (!userId) {
      return
    }
    try {
      const response = await api.get(`/get-all-hyperlinks?from=collections_selector&currentUserId=${userId}`)
      if (response.status === 200) {
        setCollections(response.data.reverse())
      }
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: Date.now(),
      name: newCollectionName.trim(),
      count: 0,
      isPublic: false
    };

    setCollections(prev => [newCollection, ...prev]);
    setNewCollectionName('');
  };

  // 아카이브/보이기 필터링을 포함한 컬렉션 필터링
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = showArchived ? collection.isArchived : !collection.isArchived;
    return matchesSearch && matchesVisibility;
  });

  const handleCollectionToggle = (collectionId) => {
    if (singleSelect) {
      // 단일 선택 모드
      setSelectedCollections(new Set([collectionId]));
    } else {
      // 다중 선택 모드 (기본값)
      setSelectedCollections(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(collectionId)) {
          newSelected.delete(collectionId);
        } else {
          newSelected.add(collectionId);
        }
        return newSelected;
      });
    }
  };

  const handleSave = () => {
    const selectedItems = collections.filter(collection =>
      selectedCollections.has(collection._id)
    );

    // 알림 메시지 생성
    const notificationMessage = selectedCollections.size === 1
      ? `Added to "${selectedItems[0].title}"`
      : `Added to ${selectedCollections.size} collections`;

    // onSelect 호출 시 알림 객체도 함께 전달
    onSelect(selectedItems, {
      type: 'success',
      message: notificationMessage,
      id: Date.now(),
    });

    onClose();
  };

  const getSaveButtonText = () => {
    if (selectedCollections.size === 0) return 'Save';
    if (selectedCollections.size === 1) return 'Save to Collection';
    return `Save to ${selectedCollections.size} Collections`;
  };

  const getSelectionTitle = () => {
    if (selectedCollections.size === 0) return 'Select Collection';
    if (selectedCollections.size === 1) {
      const selectedId = Array.from(selectedCollections)[0];
      const selectedCollection = collections.find(c => c.id === selectedId);
      return `Added to ${selectedCollection?.name || 'Collection'}`;
    }
    return `Added to ${selectedCollections.size} Collections`;
  };

  if (!isOpen) return null;

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className={ss.overlay} onClick={onClose}>
      <div className={ss.modal} onClick={e => e.stopPropagation()}>
        <header className={ss.header}>
          <div className={ss.titleRow}>
            <div className={ss.titleWrapper}>
              <FontAwesomeIcon icon={faLayerGroup} className={ss.titleIcon} />
              <h2 className={ss.title}>{getSelectionTitle()}</h2>
            </div>
            <div className={ss.headerButtons}>
              <button className={ss.cancelButton} onClick={onClose}>
                Cancel
              </button>
              <button
                className={ss.saveButton}
                onClick={handleSave}
                disabled={selectedCollections.size === 0}
              >
                {getSaveButtonText()}
              </button>
            </div>
          </div>
          <div className={ss.headerRight}>
            <div className={ss.searchWrapper}>
              <input
                type="text"
                placeholder="Search collections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={ss.searchInput}
              />
              <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
            </div>
            <button
              className={`${ss.toggleArchivedButton} ${showArchived ? ss.active : ''}`}
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Show Active' : 'Show Archived'}
            </button>
            <button
              className={ss.createButton}
              onClick={() => setShowCreateModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} />
              Create
            </button>
          </div>
        </header>

        <div className={ss.content}>
          {!isLoggedIn ? (
            <div className={ss.loginWarningContainer}>
              <div className={ss.loginWarningMessage}>
                For the safety, security, and policies of Hyper, <br />
                please <Link to="/login" className={ss.loginHighlight}>login</Link> or <Link to="/signup" className={ss.loginHighlight}>sign up</Link> to access collections.
              </div>
            </div>
          ) : (
            <div className={ss.collectionList}>
              {filteredCollections.map(collection => (
                <button
                  key={collection._id}
                  className={`${ss.collectionItem} ${selectedCollections.has(collection._id) ? ss.selected : ''
                    }`}
                  onClick={() => handleCollectionToggle(collection._id)}
                >
                  <div className={ss.itemContentWrapper}>
                    <div className={ss.previewImage}>
                      <img src={getThumbnailImage(collection.thumbnail, 'mini') || collection.preview?.thumbnail} alt={collection.title} />
                      {selectedCollections.has(collection._id) && (
                        <div className={ss.selectedOverlay}>
                          <FontAwesomeIcon icon={faCheck} />
                        </div>
                      )}
                    </div>
                    <div className={ss.collectionInfo}>
                      <div className={ss.nameWrapper}>
                        <FontAwesomeIcon
                          icon={collection.visibility === 'public' ? faGlobe : faLock}
                          className={ss.visibilityIcon}
                        />
                        <span className={ss.collectionName}>{collection.title}</span>
                      </div>
                      <span className={ss.collectionCount}>{collection.collectionBody.length} items</span>
                    </div>
                    <button
                      className={`${ss.archiveText} ${collection.isArchived ? ss.unarchive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchive(collection._id);
                      }}
                    >
                      {collection.isArchived ? 'unarchive' : 'archive'}
                    </button>
                  </div>
                </button>
              ))}
              {filteredCollections.length === 0 && (
                <div className={ss.noResults}>
                  No collections found for "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        // onCreated는 fetchData 형태로 추후 바꾸는 게 좋을 듯
        onCreated={(newCollection) => {
          setCollections(prev => [newCollection, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default CollectionSelector; 