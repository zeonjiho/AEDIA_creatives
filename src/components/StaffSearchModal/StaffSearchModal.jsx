import React, { useState, useEffect } from 'react';
import styles from './StaffSearchModal.module.css';
import { HiX, HiSearch, HiUser, HiUserGroup, HiCheck, HiPlus, HiSave } from 'react-icons/hi';
import api from '../../utils/api';

// 샘플 스탭 데이터
// const initialStaff = [
//   { id: 1, name: '김연출', userType: 'external', roles: ['연출'], department: '연출부', experience: '5년', phone: '010-1234-5678' },
//   { id: 2, name: '이조연출', userType: 'external', roles: ['조연출'], department: '연출부', experience: '3년', phone: '010-2345-6789' },
//   { id: 3, name: '박제작', userType: 'external', roles: ['제작 PD'], department: '제작부', experience: '7년', phone: '010-3456-7890' },
//   { id: 4, name: '최촬감', userType: 'external', roles: ['촬영감독'], department: '촬영부', experience: '8년', phone: '010-4567-8901' },
//   { id: 5, name: '정조명', userType: 'external', roles: ['조명감독'], department: '조명부', experience: '6년', phone: '010-5678-9012' },
//   { id: 6, name: '강미감', userType: 'external', roles: ['미술감독'], department: '미술부', experience: '4년', phone: '010-6789-0123' },
//   { id: 7, name: '윤지미집', userType: 'external', roles: ['지미집'], department: '미술부', experience: '2년', phone: '010-7890-1234' },
//   { id: 8, name: '임CG', userType: 'external', roles: ['CG'], department: 'VFX부', experience: '5년', phone: '010-8901-2345' },
//   { id: 9, name: '홍클리닝', userType: 'external', roles: ['클리닝'], department: '후반부', experience: '3년', phone: '010-9012-3456' },
//   { id: 10, name: '송DI', userType: 'external', roles: ['DI'], department: '후반부', experience: '4년', phone: '010-0123-4567' },
// ];

// 샘플 직원 데이터
// const sampleEmployees = [
//   { id: 11, name: '김직원1', userType: 'internal', roles: ['프로듀서'], department: '제작팀', email: 'kim@company.com', phone: '010-1111-2222' },
//   { id: 12, name: '이직원2', userType: 'internal', roles: ['매니저'], department: '기획팀', email: 'lee@company.com', phone: '010-2222-3333' },
//   { id: 13, name: '박직원3', userType: 'internal', roles: ['디자이너'], department: '디자인팀', email: 'park@company.com', phone: '010-3333-4444' },
//   { id: 14, name: '최직원4', userType: 'internal', roles: ['개발자'], department: '개발팀', email: 'choi@company.com', phone: '010-4444-5555' },
//   { id: 15, name: '정직원5', userType: 'internal', roles: ['마케터'], department: '마케팅팀', email: 'jung@company.com', phone: '010-5555-6666' },
// ];

const StaffSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedPeople = [],
  multiSelect = true,
  from,
  title = "스탭/직원 검색",
  initialFilterType = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState(initialFilterType);
  const [allPeople, setAllPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [localSelected, setLocalSelected] = useState(selectedPeople);

  // 새 스탭 추가 관련 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    position: '',
    department: '',
    experience: '',
    phone: '',
    email: ''
  });

  // 서버에서 스탭/직원 데이터 가져오기
  const fetchAllStaffData = async () => {
    try {
      const response = await api.get('/get-user-list?userType=all');
      if (response.status === 200) {
        // MongoDB _id를 id로 통일화
        const peopleWithIds = response.data.map(person => ({
          ...person,
          id: person._id || person.id // _id가 있으면 _id를 사용, 없으면 기존 id 사용
        }));
        setAllPeople(peopleWithIds);
      }
    } catch (err) {
      console.log('스탭 데이터 로딩 실패:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllStaffData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // 모달이 처음 열릴 때만 초기 설정
      setLocalSelected(selectedPeople);
      setFilterType(initialFilterType);
      console.log('모달 열림 - initialFilterType:', initialFilterType);
      console.log('초기 선택된 인원:', selectedPeople);
    } else {
      // 모달이 닫힐 때만 상태 초기화
      console.log('모달 닫힘 - 상태 초기화');
      setLocalSelected([]);
      setSearchTerm('');
      setShowAddForm(false);
      setFilteredPeople([]);
    }
  }, [isOpen]); // selectedPeople과 initialFilterType 의존성 제거

  useEffect(() => {
    // 모달이 열려있을 때만 필터링 실행
    if (!isOpen) return;

    console.log('필터링 시작 - filterType:', filterType, 'searchTerm:', searchTerm);
    let filtered = allPeople;

    // 타입 필터링
    if (filterType !== 'all') {
      filtered = filtered.filter(person => person.userType === filterType);
      console.log(`${filterType} 필터 적용 후:`, filtered.length, '명');
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.roles && person.roles.length > 0 && person.roles[0].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.department && person.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      console.log(`검색어 "${searchTerm}" 적용 후:`, filtered.length, '명');
    }

    console.log('최종 필터링 결과:', filtered.length, '명');
    setFilteredPeople(filtered);
  }, [searchTerm, filterType, allPeople, isOpen]);

  // 컴포넌트 언마운트 감지를 위한 useEffect
  useEffect(() => {
    return () => {
      console.log('StaffSearchModal 언마운트됨');
    };
  }, []);

  // 안전한 ID 비교 함수
  const getPersonId = (person) => {
    return person._id || person.id;
  };

  // 선택 상태 변화 추적
  useEffect(() => {
    if (localSelected.length > 0) {
      console.log('👥 선택 상태 변화:', localSelected.map(p => ({ 
        name: p.name, 
        id: p._id || p.id 
      })));
    } else {
      console.log('👥 선택 상태 변화: 빈 배열');
    }
  }, [localSelected]);

  if (!isOpen) return null;

  const handlePersonToggle = (person, event) => {
    // 이벤트 버블링 방지
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('=== 선택/해제 시도 ===');
    console.log('대상:', person.name, 'ID:', getPersonId(person));
    console.log('멀티선택 모드:', multiSelect);
    
    if (multiSelect) {
      const personId = getPersonId(person);
      
      // 현재 선택된 상태를 안전하게 확인
      setLocalSelected(prevSelected => {
        const isSelected = prevSelected.some(p => getPersonId(p) === personId);
        
        console.log('현재 선택 상태:', isSelected);
        console.log('현재 선택된 인원들:', prevSelected.map(p => ({ name: p.name, id: getPersonId(p) })));
        
        let newSelected;
        if (isSelected) {
          // 선택 해제
          newSelected = prevSelected.filter(p => getPersonId(p) !== personId);
          console.log('선택 해제 후:', newSelected.map(p => ({ name: p.name, id: getPersonId(p) })));
        } else {
          // 선택 추가
          newSelected = [...prevSelected, person];
          console.log('선택 추가 후:', newSelected.map(p => ({ name: p.name, id: getPersonId(p) })));
        }
        
        return newSelected;
      });
    } else {
      setLocalSelected([person]);
    }
  };

  const handleConfirm = () => {
    onSelect(localSelected);
    handleClose();
  };

  const handleClose = () => {
    console.log('모달 닫기 요청');
    // 새 스탭 추가 폼만 초기화
    setNewStaff({
      name: '',
      position: '',
      department: '',
      experience: '',
      phone: '',
      email: ''
    });
    // 모달 닫기 - useEffect에서 나머지 상태 초기화 처리됨
    onClose();
  };

  const isPersonSelected = (person) => {
    const personId = getPersonId(person);
    return localSelected.some(p => getPersonId(p) === personId);
  };

  const handleNewStaffChange = (e) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNewStaff = async (e) => {
    e.preventDefault();

    if (!newStaff.name.trim() || !newStaff.position.trim()) {
      alert('이름과 직책은 필수 입력사항입니다.');
      return;
    }

    try {
      const staffData = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        phone: newStaff.phone.trim(),
        roles: [newStaff.position.trim()],
        department: newStaff.department.trim() || '외부',
        experience: newStaff.experience.trim() || '정보없음'
      };

      const response = await api.post('/add-staff', staffData);
      
      if (response.status === 200) {
        // 서버에서 생성된 스탭 정보
        const createdStaff = response.data.staff;
        
        // ID 통일화 적용
        const staffToAdd = {
          ...createdStaff,
          id: createdStaff._id || createdStaff.id, // ID 통일화
          isExternal: true // 외부 인력 표시
        };

        // 전체 목록에 추가
        setAllPeople(prev => [...prev, staffToAdd]);

        // 새로 추가된 스탭을 바로 선택
        setLocalSelected(prev => [...prev, staffToAdd]);

        // 폼 초기화
        setNewStaff({
          name: '',
          position: '',
          department: '',
          experience: '',
          phone: '',
          email: ''
        });
        setShowAddForm(false);

        // 스탭 필터로 변경하여 새로 추가된 스탭이 보이도록
        setFilterType('external');

        alert('새 스탭이 성공적으로 추가되었습니다.');
        window.location.reload();
      }
    } catch (error) {
      console.error('스탭 추가 실패:', error);
      let errorMessage = '스탭 추가 중 오류가 발생했습니다.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const staffPositions = [
    '연출', '조연출', '제작 PD', '촬영감독', '조명감독',
    '미술감독', '지미집', 'CG', '클리닝', 'DI',
    '음향감독', '편집감독', '스크립터', '가수', '배우', '기타'
  ];

  // 새 스탭 추가 버튼은 스탭 필터가 활성화되거나 전체일 때만 표시
  const showAddStaffButton = filterType === 'all' || filterType === 'external';

  const handleBackgroundClick = (e) => {
    // 배경만 클릭했을 때만 모달 닫기
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handlePanelClick = (e) => {
    // 모달 패널 내부 클릭 시 이벤트 버블링 방지
    e.stopPropagation();
  };

  return (
    <div className={styles.modal_wrapper}>
      <div className={styles.modal_background} onClick={handleBackgroundClick}></div>
      <div className={styles.modal_panel} onClick={handlePanelClick}>
        <div className={styles.panel_header}>
          <div className={styles.panel_title}>
            <h2>{title}</h2>
          </div>
          <button className={styles.close_button} onClick={handleClose}>
            <HiX />
          </button>
        </div>

        <div className={styles.panel_content}>
          {/* 검색 및 필터 */}
          <div className={styles.search_section}>
            {from !== 'contact' && (
              <div className={styles.search_bar}>
                <HiSearch className={styles.search_icon} />
                <input
                  type="text"
                  placeholder="이름, 직책, 부서로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.search_input}
                />
              </div>
            )}

            <div className={styles.filter_tabs}>
              {from !== 'contact' && (
                <button
                  className={`${styles.filter_tab} ${filterType === 'all' ? styles.active : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('전체 버튼 클릭됨 - 현재 filterType:', filterType);
                    if (filterType !== 'all') {
                      setFilterType('all');
                      console.log('전체 필터로 변경');
                    } else {
                      console.log('이미 전체 필터 상태');
                    }
                  }}
                  type="button"
                >
                  전체
                </button>
              )}
              <button
                className={`${styles.filter_tab} ${filterType === 'external' ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('스탭 버튼 클릭됨 - 현재 filterType:', filterType);
                  if (filterType !== 'external') {
                    setFilterType('external');
                    console.log('스탭 필터로 변경');
                  } else {
                    console.log('이미 스탭 필터 상태');
                  }
                }}
                type="button"
              >
                <HiUser /> 스탭
              </button>
              {from !== 'contact' && (
                <button
                  className={`${styles.filter_tab} ${filterType === 'internal' ? styles.active : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('직원 버튼 클릭됨 - 현재 filterType:', filterType);
                    if (filterType !== 'internal') {
                      setFilterType('internal');
                      console.log('직원 필터로 변경');
                    } else {
                      console.log('이미 직원 필터 상태');
                    }
                  }}
                  type="button"
                >
                  <HiUserGroup /> 직원
                </button>
              )}

              {showAddStaffButton && (
                <button
                  className={`${styles.add_staff_tab}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('새 스탭 추가 버튼 클릭됨');
                    setShowAddForm(!showAddForm);
                  }}
                  type="button"
                >
                  <HiPlus /> 새 스탭 추가
                </button>
              )}
            </div>
          </div>

          {/* 새 스탭 추가 폼 */}
          {showAddForm && (
            <div className={styles.add_form_section}>
              <h4>새 외부 스탭 추가</h4>
              <form onSubmit={handleAddNewStaff} className={styles.add_form}>
                <div className={styles.form_row}>
                  <div className={styles.form_group}>
                    <label>이름 *</label>
                    <input
                      type="text"
                      name="name"
                      value={newStaff.name}
                      onChange={handleNewStaffChange}
                      placeholder="스탭 이름"
                      required
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>직책 *</label>
                    <select
                      name="position"
                      value={newStaff.position}
                      onChange={handleNewStaffChange}
                      required
                    >
                      <option value="">직책 선택</option>
                      {staffPositions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.form_row}>
                  <div className={styles.form_group}>
                    <label>소속/부서</label>
                    <input
                      type="text"
                      name="department"
                      value={newStaff.department}
                      onChange={handleNewStaffChange}
                      placeholder="소속 회사/부서"
                    />
                  </div>
                  {/* <div className={styles.form_group}>
                    <label>경력</label>
                    <input
                      type="text"
                      name="experience"
                      value={newStaff.experience}
                      onChange={handleNewStaffChange}
                      placeholder="예: 5년, 신입 등"
                    />
                  </div> */}
                </div>
                <div className={styles.form_row}>
                  <div className={styles.form_group}>
                    <label>연락처</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newStaff.phone}
                      onChange={handleNewStaffChange}
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div className={styles.form_group}>
                    <label>이메일</label>
                    <input
                      type="email"
                      name="email"
                      value={newStaff.email}
                      onChange={handleNewStaffChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className={styles.form_actions}>
                  <button
                    type="button"
                    className={styles.cancel_form_button}
                    onClick={() => setShowAddForm(false)}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={styles.save_form_button}
                  >
                    <HiSave /> 스탭 추가
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 선택된 인원 표시 */}
          {localSelected.length > 0 && (
            <div className={styles.selected_section}>
              <h4>선택된 인원 ({localSelected.length}명)</h4>
              <div className={styles.selected_list}>
                {localSelected.map(person => (
                  <div key={getPersonId(person)} className={styles.selected_item}>
                    <div className={styles.selected_avatar}>
                      {person.name.charAt(0)}
                    </div>
                    <span className={styles.selected_name}>{person.name}</span>
                    <span className={styles.selected_position}>
                      ({person.roles && person.roles.length > 0 ? person.roles[0] : '직책 없음'})
                    </span>
                    {person.isExternal && <span className={styles.external_badge}>외부</span>}
                    <button
                      className={styles.remove_selected}
                      onClick={(e) => handlePersonToggle(person, e)}
                    >
                      <HiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 결과 */}
          <div className={styles.results_section}>
            <div className={styles.results_grid}>
              {filteredPeople.length === 0 ? (
                <div className={styles.no_results}>
                  <p>검색 결과가 없습니다.</p>
                </div>
              ) : (
                filteredPeople.map(person => (
                  <div
                    key={getPersonId(person)}
                    className={`${styles.person_card} ${isPersonSelected(person) ? styles.selected : ''}`}
                    onClick={(e) => handlePersonToggle(person, e)}
                  >
                    <div className={styles.person_avatar}>
                      {person.name.charAt(0)}
                    </div>
                    <div className={styles.person_info}>
                      <div className={styles.person_main}>
                        <span className={styles.person_name}>{person.name}</span>
                        <div className={styles.person_badges}>
                          <span className={`${styles.person_type} ${styles[person.userType]}`}>
                            {person.userType === 'external' ? '스탭' : '직원'}
                          </span>
                          {person.isExternal && (
                            <span className={styles.external_badge}>외부</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.person_details}>
                        <span className={styles.person_position}>
                          {person.roles && person.roles.length > 0 ? person.roles[0] : '직책 없음'}
                        </span>
                        <span className={styles.person_department}>
                          {person.department || '부서 없음'}
                        </span>
                        {person.phone && (
                          <span className={styles.person_phone}>{person.phone}</span>
                        )}
                        {person.email && (
                          <span className={styles.person_email}>{person.email}</span>
                        )}
                      </div>
                    </div>
                    {isPersonSelected(person) && (
                      <div className={styles.check_icon}>
                        <HiCheck />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.panel_footer}>
          <button className={styles.cancel_button} onClick={handleClose}>
            취소
          </button>
          <button
            className={styles.confirm_button}
            onClick={handleConfirm}
            disabled={localSelected.length === 0}
          >
            선택 완료 ({localSelected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffSearchModal; 