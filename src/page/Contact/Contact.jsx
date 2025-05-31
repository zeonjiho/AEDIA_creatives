import React, { useState, useEffect } from 'react';
import styles from './Contact.module.css';
import { 
  HiSearch, HiUser, HiUserGroup, HiPhone, HiMail, 
  HiOfficeBuilding, HiClock, HiTag, HiDocument,
  HiViewGrid, HiViewList, HiPencil, HiCheck, HiX, HiPlus
} from 'react-icons/hi';
import StaffSearchModal from '../../components/StaffSearchModal/StaffSearchModal';

// 스탭 데이터 (StaffSearchModal에서 가져온 데이터)
const allStaffData = [
  { id: 1, name: '김연출', type: 'staff', position: '연출', phone: '010-1234-5678', email: 'kim.director@example.com' },
  { id: 2, name: '이조연출', type: 'staff', position: '조연출',  phone: '010-2345-6789', email: 'lee.ad@example.com' },
  { id: 3, name: '박제작', type: 'staff', position: '제작 PD', phone: '010-3456-7890', email: 'park.pd@example.com' },
  { id: 4, name: '최촬감', type: 'staff', position: '촬영감독', phone: '010-4567-8901', email: 'choi.dop@example.com' },
  { id: 5, name: '정조명', type: 'staff', position: '조명감독', phone: '010-5678-9012', email: 'jung.gaffer@example.com' },
  { id: 6, name: '강미감', type: 'staff', position: '미술감독', phone: '010-6789-0123', email: 'kang.pd@example.com' },
  { id: 7, name: '윤지미집', type: 'staff', position: '지미집', phone: '010-7890-1234', email: 'yoon.jimmy@example.com' },
  { id: 8, name: '임CG', type: 'staff', position: 'CG', phone: '010-8901-2345', email: 'lim.cg@example.com' },
  { id: 9, name: '홍클리닝', type: 'staff', position: '클리닝', phone: '010-9012-3456', email: 'hong.clean@example.com' },
  { id: 10, name: '송DI', type: 'staff', position: 'DI', phone: '010-0123-4567', email: 'song.di@example.com' },
  { id: 11, name: '김직원1', type: 'employee', position: '프로듀서', department: '제작팀', email: 'kim@company.com', phone: '010-1111-2222' },
  { id: 12, name: '이직원2', type: 'employee', position: '매니저', department: '기획팀', email: 'lee@company.com', phone: '010-2222-3333' },
  { id: 13, name: '박직원3', type: 'employee', position: '디자이너', department: '디자인팀', email: 'park@company.com', phone: '010-3333-4444' },
  { id: 14, name: '최직원4', type: 'employee', position: '개발자', department: '개발팀', email: 'choi@company.com', phone: '010-4444-5555' },
  { id: 15, name: '정직원5', type: 'employee', position: '마케터', department: '마케팅팀', email: 'jung@company.com', phone: '010-5555-6666' },
];

