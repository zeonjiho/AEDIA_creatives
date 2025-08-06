import React, { useState, useEffect } from 'react';
import ss from './AdminProject.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye,
    faEyeSlash,
    faUser,
    faSearch,
    faEdit,
    faSave,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../utils/api';
import getProjectThumbnail from '../../../utils/getProjectThumbnail';

const AdminProject = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
      const [searchTerm, setSearchTerm] = useState('');
    const [editingProject, setEditingProject] = useState(null);
    const [pdList, setPdList] = useState([]); // PD 목록

    // 페이지네이션 상태 추가
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(21);

    // 이미지 로딩 상태 관리
    const [imageLoadStates, setImageLoadStates] = useState({});

  // 프로젝트 데이터 로드
  useEffect(() => {
    loadProjects();
    loadPdList();
  }, []);

      // 검색 및 필터링 적용
    useEffect(() => {
        let filtered = projects.filter(project => !project.isHide); // isHide가 false이거나 없는 프로젝트만

        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter(project =>
                project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProjects(filtered);
    }, [projects, searchTerm]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredProjects.slice(startIndex, endIndex);

      // 필터링 조건이 변경될 때 현재 페이지를 1로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

  // 프로젝트 목록 로드
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      if (response.status === 200) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('프로젝트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

      // PD 목록 로드 (Company 모델의 adminUsers에서 가져오기)
    const loadPdList = async () => {
        try {
            const response = await api.get('/company/settings');
            if (response.status === 200 && response.data.adminUsers) {
                // adminUsers 배열에서 사용자 정보 추출 (이미 populate되어 있음)
                const adminUsers = response.data.adminUsers.map(admin => ({
                    _id: admin.userId._id,
                    name: admin.userId.name,
                    email: admin.userId.email,
                    department: admin.userId.department,
                    userType: admin.userId.userType,
                    role: admin.role // super_admin, admin, pd
                }));
                
                setPdList(adminUsers);
                console.log('관리자 목록 로드 성공:', adminUsers.length, '명');
            } else {
                setPdList([]);
                console.log('관리자가 지정되지 않았습니다.');
            }
        } catch (error) {
            console.error('관리자 목록 로드 실패:', error);
            setPdList([]);
        }
    };

      // 프로젝트 숨기기/숨기기 해제
    const toggleProjectVisibility = async (projectId, currentIsHide) => {
        // 숨기기로 변경하는 경우
        if (!currentIsHide) {
            const confirmed = window.confirm('프로젝트를 숨기시겠습니까? 숨김 처리된 프로젝트는 관리자페이지에서만 확인할 수 있으며, 해당 프로젝트로 영수증 등록 등이 불가능합니다.');
            if (!confirmed) {
                return;
            }
        }
        // 숨기기 해제하는 경우
        else {
            const confirmed = window.confirm('프로젝트 숨기기를 취소하시겠습니까?');
            if (!confirmed) {
                return;
            }
        }

        try {
            const newIsHide = !currentIsHide;
            const response = await api.put(`/projects/${projectId}`, {
                isHide: newIsHide
            });
            
            if (response.status === 200) {
                // 로컬 상태 업데이트
                setProjects(prev => prev.map(project =>
                    project._id === projectId 
                        ? { ...project, isHide: newIsHide }
                        : project
                ));
            }
        } catch (error) {
            console.error('프로젝트 숨김 상태 변경 실패:', error);
            alert('프로젝트 숨김 상태 변경에 실패했습니다.');
        }
    };

  // 담당 PD 변경
  const updateProjectPd = async (projectId, newPdId) => {
    try {
      const response = await api.put(`/projects/${projectId}`, {
        assignedPd: newPdId
      });

      if (response.status === 200) {
        // 서버 응답에서 populate된 assignedPd 정보 사용
        const updatedProject = response.data.project;
        setProjects(prev => prev.map(project =>
          project._id === projectId
            ? { ...project, assignedPd: updatedProject.assignedPd }
            : project
        ));
        setEditingProject(null);
      }
    } catch (error) {
      console.error('담당 PD 변경 실패:', error);
      alert('담당 PD 변경에 실패했습니다.');
    }
  };

  // 편집 모드 시작
  const startEditing = (projectId) => {
    setEditingProject(projectId);
  };

  // 편집 모드 취소
  const cancelEditing = () => {
    setEditingProject(null);
  };

  // 상태 텍스트 변환
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'pending': return '대기중';
      case 'hidden': return '숨김';
      default: return status;
    }
  };

  // 상태별 스타일 클래스
  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return ss.statusActive;
      case 'completed': return ss.statusCompleted;
      case 'pending': return ss.statusPending;
      case 'hidden': return ss.statusHidden;
      default: return ss.statusDefault;
    }
  };

      // 담당 PD 이름 가져오기
    const getPdName = (assignedPd) => {
        if (!assignedPd) return '미지정';
        
        // assignedPd가 populate된 객체인 경우
        if (typeof assignedPd === 'object' && assignedPd.name) {
            return assignedPd.name;
        }
        
        // assignedPd가 ID인 경우 (pdList에서 찾기)
        const pd = pdList.find(pd => pd._id === assignedPd);
        return pd ? pd.name : '미지정';
    };

    // 담당 PD 역할 가져오기
    const getPdRole = (assignedPd) => {
        if (!assignedPd) return '';
        
        // assignedPd가 populate된 객체인 경우 (pdList에서 찾기)
        if (typeof assignedPd === 'object' && assignedPd._id) {
            const pd = pdList.find(pd => pd._id === assignedPd._id);
            if (!pd) return '';
            
            switch (pd.role) {
                case 'super_admin': return '슈퍼관리자';
                case 'admin': return '관리자';
                case 'pd': return 'PD';
                default: return pd.role;
            }
        }
        
        // assignedPd가 ID인 경우 (pdList에서 찾기)
        const pd = pdList.find(pd => pd._id === assignedPd);
        if (!pd) return '';
        
        switch (pd.role) {
            case 'super_admin': return '슈퍼관리자';
            case 'admin': return '관리자';
            case 'pd': return 'PD';
            default: return pd.role;
        }
    };

    // 담당 PD ID 가져오기 (select의 defaultValue용)
    const getPdId = (assignedPd) => {
        if (!assignedPd) return '';
        
        // assignedPd가 populate된 객체인 경우
        if (typeof assignedPd === 'object' && assignedPd._id) {
            return assignedPd._id;
        }
        
        // assignedPd가 ID인 경우
        return assignedPd;
    };

    // 이미지 로드 완료 핸들러
    const handleImageLoad = (projectId) => {
        setImageLoadStates(prev => ({
            ...prev,
            [projectId]: true
        }));
    };

  if (loading) {
    return (
      <div className={ss.loadingContainer}>
        <div className={ss.loadingSpinner}></div>
        <p>프로젝트 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={ss.container}>
      {/* 헤더 */}
      <div className={ss.header}>
        <h1>프로젝트 관리</h1>
      </div>

                  {/* 검색 */}
            <div className={ss.controls}>
                <div className={ss.searchBox}>
                    <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
                    <input
                        type="text"
                        placeholder="프로젝트명 또는 설명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={ss.searchInput}
                    />
                </div>
            </div>

      {/* 프로젝트 목록 */}
      <div className={ss.projectList}>
        {currentData.length === 0 ? (
          <div className={ss.emptyState}>
            <p>표시할 프로젝트가 없습니다.</p>
          </div>
                        ) : (
                    currentData.map(project => (
                        <div key={project._id} className={ss.projectCard}>
                            {/* 이미지 스켈레톤 */}
                            {!imageLoadStates[project._id] && (
                                <div className={ss.image_skeleton}>
                                    <div className={ss.skeleton_animation}></div>
                                </div>
                            )}
                            
                            {/* 실제 이미지 */}
                            <img 
                                src={getProjectThumbnail(project.thumbnail)} 
                                alt={project.title} 
                                className={`${ss.project_thumbnail} ${imageLoadStates[project._id] ? ss.loaded : ss.loading}`}
                                onLoad={() => handleImageLoad(project._id)}
                                style={{ display: imageLoadStates[project._id] ? 'block' : 'none' }}
                            />
                            
                            <div className={ss.project_overlay}></div>
                            
                            <div className={ss.projectHeader}>
                <div className={ss.projectInfo}>
                  <h3 className={ss.projectTitle}>{project.title}</h3>
                  <span className={`${ss.statusBadge} ${getStatusClass(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <div className={ss.projectActions}>
                                                      <button
                                        onClick={() => toggleProjectVisibility(project._id, project.isHide)}
                                        className={`${ss.actionBtn} ${ss.visibilityBtn}`}
                                        title={project.isHide ? '숨기기 해제' : '숨기기'}
                                    >
                                        <FontAwesomeIcon 
                                            icon={project.isHide ? faEye : faEyeSlash} 
                                        />
                                    </button>
                  <button
                    onClick={() => startEditing(project._id)}
                    className={`${ss.actionBtn} ${ss.editBtn}`}
                    title="담당 PD 편집"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </div>
              </div>

              <div className={ss.projectDetails}>
                <p className={ss.projectDescription}>
                  {project.description || '설명이 없습니다.'}
                </p>

                <div className={ss.projectMeta}>
                  <div className={ss.metaItem}>
                    <span className={ss.metaLabel}>담당 PD:</span>
                    <span className={ss.metaValue}>
                      {editingProject === project._id ? (
                        <div className={ss.pdEditContainer}>
                          <select
                            defaultValue={getPdId(project.assignedPd)}
                            onChange={(e) => updateProjectPd(project._id, e.target.value)}
                            className={ss.pdSelect}
                          >
                            <option value="">미지정</option>
                            {pdList.map(pd => (
                              <option key={pd._id} value={pd._id}>
                                {pd.name}
                              </option>
                            ))}
                          </select>
                          <div className={ss.editActions}>
                            <button
                              onClick={() => cancelEditing()}
                              className={ss.cancelBtn}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                                                                      ) : (
                                                    <span className={`${ss.pdName} ${project.assignedPd ? ss.assigned : ''}`}>
                                                        <FontAwesomeIcon icon={faUser} />
                                                        {getPdName(project.assignedPd)}
                                                        {getPdRole(project.assignedPd) && (
                                                            <span className={ss.pdRole}>
                                                                ({getPdRole(project.assignedPd)})
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                    </span>
                  </div>

                  {project.deadline && (
                    <div className={ss.metaItem}>
                      <span className={ss.metaLabel}>마감일:</span>
                      <span className={ss.metaValue}>
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

                  {/* 통계 정보 */}
            <div className={ss.stats}>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>전체 프로젝트</span>
                    <span className={ss.statValue}>{projects.length}</span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>활성 프로젝트</span>
                    <span className={ss.statValue}>
                        {projects.filter(p => !p.isHide).length}
                    </span>
                </div>
                <div className={ss.statItem}>
                    <span className={ss.statLabel}>숨김</span>
                    <span className={ss.statValue}>
                        {projects.filter(p => p.isHide).length}
                    </span>
                </div>
            </div>

                  {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className={ss.pagination_container}>
                    <div className={ss.pagination_info}>
                        총 {filteredProjects.length}개 중 {startIndex + 1}-{Math.min(endIndex, filteredProjects.length)}개 표시
                    </div>
                    <div className={ss.pagination_controls}>
                        <button 
                            className={ss.pagination_button}
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                        >
                            처음
                        </button>
                        <button 
                            className={ss.pagination_button}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                            disabled={currentPage === 1}
                        >
                            이전
                        </button>
                        
                        <div className={ss.page_numbers}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        className={`${ss.page_button} ${currentPage === pageNum ? ss.active_page : ''}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button 
                            className={ss.pagination_button}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                            disabled={currentPage === totalPages}
                        >
                            다음
                        </button>
                        <button 
                            className={ss.pagination_button}
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                        >
                            마지막
                        </button>
                    </div>
                </div>
            )}

            {/* 숨긴 프로젝트 섹션 */}
            {projects.filter(p => p.isHide).length > 0 && (
                <div className={ss.hidden_section}>
                    <div className={ss.hidden_header}>
                        <h2>숨긴 프로젝트</h2>
                        <span className={ss.hidden_count}>
                            {projects.filter(p => p.isHide).length}개
                        </span>
                    </div>
                    
                    <div className={ss.projectList}>
                        {projects.filter(p => p.isHide).map(project => (
                            <div key={project._id} className={`${ss.projectCard} ${ss.hidden_card}`}>
                                {/* 이미지 스켈레톤 */}
                                {!imageLoadStates[project._id] && (
                                    <div className={ss.image_skeleton}>
                                        <div className={ss.skeleton_animation}></div>
                                    </div>
                                )}
                                
                                {/* 실제 이미지 */}
                                <img 
                                    src={getProjectThumbnail(project.thumbnail)} 
                                    alt={project.title} 
                                    className={`${ss.project_thumbnail} ${imageLoadStates[project._id] ? ss.loaded : ss.loading}`}
                                    onLoad={() => handleImageLoad(project._id)}
                                    style={{ display: imageLoadStates[project._id] ? 'block' : 'none' }}
                                />
                                
                                <div className={ss.project_overlay}></div>
                                
                                <div className={ss.projectHeader}>
                                    <div className={ss.projectInfo}>
                                        <h3 className={ss.projectTitle}>{project.title}</h3>
                                        <span className={`${ss.statusBadge} ${getStatusClass(project.status)}`}>
                                            {getStatusText(project.status)}
                                        </span>
                                    </div>
                                    <div className={ss.projectActions}>
                                        <button
                                            onClick={() => toggleProjectVisibility(project._id, project.isHide)}
                                            className={`${ss.actionBtn} ${ss.visibilityBtn}`}
                                            title="숨기기 해제"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            onClick={() => startEditing(project._id)}
                                            className={`${ss.actionBtn} ${ss.editBtn}`}
                                            title="담당 PD 편집"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    </div>
                                </div>

                                <div className={ss.projectDetails}>
                                    <p className={ss.projectDescription}>
                                        {project.description || '설명이 없습니다.'}
                                    </p>
                                    
                                    <div className={ss.projectMeta}>
                                        <div className={ss.metaItem}>
                                            <span className={ss.metaLabel}>담당 PD:</span>
                                            <span className={ss.metaValue}>
                                                {editingProject === project._id ? (
                                                    <div className={ss.pdEditContainer}>
                                                        <select
                                                            defaultValue={getPdId(project.assignedPd)}
                                                            onChange={(e) => updateProjectPd(project._id, e.target.value)}
                                                            className={ss.pdSelect}
                                                        >
                                                            <option value="">미지정</option>
                                                            {pdList.map(pd => (
                                                                <option key={pd._id} value={pd._id}>
                                                                    {pd.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className={ss.editActions}>
                                                            <button
                                                                onClick={() => cancelEditing()}
                                                                className={ss.cancelBtn}
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className={`${ss.pdName} ${project.assignedPd ? ss.assigned : ''}`}>
                                                        <FontAwesomeIcon icon={faUser} />
                                                        {getPdName(project.assignedPd)}
                                                        {getPdRole(project.assignedPd) && (
                                                            <span className={ss.pdRole}>
                                                                ({getPdRole(project.assignedPd)})
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        
                                        {project.deadline && (
                                            <div className={ss.metaItem}>
                                                <span className={ss.metaLabel}>마감일:</span>
                                                <span className={ss.metaValue}>
                                                    {new Date(project.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
    </div>
  );
};

export default AdminProject;