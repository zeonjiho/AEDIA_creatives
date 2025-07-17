import React, { useEffect, useState } from 'react'
import ss from './AdminDepartment.module.css'
import api from '../../../utils/api'

const AdminDepartment = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // 폼 데이터
  const [newDeptName, setNewDeptName] = useState('');
  const [editDeptName, setEditDeptName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 부서 목록만 가져오기 (사용자 연동은 나중에)
      const deptResponse = await api.get('/departments');
      setDepartments(deptResponse.data || []);
    } catch (error) {
      console.error('부서 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 부서 추가
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      const response = await api.post('/departments', { name: newDeptName.trim() });
      if (response.status === 201) {
        alert('부서가 추가되었습니다.');
        setNewDeptName('');
        setShowAddDept(false);
        fetchData();
      }
    } catch (error) {
      console.error('부서 추가 실패:', error);
      alert('부서 추가에 실패했습니다.');
    }
  };

  // 부서 수정
  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!editDeptName.trim()) {
      alert('부서명을 입력해주세요.');
      return;
    }

    try {
      const response = await api.put(`/departments/${selectedDept._id}`, { 
        name: editDeptName.trim() 
      });
      if (response.status === 200) {
        alert('부서명이 수정되었습니다.');
        setEditDeptName('');
        setShowEditDept(false);
        setSelectedDept(null);
        fetchData();
      }
    } catch (error) {
      console.error('부서 수정 실패:', error);
      alert('부서 수정에 실패했습니다.');
    }
  };

  // 부서 삭제 (실제 기능은 나중에 구현)
  const handleDeleteDepartment = async (deptId) => {
    const isConfirmed = window.confirm('이 부서를 삭제하시겠습니까?\n소속된 직원들은 부서가 해제됩니다.');
    if (!isConfirmed) return;

    // 실제 삭제 기능은 나중에 구현
    alert('삭제 기능은 준비 중입니다.');
    
    // try {
    //   const response = await api.delete(`/departments/${deptId}`);
    //   if (response.status === 200) {
    //     alert('부서가 삭제되었습니다.');
    //     fetchData();
    //   }
    // } catch (error) {
    //   console.error('부서 삭제 실패:', error);
    //   alert('부서 삭제에 실패했습니다.');
    // }
  };

  // 사용자 부서 할당 (나중에 구현)
  const handleAssignUser = async (userId, deptId) => {
    alert('사용자 부서 할당 기능은 준비 중입니다.');
  };

  // 사용자 부서 해제 (나중에 구현)
  const handleRemoveUserFromDept = async (userId) => {
    alert('사용자 부서 해제 기능은 준비 중입니다.');
  };

  // 부서별 사용자 수 계산 (나중에 구현)
  const getDepartmentUserCount = (deptId) => {
    return 0; // 임시로 0 반환
  };

  // 부서별 사용자 목록 (나중에 구현)
  const getDepartmentUsers = (deptId) => {
    return []; // 임시로 빈 배열 반환
  };

  // 부서가 없는 사용자 목록 (나중에 구현)
  const getUnassignedUsers = () => {
    return []; // 임시로 빈 배열 반환
  };

  if (loading) {
    return (
      <div className={ss.loading}>
        <div className={ss.spinner}></div>
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className={ss.admin_department_container}>
      <div className={ss.header}>
        <h1>부서 관리</h1>
        <div className={ss.header_actions}>
          <button className={ss.add_btn} onClick={() => setShowAddDept(true)}>
            부서 추가
          </button>
          <button className={ss.refresh_btn} onClick={fetchData}>
            새로고침
          </button>
        </div>
      </div>

      {/* 부서 목록 */}
      <div className={ss.section}>
        <h2>부서 목록</h2>
        <div className={ss.department_list}>
          {departments.map((dept) => (
            <div key={dept._id} className={ss.department_card}>
              <div className={ss.dept_header}>
                <div className={ss.dept_info}>
                  <h3 className={ss.dept_name}>{dept.name}</h3>
                  <span className={ss.dept_count}>
                    {getDepartmentUserCount(dept._id)}명
                  </span>
                </div>
                <div className={ss.dept_actions}>
                  <button 
                    className={ss.edit_btn}
                    onClick={() => {
                      setSelectedDept(dept);
                      setEditDeptName(dept.name);
                      setShowEditDept(true);
                    }}
                  >
                    수정
                  </button>
                  <button 
                    className={ss.delete_btn}
                    onClick={() => handleDeleteDepartment(dept._id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              
              {/* 부서별 직원 목록 (나중에 구현) */}
              <div className={ss.dept_users}>
                <div className={ss.no_users}>직원 관리 기능은 준비 중입니다.</div>
              </div>
            </div>
          ))}
          
          {departments.length === 0 && (
            <div className={ss.no_departments}>
              등록된 부서가 없습니다. 부서를 추가해주세요.
            </div>
          )}
        </div>
      </div>

      {/* 부서 미지정 직원 (나중에 구현) */}
      <div className={ss.section}>
        <h2>부서 미지정 직원</h2>
        <div className={ss.unassigned_users}>
          <div className={ss.no_users}>직원 관리 기능은 준비 중입니다.</div>
        </div>
      </div>

      {/* 부서 추가 모달 */}
      {showAddDept && (
        <div className={ss.modal_overlay}>
          <div className={ss.modal}>
            <h3>부서 추가</h3>
            <form onSubmit={handleAddDepartment}>
              <input
                type="text"
                placeholder="부서명을 입력하세요"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className={ss.input}
                autoFocus
              />
              <div className={ss.modal_actions}>
                <button type="submit" className={ss.save_btn}>
                  추가
                </button>
                <button 
                  type="button" 
                  className={ss.cancel_btn}
                  onClick={() => {
                    setShowAddDept(false);
                    setNewDeptName('');
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 부서 수정 모달 */}
      {showEditDept && selectedDept && (
        <div className={ss.modal_overlay}>
          <div className={ss.modal}>
            <h3>부서명 수정</h3>
            <form onSubmit={handleEditDepartment}>
              <input
                type="text"
                placeholder="부서명을 입력하세요"
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                className={ss.input}
                autoFocus
              />
              <div className={ss.modal_actions}>
                <button type="submit" className={ss.save_btn}>
                  수정
                </button>
                <button 
                  type="button" 
                  className={ss.cancel_btn}
                  onClick={() => {
                    setShowEditDept(false);
                    setEditDeptName('');
                    setSelectedDept(null);
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartment; 