const Contact = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [filteredStaff, setFilteredStaff] = useState(allStaffData);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('card'); // 'card' 또는 'list'
  const [staffData, setStaffData] = useState(allStaffData); // 실제 데이터 관리
  const [editingId, setEditingId] = useState(null); // 현재 편집 중인 항목 ID
  const [editingData, setEditingData] = useState({}); // 편집 중인 데이터
  const [successMessage, setSuccessMessage] = useState(''); // 성공 메시지
  
  // 스탭 검색 모달 관련 상태
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

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
      filtered = filtered.filter(person => person.type === typeFilter);
    }

    // 직책 필터링
    if (positionFilter !== 'all') {
      filtered = filtered.filter(person => person.position === positionFilter);
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.phone && person.phone.includes(searchTerm)) ||
        (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredStaff(filtered);
  }, [searchTerm, typeFilter, positionFilter, staffData]); // staffData 의존성 추가

  // 고유 직책 목록 생성
  const uniquePositions = [...new Set(staffData.map(person => person.position))]; // allStaffData 대신 staffData 사용

  const getTypeText = (type) => {
    return type === 'staff' ? '외부 스탭' : '내부 직원';
  };

  const getTypeClass = (type) => {
    return type === 'staff' ? styles.type_staff : styles.type_employee;
  };

  // 편집 시작
  const startEditing = (person) => {
    setEditingId(person.id);
    setEditingData({ ...person });
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({});
  };

  // 편집 저장
  const saveEditing = () => {
    setStaffData(prevData =>
      prevData.map(person =>
        person.id === editingId ? { ...editingData } : person
      )
    );
    setEditingId(null);
    setEditingData({});
    setSuccessMessage('연락처가 성공적으로 수정되었습니다.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 편집 데이터 변경
  const handleEditChange = (field, value) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  // 편집 가능한 필드 확인 (외부스탭만 편집 가능)
  const getEditableFields = (type) => {
    if (type === 'staff') {
      return ['position', 'phone', 'email'];
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
  const handleStaffSelect = (selectedStaff) => {
    if (selectedStaff.length > 0) {
      const newStaff = selectedStaff.filter(staff => 
        !staffData.some(existing => existing.id === staff.id)
      );
      
      if (newStaff.length > 0) {
        setStaffData(prevData => [...prevData, ...newStaff]);
        setSuccessMessage(`${newStaff.length}명의 스탭이 연락처에 추가되었습니다.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  // 편집 모드에서 필드 렌더링
  const renderEditableField = (person, field, icon, label, isEditing) => {
    const editableFields = getEditableFields(person.type);
    const canEdit = editableFields.includes(field);
    
    if (isEditing && canEdit) {
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
    } else {
      const value = person[field];
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
          const isEditing = editingId === person.id;
          return (
            <div key={person.id} className={styles.staff_card}>
              <div className={styles.card_header}>
                <div className={styles.person_avatar}>
                  {person.name.charAt(0)}
                </div>
                <div className={styles.person_basic}>
                  <h3 className={styles.person_name}>{person.name}</h3>
                  <span className={`${styles.person_type} ${getTypeClass(person.type)}`}>
                    {getTypeText(person.type)}
                  </span>
                </div>
                <div className={styles.card_actions}>
                  {person.type === 'staff' && ( // 외부 스탭만 편집 버튼 표시
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
                        <button
                          onClick={() => startEditing(person)}
                          className={`${styles.action_btn} ${styles.edit_btn}`}
                          title="수정"
                        >
                          <HiPencil />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.card_content}>
                {renderEditableField(person, 'position', <HiTag className={styles.info_icon} />, '직책', isEditing)}
                
                {renderEditableField(person, 'department', <HiOfficeBuilding className={styles.info_icon} />, '부서', isEditing)}
                
                {person.experience && (
                  <div className={styles.info_item}>
                    <HiClock className={styles.info_icon} />
                    <span className={styles.info_label}>경력:</span>
                    <span className={styles.info_value}>{person.experience}</span>
                  </div>
                )}
                
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
            <div className={styles.list_header_cell}>부서</div>
            <div className={styles.list_header_cell}>경력</div>
            <div className={styles.list_header_cell}>연락처</div>
            <div className={styles.list_header_cell}>이메일</div>
            <div className={styles.list_header_cell}>작업</div>
          </div>
          
          {/* 리스트 아이템들 */}
          <div className={styles.list_body}>
            {filteredStaff.map(person => {
              const isEditing = editingId === person.id;
              const editableFields = getEditableFields(person.type);
              
              return (
                <div key={person.id} className={styles.list_item}>
                  <div className={styles.list_cell}>
                    <div className={styles.list_person_info}>
                      <div className={styles.list_avatar}>
                        {person.name.charAt(0)}
                      </div>
                      <div className={styles.list_name_section}>
                        <span className={styles.list_person_name}>{person.name}</span>
                        <span className={`${styles.list_person_type} ${getTypeClass(person.type)}`}>
                          {getTypeText(person.type)}
                        </span>
                        <div className={styles.mobile_contact_info}>
                          <span className={styles.mobile_contact_item}>
                            {person.position} • {person.department}
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
                    {isEditing && editableFields.includes('position') ? (
                      <input
                        type="text"
                        value={editingData.position || ''}
                        onChange={(e) => handleEditChange('position', e.target.value)}
                        className={styles.list_edit_input}
                      />
                    ) : (
                      person.position
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
                    {person.type === 'staff' ? ( // 외부 스탭만 편집 버튼 표시
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
                          <button
                            onClick={() => startEditing(person)}
                            className={`${styles.action_btn} ${styles.edit_btn}`}
                            title="수정"
                          >
                            <HiPencil />
                          </button>
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
            <HiUser /> {staffData.filter(p => p.type === 'staff').length}명 외부 스탭
          </span>
          <span className={styles.stats_item}>
            <HiUserGroup /> {staffData.filter(p => p.type === 'employee').length}명 내부 직원
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
              className={`${styles.filter_tab} ${typeFilter === 'staff' ? styles.active : ''}`}
              onClick={() => setTypeFilter('staff')}
            >
              <HiUser /> 외부 스탭
            </button>
            <button 
              className={`${styles.filter_tab} ${typeFilter === 'employee' ? styles.active : ''}`}
              onClick={() => setTypeFilter('employee')}
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
        title="외부 스탭 추가"
        initialFilterType="staff"
      />
    </div>
  );
};

export default Contact; 