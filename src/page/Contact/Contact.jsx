import React, { useState, useEffect } from 'react';
import styles from './Contact.module.css';
import { 
  HiSearch, HiUser, HiUserGroup, HiPhone, HiMail, 
  HiOfficeBuilding, HiClock, HiTag, HiDocument,
  HiViewGrid, HiViewList, HiPencil, HiCheck, HiX, HiPlus, HiTrash
} from 'react-icons/hi';
import StaffSearchModal from '../../components/StaffSearchModal/StaffSearchModal';
import api from '../../utils/api';

// 스탭 데이터 (StaffSearchModal에서 가져온 데이터)
// const allStaffData = [
//   { id: 1, name: '김연출', userType: 'external', roles: ['연출'], phone: '010-1234-5678', email: 'kim.director@example.com' },
//   { id: 2, name: '이조연출', userType: 'external', roles: ['조연출'], phone: '010-2345-6789', email: 'lee.ad@example.com' },
//   { id: 3, name: '박제작', userType: 'external', roles: ['제작 PD'], phone: '010-3456-7890', email: 'park.pd@example.com' },
//   { id: 4, name: '최촬감', userType: 'external', roles: ['촬영감독'], phone: '010-4567-8901', email: 'choi.dop@example.com' },
//   { id: 5, name: '정조명', userType: 'external', roles: ['조명감독'], phone: '010-5678-9012', email: 'jung.gaffer@example.com' },
//   { id: 6, name: '강미감', userType: 'external', roles: ['미술감독'], phone: '010-6789-0123', email: 'kang.pd@example.com' },
//   { id: 7, name: '윤지미집', userType: 'external', roles: ['지미집'], phone: '010-7890-1234', email: 'yoon.jimmy@example.com' },
//   { id: 8, name: '임CG', userType: 'external', roles: ['CG'], phone: '010-8901-2345', email: 'lim.cg@example.com' },
//   { id: 9, name: '홍클리닝', userType: 'external', roles: ['클리닝'], phone: '010-9012-3456', email: 'hong.clean@example.com' },
//   { id: 10, name: '송DI', userType: 'external', roles: ['DI'], phone: '010-0123-4567', email: 'song.di@example.com' },
//   { id: 11, name: '김직원1', userType: 'internal', roles: ['프로듀서'], department: '제작팀', email: 'kim@company.com', phone: '010-1111-2222' },
//   { id: 12, name: '이직원2', userType: 'internal', roles: ['매니저'], department: '기획팀', email: 'lee@company.com', phone: '010-2222-3333' },
//   { id: 13, name: '박직원3', userType: 'internal', roles: ['디자이너'], department: '디자인팀', email: 'park@company.com', phone: '010-3333-4444' },
//   { id: 14, name: '최직원4', userType: 'internal', roles: ['개발자'], department: '개발팀', email: 'choi@company.com', phone: '010-4444-5555' },
//   { id: 15, name: '정직원5', userType: 'internal', roles: ['마케터'], department: '마케팅팀', email: 'jung@company.com', phone: '010-5555-6666' },
// ];

