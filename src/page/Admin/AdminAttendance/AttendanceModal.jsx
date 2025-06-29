import React, { useState, useEffect } from 'react';
import ss from '../CSS/AdminChart.module.css';
import api from '../../../utils/api';

const AttendanceModal = ({ isOpen, onClose, attendance, userList, onUpdate }) => {
  const [editData, setEditData] = useState({
    status: '',
    checkInTime: '',
    checkOutTime: '',
    note: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (attendance) {
      setEditData({
        status: attendance.status || '',
        checkInTime: formatTimeForInput(attendance.checkInTime),
        checkOutTime: formatTimeForInput(attendance.checkOutTime),
        note: attendance.note || ''
      });
    }
  }, [attendance]);

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    
    // HH:MM 형식의 시간을 파싱
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes; // 분 단위로 변환
    };
    
    const startMinutes = parseTime(checkIn);
    const endMinutes = parseTime(checkOut);
    
    if (startMinutes === null || endMinutes === null) return null;
    
    let diffMinutes = endMinutes - startMinutes;
    
    // 다음날로 넘어간 경우 처리
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // 24시간을 분으로 변환
    }
    
    // 시간 단위로 변환
    const diffHours = Math.max(0, diffMinutes / 60);
    
    return diffHours;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const workHours = calculateWorkHours(editData.checkInTime, editData.checkOutTime);
      
      // 변경사항 감지
      const changes = [];
      if (editData.status !== attendance.status) {
        changes.push(`상태: ${attendance.status || '없음'} → ${editData.status}`);
      }
      if (editData.checkInTime !== attendance.checkInTime) {
        changes.push(`출근시간: ${formatTimeOnly(attendance.checkInTime)} → ${formatTimeOnly(editData.checkInTime)}`);
      }
      if (editData.checkOutTime !== attendance.checkOutTime) {
        changes.push(`퇴근시간: ${formatTimeOnly(attendance.checkOutTime)} → ${formatTimeOnly(editData.checkOutTime)}`);
      }
      if (editData.note !== attendance.note) {
        changes.push(`비고: ${attendance.note || '없음'} → ${editData.note || '없음'}`);
      }

      // 변경사항이 있을 때만 수정 이력 생성
      let updatedAttendance = {
        ...attendance,
        ...editData,
        workHours
      };

      if (changes.length > 0) {
        const modificationEntry = {
          timestamp: new Date().toISOString(),
          modifiedBy: '관리자', // 실제로는 현재 로그인한 사용자 정보
          changes: changes.join(', '),
          previousValues: {
            status: attendance.status,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            note: attendance.note
          }
        };
        
        updatedAttendance = {
          ...updatedAttendance,
          isModified: true,
          modificationHistory: [...(attendance.modificationHistory || []), modificationEntry]
        };
      }

      // 실제 API 호출
      try {
        const response = await api.patch(`/admin/attendance/${attendance._id}`, {
          status: editData.status,
          checkInTime: editData.checkInTime,
          checkOutTime: editData.checkOutTime,
          note: editData.note
        });
        
        if (response.status === 200) {
          alert(changes.length > 0 ? '출석 정보가 수정되었습니다.' : '출석 정보가 저장되었습니다.');
          onUpdate(updatedAttendance);
          onClose();
        }
      } catch (apiError) {
        console.error('API 호출 실패:', apiError);
        if (apiError.response?.status === 404) {
          alert('출석 기록을 찾을 수 없습니다.');
        } else {
          alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
        }
        return;
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 출석 기록을 삭제하시겠습니까?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.delete(`/admin/attendance/${attendance._id}`);
      if (response.status === 200) {
        alert('출석 기록이 삭제되었습니다.');
        onUpdate({ ...attendance, deleted: true });
        onClose();
      }
    } catch (apiError) {
      console.error('삭제 API 호출 실패:', apiError);
      if (apiError.response?.status === 404) {
        alert('삭제할 출석 기록을 찾을 수 없습니다.');
      } else {
        alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeText = (userType) => {
    return userType === 'internal' ? '직원' : '외부 스태프';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'long'
    });
  };

  const formatWorkHours = (hours) => {
    if (!hours && hours !== 0) return '-';
    return `${hours.toFixed(1)}시간`;
  };

  const formatTimeOnly = (timeString) => {
    if (!timeString) return '없음';
    return timeString;
  };

  if (!isOpen || !attendance) return null;

  const currentWorkHours = calculateWorkHours(editData.checkInTime, editData.checkOutTime);

  return (
    <div className={ss.modal_overlay} onClick={onClose}>
      <div className={ss.modal_container} onClick={e => e.stopPropagation()}>
        <div className={ss.modal_header}>
          <h2 className={ss.modal_title}>출석 정보 수정</h2>
          <button className={ss.modal_close} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 기본 정보 */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>기본 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>직원명</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }}>
                  {attendance.userName}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>구분</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }}>
                  {getUserTypeText(attendance.userType)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>날짜</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }}>
                  {formatDate(attendance.date)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>수정 상태</label>
                <div style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '14px' }}>
                  {((attendance.isModified === true) || (attendance.modificationHistory && attendance.modificationHistory.length > 0)) ? (
                    <span style={{
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      수정됨 ({attendance.modificationHistory ? attendance.modificationHistory.length : 0}회)
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: '#51cf66',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      원본
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 체크인/체크아웃 로그 */}
          {attendance.records && attendance.records.length > 0 && (
            <div style={{ 
              marginBottom: '24px', 
              padding: '20px', 
              backgroundColor: 'var(--bg-primary)', 
              borderRadius: '12px', 
              border: '2px solid var(--border-color)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                margin: '0 0 20px 0', 
                fontSize: '18px', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📋 출석 로그 <span style={{ 
                  backgroundColor: 'var(--accent-color)', 
                  color: 'white', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '14px' 
                }}>
                  {attendance.records.length}건
                </span>
              </h3>
              
              {/* 로그 헤더 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 80px 80px 60px 120px 60px 120px',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                marginBottom: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <span>구분</span>
                <span>시간</span>
                <span>원본시간</span>
                <span>상태</span>
                <span>위치</span>
                <span>방법</span>
                <span>수정사유</span>
              </div>

              {/* 로그 내용 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {attendance.records.sort((a, b) => new Date(a.time) - new Date(b.time)).map((record, index) => {
                  const isModified = record.method === 'manual_edit' || record.isModified;
                  const timeStr = new Date(record.time).toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                  });
                  const originalTimeStr = record.originalTime ? 
                    new Date(record.originalTime).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false
                    }) : '';
                  
                  return (
                    <div key={index} style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 80px 80px 60px 120px 60px 120px',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: isModified ? '#fff3cd' : 'white',
                      borderLeft: isModified ? '4px solid #ffc107' : '4px solid #28a745',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                      border: '1px solid var(--border-color)',
                      alignItems: 'center'
                    }}>
                      {/* TYPE */}
                      <span style={{ 
                        backgroundColor: record.type === 'checkIn' ? '#28a745' : '#17a2b8',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textAlign: 'center'
                      }}>
                        {record.type === 'checkIn' ? '출근' : '퇴근'}
                      </span>
                      
                      {/* TIME */}
                      <span style={{ 
                        color: isModified ? '#dc3545' : 'var(--text-primary)',
                        fontWeight: '700'
                      }}>
                        {timeStr}
                      </span>
                      
                      {/* ORIGINAL */}
                      <span style={{ 
                        color: isModified ? '#fd7e14' : '#6c757d',
                        fontSize: '12px',
                        fontStyle: isModified ? 'normal' : 'italic'
                      }}>
                        {isModified && originalTimeStr ? originalTimeStr : '---'}
                      </span>
                      
                      {/* STATUS */}
                      <span style={{
                        backgroundColor: isModified ? '#ffc107' : '#28a745',
                        color: isModified ? '#000' : 'white',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '700',
                        textAlign: 'center'
                      }}>
                        {isModified ? '수정' : '원본'}
                      </span>
                      
                      {/* LOCATION */}
                      <span style={{ 
                        color: '#6c757d',
                        fontSize: '10px'
                      }}>
                        {record.location ? 
                          `${record.location.latitude?.toFixed(3)}, ${record.location.longitude?.toFixed(3)}` : 
                          '위치정보 없음'
                        }
                      </span>
                      
                      {/* METHOD */}
                      <span style={{ 
                        color: record.method === 'manual_edit' ? '#dc3545' : '#17a2b8',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {record.method === 'manual_edit' ? '관리자' : '자동'}
                      </span>
                      
                      {/* REASON */}
                      <span 
                        style={{ 
                          color: '#6c757d',
                          fontSize: '11px',
                          cursor: isModified && record.modificationHistory?.length > 0 ? 'pointer' : 'default',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={isModified && record.modificationHistory?.length > 0 ? 
                          record.modificationHistory[record.modificationHistory.length - 1]?.reason || '사유 없음' : 
                          '수정되지 않음'
                        }
                      >
                        {isModified && record.modificationHistory?.length > 0 ? 
                          (record.modificationHistory[record.modificationHistory.length - 1]?.reason || '사유 없음') : 
                          '---'
                        }
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 로그 통계 */}
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    📊 전체: <span style={{ color: 'var(--accent-color)' }}>{attendance.records.length}</span>
                  </span>
                  <span style={{ color: '#28a745', fontWeight: '600' }}>
                    ✅ 원본: {attendance.records.filter(r => r.method !== 'manual_edit' && !r.isModified).length}
                  </span>
                  <span style={{ color: '#ffc107', fontWeight: '600' }}>
                    ✏️ 수정: {attendance.records.filter(r => r.method === 'manual_edit' || r.isModified).length}
                  </span>
                </div>
                <span style={{ 
                  color: '#6c757d',
                  fontSize: '12px'
                }}>
                  업데이트: {new Date().toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          )}

          {/* 수정 이력 */}
          {attendance.modificationHistory && attendance.modificationHistory.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#856404' }}>수정 이력</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attendance.modificationHistory.map((mod, index) => (
                  <div key={index} style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid #e7e3c3',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#856404' }}>
                        {new Date(mod.timestamp).toLocaleString('ko-KR')}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6c6c6c' }}>
                        {mod.modifiedBy || '관리자'}
                      </span>
                    </div>
                    <div style={{ color: '#5d5d5d' }}>
                      <div style={{ marginBottom: '4px' }}>
                        {mod.changes || mod.note || '출석 정보가 수정되었습니다.'}
                      </div>
                      {mod.reason && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#856404', 
                          fontStyle: 'italic',
                          backgroundColor: 'rgba(255, 193, 7, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          marginTop: '4px'
                        }}>
                          🔹 사유: {mod.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 출석 정보 수정 */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>출석 정보</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  상태 *
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                  required
                >
                  <option value="">상태 선택</option>
                  <option value="퇴근">퇴근</option>
                  <option value="출근">출근</option>
                  <option value="미출근">미출근</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  출근 시간
                </label>
                <input
                  type="time"
                  value={editData.checkInTime}
                  onChange={(e) => handleInputChange('checkInTime', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  퇴근 시간
                </label>
                <input
                  type="time"
                  value={editData.checkOutTime}
                  onChange={(e) => handleInputChange('checkOutTime', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  근무 시간
                </label>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--primary-color)'
                }}>
                  {formatWorkHours(currentWorkHours)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                비고
              </label>
              <textarea
                value={editData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                placeholder="특이사항이나 메모를 입력하세요"
                rows="3"
              />
            </div>
          </div>

          {/* 근무시간 안내 */}
          {(editData.checkInTime && editData.checkOutTime) && (
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '24px',
              border: '1px solid #c3e6cb'
            }}>
              <strong style={{ color: '#155724' }}>근무시간 계산:</strong>{' '}
              <span style={{ color: '#155724' }}>
                {editData.checkInTime} ~ {editData.checkOutTime} = {formatWorkHours(currentWorkHours)}
              </span>
            </div>
          )}
        </div>

        <div className={ss.modal_footer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button
              className={ss.button_danger}
              onClick={handleDelete}
              disabled={isLoading}
              style={{ marginRight: 'auto' }}
            >
              삭제
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={ss.button_secondary}
                onClick={onClose}
                disabled={isLoading}
              >
                취소
              </button>
              <button
                className={ss.button_primary}
                onClick={handleSave}
                disabled={isLoading || !editData.status}
              >
                {isLoading ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal; 