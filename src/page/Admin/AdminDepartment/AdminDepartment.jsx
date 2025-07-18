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
      
      // 부서 목록과 내부 직원 목록을 동시에 가져오기
      const [deptResponse, userResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/get-user-list?userType=internal')
      ]);
      
      setDepartments(deptResponse.data || []);
      setUsers(userResponse.data || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
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
        fetchData(); // 부서 목록과 사용자 목록 모두 새로고침
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
        fetchData(); // 부서 목록과 사용자 목록 모두 새로고침
      }
    } catch (error) {
      console.error('부서 수정 실패:', error);
      alert('부서 수정에 실패했습니다.');
    }
  };

  // 부서 삭제
  const handleDeleteDepartment = async (deptId) => {
    const isConfirmed = window.confirm('이 부서를 삭제하시겠습니까?\n소속된 직원이 있으면 삭제할 수 없습니다.');
    if (!isConfirmed) return;

    try {
      const response = await api.delete(`/departments/${deptId}`);
      if (response.status === 200) {
        alert('부서가 삭제되었습니다.');
        fetchData(); // 부서 목록과 사용자 목록 모두 새로고침
      }
    } catch (error) {
      console.error('부서 삭제 실패:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('부서 삭제에 실패했습니다.');
      }
    }
  };

  // 사용자 부서 할당
  const handleAssignUser = async (userId, deptName) => {
    try {
      const response = await api.put(`/admin/update-user/${userId}`, {
        department: deptName
      });
      
      if (response.status === 200) {
        // 성공적으로 업데이트되면 사용자 목록 새로고침
        const userResponse = await api.get('/get-user-list?userType=internal');
        setUsers(userResponse.data || []);
      }
    } catch (error) {
      console.error('부서 할당 실패:', error);
      alert('부서 할당에 실패했습니다.');
    }
  };

  // 사용자 부서 해제
  const handleRemoveUserFromDept = async (userId) => {
    try {
      const response = await api.put(`/admin/update-user/${userId}`, {
        department: ''
      });
      
      if (response.status === 200) {
        // 성공적으로 업데이트되면 사용자 목록 새로고침
        const userResponse = await api.get('/get-user-list?userType=internal');
        setUsers(userResponse.data || []);
      }
    } catch (error) {
      console.error('부서 해제 실패:', error);
      alert('부서 해제에 실패했습니다.');
    }
  };

  // 부서별 사용자 수 계산
  const getDepartmentUserCount = (deptName) => {
    return users.filter(user => user.department?.name === deptName || user.department === deptName).length;
  };

  // 부서별 사용자 목록
  const getDepartmentUsers = (deptName) => {
    return users.filter(user => user.department?.name === deptName || user.department === deptName);
  };

  // 부서 미지정 사용자 목록 (부서가 없거나 등록된 부서에 속하지 않는 사용자)
  const getUnassignedUsers = () => {
    const validDepartmentNames = departments.map(dept => dept.name);
    return users.filter(user => {
      const userDept = user.department?.name || user.department;
      return !userDept || !validDepartmentNames.includes(userDept);
    });
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
                    {getDepartmentUserCount(dept.name)}명
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
              
              {/* 부서별 직원 목록 */}
              <div className={ss.dept_users}>
                {getDepartmentUsers(dept.name).length > 0 ? (
                  getDepartmentUsers(dept.name).map((user) => (
                    <div key={user._id} className={ss.user_item}>
                      <div className={ss.user_info}>
                        <div className={ss.user_name}>{user.name}</div>
                        <div className={ss.user_email}>{user.email}</div>
                      </div>
                      <button
                        className={ss.remove_user_btn}
                        onClick={() => handleRemoveUserFromDept(user._id)}
                        title="부서 지정 해제"
                      >
                        지정 해제
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={ss.no_users}>소속된 직원이 없습니다.</div>
                )}
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

      {/* 부서 미지정 직원 */}
      <div className={ss.section}>
        <h2>부서 미지정 직원 ({getUnassignedUsers().length}명)</h2>
        <div className={ss.unassigned_users}>
          {getUnassignedUsers().length > 0 ? (
            getUnassignedUsers().map((user) => (
              <div key={user._id} className={ss.user_item}>
                <div className={ss.user_info}>
                  <div className={ss.user_name}>{user.name}</div>
                  <div className={ss.user_email}>{user.email}</div>
                  {user.department && (
                    <div className={ss.user_department} style={{fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>
                      현재 부서: {user.department?.name || user.department}
                    </div>
                  )}
                </div>
                <div className={ss.assign_actions}>
                  <select
                    className={ss.dept_select}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignUser(user._id, e.target.value);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">부서 선택</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className={ss.no_users}>부서 미지정 직원이 없습니다.</div>
          )}
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