const Contact = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('card'); // 'card' 또는 'list'
  const [staffData, setStaffData] = useState([]); // 실제 데이터 관리
  const [editingId, setEditingId] = useState(null); // 현재 편집 중인 항목 ID
  const [editingData, setEditingData] = useState({}); // 편집 중인 데이터
  const [successMessage, setSuccessMessage] = useState(''); // 성공 메시지
  const [allStaffData, setAllStaffData] = useState([]);
  
  // 스탭 검색 모달 관련 상태
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  useEffect(() => {
    fetchAllStaffData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let filtered = staffData; // allStaffData 대신 staffData 사용

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(person => person.userType === typeFilter);
    }

    // 직책 필터링
    if (positionFilter !== 'all') {
      filtered = filtered.filter(person =>
        person.roles && person.roles.length > 0 && person.roles.includes(positionFilter)
      );
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.roles && person.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (person.department && person.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.phone && person.phone.includes(searchTerm)) ||
        (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // userType별 정렬 (internal 먼저, external 나중에)
    filtered = filtered.sort((a, b) => {
      if (a.userType !== b.userType) {
        return a.userType === 'internal' ? -1 : 1;
      }
      return 0; // 같은 타입 내에서는 기존 순서 유지
    });

    setFilteredStaff(filtered);
  }, [searchTerm, typeFilter, positionFilter, staffData]); // staffData 의존성 추가

  const fetchAllStaffData = async () => {
    try {
      const response = await api.get('/get-user-list?userType=all');
      if (response.status === 200) {
        setAllStaffData(response.data);
        setFilteredStaff(response.data);
        setStaffData(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // 고유 직책 목록 생성
  const uniquePositions = [...new Set(
    staffData
      .filter(person => person.roles && person.roles.length > 0)
      .map(person => person.roles[0])
  )];

  const getTypeText = (type) => {
    return type === 'external' ? '외부 스탭' : '내부 직원';
  };

  const getTypeClass = (type) => {
    return type === 'external' ? styles.type_staff : styles.type_employee;
  };

  // 편집 시작
  const startEditing = (person) => {
    setEditingId(person._id || person.id); // MongoDB _id를 우선 사용
    setEditingData({ ...person });
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  // 편집 저장
  const saveEditing = async () => {
    try {
      // 필수 필드 검증
      if (!editingData.name || !editingData.name.trim()) {
        alert('이름은 필수 입력 항목입니다.');
        return;
      }

      // roles 처리 - 첫 번째 역할만 사용
      let roles = [];
      if (editingData.roles) {
        if (Array.isArray(editingData.roles)) {
          roles = editingData.roles.filter(role => role && role.trim());
        } else if (typeof editingData.roles === 'string') {
          // 문자열인 경우 첫 번째 역할만 사용
          const firstRole = editingData.roles.split(',')[0].trim();
          if (firstRole) {
            roles = [firstRole];
          }
        }
      }

      const updateData = {
        staffId: editingData._id || editingData.id,
        name: editingData.name.trim(),
        email: editingData.email || '',
        phone: editingData.phone || '',
        roles: roles,
        department: editingData.department || ''
      };

      const response = await api.post('/modify-staff', updateData);

      if (response.status === 200) {
        // 편집 상태 초기화
    setEditingId(null);
    setEditingData({});
        
        // 서버에서 최신 데이터를 다시 받아옴
        await fetchAllStaffData();
        
    setSuccessMessage('연락처가 성공적으로 수정되었습니다.');
    setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('스탭 수정 실패:', error);
      let errorMessage = '수정 중 오류가 발생했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  // 삭제 처리
  const handleDelete = async (person) => {
    if (!window.confirm(`정말로 ${person.name}님의 연락처를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const deleteData = {
        staffId: person._id || person.id
      };

      const response = await api.post('/delete-staff', deleteData);

      if (response.status === 200) {
        // 서버에서 최신 데이터를 다시 받아옴
        await fetchAllStaffData();
        
        setSuccessMessage(`${person.name}님의 연락처가 삭제되었습니다.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('스탭 삭제 실패:', error);
      let errorMessage = '삭제 중 오류가 발생했습니다.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      alert(errorMessage);
    }
  };

  // 편집 데이터 변경
  const handleEditChange = (field, value) => {
    if (field === 'roles') {
      // roles는 하나의 직책만 입력받아 배열로 저장
      if (typeof value === 'string') {
        const trimmedValue = value.trim();
        setEditingData(prev => ({
          ...prev,
          [field]: trimmedValue ? [trimmedValue] : []
        }));
      } else {
        setEditingData(prev => ({ ...prev, [field]: value }));
      }
    } else {
    setEditingData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 편집 가능한 필드 확인 (외부스탭만 편집 가능)
  const getEditableFields = (type) => {
    if (type === 'external') {
      return ['name', 'roles', 'department', 'phone', 'email'];
    } else {
      return []; // 내부직원은 편집 불가
    }
  };

  // 스탭 추가 모달 열기
  const handleAddStaffClick = () => {
    setIsStaffModalOpen(true);
  };

  // 스탭 추가 모달 닫기
  const handleStaffModalClose = () => {
    setIsStaffModalOpen(false);
  };

  // 스탭 선택 완료 핸들러
  const handleStaffSelect = async (selectedStaff) => {
    if (selectedStaff.length > 0) {
      // 서버에서 최신 데이터를 다시 받아옴 (새로 추가된 스탭 포함)
      await fetchAllStaffData();
      
      setSuccessMessage(`${selectedStaff.length}명의 스탭이 연락처에 추가되었습니다.`);
        setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // 편집 모드에서 필드 렌더링
  const renderEditableField = (person, field, icon, label, isEditing) => {
    const editableFields = getEditableFields(person.userType);
    const canEdit = editableFields.includes(field);
    
    if (isEditing && canEdit) {
      if (field === 'roles') {
        return (
          <div className={styles.info_item}>
            {icon && <span className={styles.info_icon}>{icon}</span>}
            <span className={styles.info_label}>{label}:</span>
            <input
              type="text"
              value={editingData.roles ? (Array.isArray(editingData.roles) ? editingData.roles[0] || '' : editingData.roles) : ''}
              onChange={(e) => handleEditChange(field, e.target.value)}
              className={styles.edit_input}
              placeholder="직책을 입력하세요"
            />
          </div>
        );
      } else {
      return (
        <div className={styles.info_item}>
          {icon && <span className={styles.info_icon}>{icon}</span>}
          <span className={styles.info_label}>{label}:</span>
          <input
            type={field === 'email' ? 'email' : 'text'}
            value={editingData[field] || ''}
            onChange={(e) => handleEditChange(field, e.target.value)}
            className={styles.edit_input}
          />
        </div>
      );
      }
    } else {
      let value = person[field];

      // roles 필드인 경우 배열을 문자열로 변환
      if (field === 'roles') {
        if (!person.roles || person.roles.length === 0) return null;
        value = person.roles.join(', ');
      }

      if (!value) return null;
      
      return (
        <div className={styles.info_item}>
          {icon && <span className={styles.info_icon}>{icon}</span>}
          <span className={styles.info_label}>{label}:</span>
          {field === 'phone' ? (
            <a href={`tel:${value}`} className={styles.contact_link}>{value}</a>
          ) : field === 'email' ? (
            <a href={`mailto:${value}`} className={styles.contact_link}>{value}</a>
          ) : (
            <span className={styles.info_value}>{value}</span>
          )}
        </div>
      );
    }
  };

  // 카드뷰 렌더링
  const renderCardView = () => (
    <div className={styles.staff_grid}>
      {filteredStaff.length === 0 ? (
        <div className={styles.no_results}>
          <HiDocument />
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        filteredStaff.map(person => {
          const isEditing = editingId === (person._id || person.id);
          return (
            <div key={person._id || person.id} className={styles.staff_card}>
              <div className={styles.card_header}>
                <div className={styles.person_avatar}>
                  {person.name.charAt(0)}
                </div>
                <div className={styles.person_basic}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingData.name || ''}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className={styles.edit_input}
                      placeholder="이름을 입력하세요"
                    />
                  ) : (
                  <h3 className={styles.person_name}>{person.name}</h3>
                  )}
                  <span className={`${styles.person_type} ${getTypeClass(person.userType)}`}>
                    {getTypeText(person.userType)}
                  </span>
                </div>
                <div className={styles.card_actions}>
                  {person.userType === 'external' && ( // 외부 스탭만 편집 버튼 표시
                    <>
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEditing}
                            className={`${styles.action_btn} ${styles.save_btn}`}
                            title="저장"
                          >
                            <HiCheck />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className={`${styles.action_btn} ${styles.cancel_btn}`}
                            title="취소"
                          >
                            <HiX />
                          </button>
                        </>
                      ) : (
                        <>
                        <button
                          onClick={() => startEditing(person)}
                          className={`${styles.action_btn} ${styles.edit_btn}`}
                          title="수정"
                        >
                          <HiPencil />
                        </button>
                          <button
                            onClick={() => handleDelete(person)}
                            className={`${styles.action_btn} ${styles.delete_btn}`}
                            title="삭제"
                          >
                            <HiTrash />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.card_content}>
                {renderEditableField(person, 'roles', <HiTag className={styles.info_icon} />, '직책', isEditing)}
                
                {renderEditableField(person, 'department', <HiOfficeBuilding className={styles.info_icon} />, '회사', isEditing)}
                
                {/* {person.experience && (
                  <div className={styles.info_item}>
                    <HiClock className={styles.info_icon} />
                    <span className={styles.info_label}>경력:</span>
                    <span className={styles.info_value}>{person.experience}</span>
                  </div>
                )} */}
                
                {renderEditableField(person, 'phone', <HiPhone className={styles.info_icon} />, '연락처', isEditing)}
                
                {renderEditableField(person, 'email', <HiMail className={styles.info_icon} />, '이메일', isEditing)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // 리스트뷰 렌더링
  const renderListView = () => (
    <div className={styles.staff_list}>
      {filteredStaff.length === 0 ? (
        <div className={styles.no_results}>
          <HiDocument />
          <p>검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.list_container}>
          {/* 리스트 헤더 */}
          <div className={styles.list_header}>
            <div className={styles.list_header_cell}>이름</div>
            <div className={styles.list_header_cell}>직책</div>
            <div className={styles.list_header_cell}>부서/회사</div>
            <div className={styles.list_header_cell}>경력</div>
            <div className={styles.list_header_cell}>연락처</div>
            <div className={styles.list_header_cell}>이메일</div>
            <div className={styles.list_header_cell}>작업</div>
          </div>
          
          {/* 리스트 아이템들 */}
          <div className={styles.list_body}>
            {filteredStaff.map(person => {
              const isEditing = editingId === (person._id || person.id);
              const editableFields = getEditableFields(person.userType);
              
              return (
                <div key={person._id || person.id} className={styles.list_item}>
                  <div className={styles.list_cell}>
                    <div className={styles.list_person_info}>
                      <div className={styles.list_avatar}>
                        {person.name.charAt(0)}
                      </div>
                      <div className={styles.list_name_section}>
                        {isEditing && editableFields.includes('name') ? (
                          <input
                            type="text"
                            value={editingData.name || ''}
                            onChange={(e) => handleEditChange('name', e.target.value)}
                            className={styles.list_edit_input}
                            placeholder="이름 입력"
                          />
                        ) : (
                        <span className={styles.list_person_name}>{person.name}</span>
                        )}
                        <span className={`${styles.list_person_type} ${getTypeClass(person.userType)}`}>
                          {getTypeText(person.userType)}
                        </span>
                        <div className={styles.mobile_contact_info}>
                          <span className={styles.mobile_contact_item}>
                            {person.roles && person.roles.length > 0 ? person.roles[0] : '직책 없음'} • {person.department}
                            {person.experience && ` • ${person.experience}`}
                          </span>
                          {person.phone && (
                            <a href={`tel:${person.phone}`} className={styles.mobile_contact_link}>
                              📞 {person.phone}
                            </a>
                          )}
                          {person.email && (
                            <a href={`mailto:${person.email}`} className={styles.mobile_contact_link}>
                              ✉️ {person.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.list_cell}>
                    {isEditing && editableFields.includes('roles') ? (
                      <input
                        type="text"
                        value={editingData.roles ? (Array.isArray(editingData.roles) ? editingData.roles[0] || '' : editingData.roles) : ''}
                        onChange={(e) => handleEditChange('roles', e.target.value)}
                        className={styles.list_edit_input}
                        placeholder="직책 입력"
                      />
                    ) : (
                      person.roles && person.roles.length > 0 ? person.roles.join(', ') : '직책 없음'
                    )}
                  </div>
                  
                  <div className={styles.list_cell}>
                    {isEditing && editableFields.includes('department') ? (
                      <input
                        type="text"
                        value={editingData.department || ''}
                        onChange={(e) => handleEditChange('department', e.target.value)}
                        className={styles.list_edit_input}
                      />
                    ) : (
                      person.department
                    )}
                  </div>
                  
                  <div className={styles.list_cell}>{person.experience || '-'}</div>
                  
                  <div className={styles.list_cell}>
                    {isEditing && editableFields.includes('phone') ? (
                      <input
                        type="text"
                        value={editingData.phone || ''}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className={styles.list_edit_input}
                      />
                    ) : person.phone ? (
                      <a href={`tel:${person.phone}`} className={styles.contact_link}>
                        {person.phone}
                      </a>
                    ) : '-'}
                  </div>
                  
                  <div className={styles.list_cell}>
                    {isEditing && editableFields.includes('email') ? (
                      <input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className={styles.list_edit_input}
                      />
                    ) : person.email ? (
                      <a href={`mailto:${person.email}`} className={styles.contact_link}>
                        {person.email}
                      </a>
                    ) : '-'}
                  </div>
                  
                  <div className={styles.list_cell}>
                    {person.userType === 'external' ? ( // 외부 스탭만 편집 버튼 표시
                      <>
                        {isEditing ? (
                          <div className={styles.list_actions}>
                            <button
                              onClick={saveEditing}
                              className={`${styles.action_btn} ${styles.save_btn}`}
                              title="저장"
                            >
                              <HiCheck />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className={`${styles.action_btn} ${styles.cancel_btn}`}
                              title="취소"
                            >
                              <HiX />
                            </button>
                          </div>
                        ) : (
                          <div className={styles.list_actions}>
                          <button
                            onClick={() => startEditing(person)}
                            className={`${styles.action_btn} ${styles.edit_btn}`}
                            title="수정"
                          >
                            <HiPencil />
                          </button>
                            <button
                              onClick={() => handleDelete(person)}
                              className={`${styles.action_btn} ${styles.delete_btn}`}
                              title="삭제"
                            >
                              <HiTrash />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className={styles.no_edit}>편집불가</span> // 내부직원은 편집불가 표시
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      {/* 성공 메시지 */}
      {successMessage && (
        <div className={styles.success_message}>
          <HiCheck className={styles.success_icon} />
          {successMessage}
        </div>
      )}

      {/* 헤더 */}
      <header className={styles.dashboard_header}>
        <div className={styles.header_content}>
          <h1 className={styles.dashboard_title}>Contact Directory</h1>
          <p className={styles.dashboard_date}>
            {currentTime.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} {currentTime.toLocaleTimeString('ko-KR')}
          </p>
        </div>
        
        <div className={styles.header_controls}>
          <div className={styles.view_controls}>
            <div className={styles.view_toggle_group}>
              <button 
                className={`${styles.view_toggle_btn} ${viewMode === 'card' ? styles.active : ''}`}
                onClick={() => setViewMode('card')}
                title="카드뷰"
              >
                <HiViewGrid />
              </button>
              <button 
                className={`${styles.view_toggle_btn} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
                title="리스트뷰"
              >
                <HiViewList />
              </button>
            </div>
            <button 
              className={styles.add_staff_btn}
              onClick={handleAddStaffClick}
              title="외부 스탭 추가"
            >
              <HiPlus /> 스탭 추가
            </button>
          </div>
        </div>
      </header>

      {/* 통계 정보 */}
      <div className={styles.stats_section}>
        <div className={styles.stats_info}>
          <span className={styles.stats_item}>
            <HiUser /> {staffData.filter(p => p.userType === 'external').length}명 외부 스탭
          </span>
          <span className={styles.stats_item}>
            <HiUserGroup /> {staffData.filter(p => p.userType === 'internal').length}명 내부 직원
          </span>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className={styles.search_controls}>
        <div className={styles.search_bar}>
          <HiSearch className={styles.search_icon} />
          <input
            type="text"
            placeholder="이름, 직책, 부서, 연락처로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search_input}
          />
        </div>
        
        <div className={styles.filters}>
          {/* 타입 필터 */}
          <div className={styles.filter_group}>
            <button 
              className={`${styles.filter_tab} ${typeFilter === 'all' ? styles.active : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              전체
            </button>
            <button 
              className={`${styles.filter_tab} ${typeFilter === 'external' ? styles.active : ''}`}
              onClick={() => setTypeFilter('external')}
            >
              <HiUser /> 외부 스탭
            </button>
            <button 
              className={`${styles.filter_tab} ${typeFilter === 'internal' ? styles.active : ''}`}
              onClick={() => setTypeFilter('internal')}
            >
              <HiUserGroup /> 내부 직원
            </button>
          </div>

          {/* 직책 필터 */}
          <div className={styles.filter_group}>
            <select 
              value={positionFilter} 
              onChange={(e) => setPositionFilter(e.target.value)}
              className={styles.position_select}
            >
              <option value="all">모든 직책</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 스탭 목록 - 뷰 모드에 따라 렌더링 */}
      {viewMode === 'card' ? renderCardView() : renderListView()}

      {/* 결과 요약 */}
      {filteredStaff.length > 0 && (
        <div className={styles.results_summary}>
          총 {filteredStaff.length}명의 연락처가 표시되고 있습니다.
        </div>
      )}

      {/* 스탭 검색 모달 */}
      <StaffSearchModal
        isOpen={isStaffModalOpen}
        onClose={handleStaffModalClose}
        onSelect={handleStaffSelect}
        selectedPeople={[]}
        multiSelect={true}
        from='contact'
        title="외부 스탭 추가"
        initialFilterType="external"
      />
    </div>
  );
};

export default Contact; 