import React, { useState, useEffect } from 'react';
import styles from './TeamNotifications.module.css';
import { 
    getNotifications, 
    addNotification, 
    markNotificationAsRead, 
    deleteNotification 
} from '../../data/mockDatabase';
import { FaPlus, FaCheck, FaTrash, FaBell, FaFilter, FaSearch } from 'react-icons/fa';

const TeamNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [isAddingNotification, setIsAddingNotification] = useState(false);
    const [newNotification, setNewNotification] = useState({ 
        title: '', 
        message: '', 
        type: '일반', 
        recipients: 'all' 
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterRead, setFilterRead] = useState('all');

    // 알림 타입 옵션
    const notificationTypes = ['일반', '중요', '긴급', '공지사항'];
    
    // 알림 수신자 옵션
    const recipientOptions = [
        { value: 'all', label: '전체 팀원' },
        { value: 'dev', label: '개발팀' },
        { value: 'design', label: '디자인팀' },
        { value: 'marketing', label: '마케팅팀' },
        { value: 'management', label: '경영팀' }
    ];

    useEffect(() => {
        // 알림 데이터 로드
        const loadNotifications = async () => {
            try {
                const notificationsData = await getNotifications();
                setNotifications(notificationsData);
                setFilteredNotifications(notificationsData);
            } catch (error) {
                console.error('알림 로드 실패:', error);
            }
        };
        
        loadNotifications();
    }, []);

    // 필터링 적용
    useEffect(() => {
        let filtered = [...notifications];
        
        // 검색어 필터링
        if (searchTerm) {
            filtered = filtered.filter(notification => 
                notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                notification.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // 타입 필터링
        if (filterType !== 'all') {
            filtered = filtered.filter(notification => notification.type === filterType);
        }
        
        // 읽음 상태 필터링
        if (filterRead !== 'all') {
            const isRead = filterRead === 'read';
            filtered = filtered.filter(notification => notification.read === isRead);
        }
        
        setFilteredNotifications(filtered);
    }, [notifications, searchTerm, filterType, filterRead]);

    // 새 알림 추가 폼 토글
    const toggleAddNotification = () => {
        setIsAddingNotification(!isAddingNotification);
        setNewNotification({ title: '', message: '', type: '일반', recipients: 'all' });
    };

    // 알림 추가 처리
    const handleAddNotification = async () => {
        if (!newNotification.title || !newNotification.message) return;
        
        try {
            const notificationToAdd = {
                ...newNotification,
                createdAt: new Date().toISOString(),
                read: false
            };
            
            const addedNotification = await addNotification(notificationToAdd);
            setNotifications([addedNotification, ...notifications]);
            toggleAddNotification();
        } catch (error) {
            console.error('알림 추가 실패:', error);
        }
    };

    // 알림 읽음 처리
    const handleMarkAsRead = async (id) => {
        try {
            const updatedNotification = await markNotificationAsRead(id);
            setNotifications(notifications.map(n => 
                n.id === id ? updatedNotification : n
            ));
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
        }
    };

    // 알림 삭제
    const handleDeleteNotification = async (id) => {
        if (!window.confirm('정말로 이 알림을 삭제하시겠습니까?')) return;
        
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error('알림 삭제 실패:', error);
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return '방금 전';
        } else if (diffMin < 60) {
            return `${diffMin}분 전`;
        } else if (diffHour < 24) {
            return `${diffHour}시간 전`;
        } else if (diffDay < 7) {
            return `${diffDay}일 전`;
        } else {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    };

    // 알림 타입에 따른 클래스 반환
    const getNotificationTypeClass = (type) => {
        switch (type) {
            case '중요': return styles.important;
            case '긴급': return styles.urgent;
            case '공지사항': return styles.announcement;
            default: return styles.normal;
        }
    };

    // 모든 알림 읽음 처리
    const handleMarkAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            
            if (unreadNotifications.length === 0) return;
            
            const updatedNotifications = [...notifications];
            
            for (const notification of unreadNotifications) {
                const updatedNotification = await markNotificationAsRead(notification.id);
                const index = updatedNotifications.findIndex(n => n.id === notification.id);
                if (index !== -1) {
                    updatedNotifications[index] = updatedNotification;
                }
            }
            
            setNotifications(updatedNotifications);
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
        }
    };

    return (
        <div className={styles.notifications_container}>
            <div className={styles.header}>
                <h1>팀 알림</h1>
                <div className={styles.header_actions}>
                    <button 
                        className={styles.mark_all_button}
                        onClick={handleMarkAllAsRead}
                    >
                        <FaCheck /> 모두 읽음 표시
                    </button>
                    <button 
                        className={styles.add_button}
                        onClick={toggleAddNotification}
                    >
                        <FaPlus /> 새 알림
                    </button>
                </div>
            </div>

            {/* 새 알림 추가 폼 */}
            {isAddingNotification && (
                <div className={styles.add_form}>
                    <h3>새 알림 추가</h3>
                    <div className={styles.form_group}>
                        <label>제목</label>
                        <input 
                            type="text" 
                            value={newNotification.title}
                            onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                            placeholder="알림 제목"
                        />
                    </div>
                    <div className={styles.form_group}>
                        <label>내용</label>
                        <textarea 
                            value={newNotification.message}
                            onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                            placeholder="알림 내용"
                        />
                    </div>
                    <div className={styles.form_row}>
                        <div className={styles.form_group}>
                            <label>알림 타입</label>
                            <select 
                                value={newNotification.type}
                                onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                            >
                                {notificationTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.form_group}>
                            <label>수신자</label>
                            <select 
                                value={newNotification.recipients}
                                onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                            >
                                {recipientOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.form_actions}>
                        <button 
                            className={styles.cancel_button}
                            onClick={toggleAddNotification}
                        >
                            취소
                        </button>
                        <button 
                            className={styles.save_button}
                            onClick={handleAddNotification}
                        >
                            저장
                        </button>
                    </div>
                </div>
            )}

            {/* 필터 및 검색 */}
            <div className={styles.filters}>
                <div className={styles.search_box}>
                    <FaSearch className={styles.search_icon} />
                    <input 
                        type="text" 
                        placeholder="알림 검색..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.filter_group}>
                    <div className={styles.filter}>
                        <label><FaFilter /> 타입:</label>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">모든 타입</option>
                            {notificationTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filter}>
                        <label>상태:</label>
                        <select 
                            value={filterRead}
                            onChange={(e) => setFilterRead(e.target.value)}
                        >
                            <option value="all">모든 상태</option>
                            <option value="unread">읽지 않음</option>
                            <option value="read">읽음</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 알림 목록 */}
            <div className={styles.notifications_list}>
                {filteredNotifications.length === 0 ? (
                    <div className={styles.no_notifications}>
                        <FaBell className={styles.no_notifications_icon} />
                        <p>표시할 알림이 없습니다.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div 
                            key={notification.id} 
                            className={`${styles.notification_card} ${notification.read ? styles.read : styles.unread}`}
                        >
                            <div className={styles.notification_header}>
                                <div className={styles.notification_meta}>
                                    <span className={`${styles.notification_type} ${getNotificationTypeClass(notification.type)}`}>
                                        {notification.type}
                                    </span>
                                    <span className={styles.notification_time}>
                                        {formatDate(notification.createdAt)}
                                    </span>
                                </div>
                                <div className={styles.notification_actions}>
                                    {!notification.read && (
                                        <button 
                                            className={styles.mark_read_button}
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            title="읽음으로 표시"
                                        >
                                            <FaCheck />
                                        </button>
                                    )}
                                    <button 
                                        className={styles.delete_button}
                                        onClick={() => handleDeleteNotification(notification.id)}
                                        title="알림 삭제"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.notification_content}>
                                <h3 className={styles.notification_title}>{notification.title}</h3>
                                <p className={styles.notification_message}>{notification.message}</p>
                            </div>
                            <div className={styles.notification_footer}>
                                <span className={styles.notification_recipients}>
                                    수신자: {recipientOptions.find(option => option.value === notification.recipients)?.label || '전체 팀원'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamNotifications; 