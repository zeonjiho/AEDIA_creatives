import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faSearch, faPaperPlane, faPhone, faVideo, faEllipsisVertical, faChevronLeft, faUserPlus, faUsers, faMessage, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import ss from './MessagesModal.module.css';
import GroupModal from './GroupModal';

const MessagesModal = ({ isOpen, onClose }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [allMessages, setAllMessages] = useState({});
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const messageListRef = useRef(null);
    const [currentView, setCurrentView] = useState('chats');
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [contactSearchQuery, setContactSearchQuery] = useState('');
    const [filteredChats, setFilteredChats] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 임시 데이터 로드
    useEffect(() => {
        const chatData = [
            {
                id: 1,
                username: '김철수',
                avatar: 'https://i.pravatar.cc/150?img=1',
                lastMessage: '안녕하세요!',
                time: new Date().toISOString(),
                unread: 2
            },
            {
                id: 2,
                username: '이영희',
                avatar: 'https://i.pravatar.cc/150?img=2',
                lastMessage: '프로젝트 진행상황 어떠신가요?',
                time: new Date().toISOString(),
                unread: 0
            },
            {
                id: 3,
                username: '박지민',
                avatar: 'https://i.pravatar.cc/150?img=3',
                lastMessage: '회의 시간 조율해주세요.',
                time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                unread: 1
            }
        ];

        const messageData = {
            1: [
                {
                    id: 1,
                    sender: '김철수',
                    content: '안녕하세요!',
                    time: new Date().toISOString(),
                    avatar: 'https://i.pravatar.cc/150?img=1',
                    isMine: false
                },
                {
                    id: 2,
                    sender: '나',
                    content: '네, 안녕하세요!',
                    time: new Date().toISOString(),
                    isMine: true
                },
                {
                    id: 3,
                    sender: '김철수',
                    content: '오늘 회의 준비는 잘 되어가나요?',
                    time: new Date().toISOString(),
                    avatar: 'https://i.pravatar.cc/150?img=1',
                    isMine: false
                }
            ]
        };

        const contactsData = [
            {
                id: 101,
                name: '홍길동',
                avatar: 'https://i.pravatar.cc/150?img=4',
                status: '온라인'
            },
            {
                id: 102,
                name: '김영희',
                avatar: 'https://i.pravatar.cc/150?img=5',
                status: '오프라인'
            },
            // ... 더 많은 연락처 추가
        ];
        setChats(chatData);
        setAllMessages(messageData);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
            setSelectedChat(null);
            setShowChat(false);
        }, 300);
    };

    const handleChatSelect = (chatId) => {
        setSelectedChat(chatId);
        setShowChat(true);
        setMessages(allMessages[chatId] || []);
        setTimeout(scrollToBottom, 100);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        const newMessage = {
            id: Date.now(),
            sender: '나',
            content: message.trim(),
            time: new Date().toISOString(),
            isMine: true
        };

        // 메시지 목록 업데이트
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        
        // 전체 메시지 상태 업데이트
        setAllMessages(prev => ({
            ...prev,
            [selectedChat]: updatedMessages
        }));

        // 채팅 목록 업데이트
        setChats(prev => prev.map(chat => {
            if (chat.id === selectedChat) {
                return {
                    ...chat,
                    lastMessage: message.trim(),
                    time: new Date().toISOString(),
                    unread: 0
                };
            }
            return chat;
        }));

        setMessage('');
    };

    const handleBackToList = () => {
        setShowChat(false);
        setSelectedChat(null);
    };

    const handleMoreOptions = (e) => {
        e.stopPropagation();
        setShowMoreOptions(!showMoreOptions);
    };

    const handleOptionSelect = (action) => {
        setShowMoreOptions(false);
        // 각 액션에 대한 처리 로직 구현
        switch(action) {
            case 'mute':
                // 알림 음소거 처리
                break;
            case 'block':
                // 차단 처리
                break;
            case 'delete':
                // 대화 삭제 처리
                break;
            default:
                break;
        }
    };

    // 시간 포맷팅 함수 추가
    const formatMessageTime = (timeString) => {
        try {
            const now = new Date();
            const messageDate = new Date(timeString);
            
            if (isNaN(messageDate.getTime())) {
                return timeString; // 유효하지 않은 날짜인 경우 원본 문자열 반환
            }

            // 오늘 날짜인 경우
            if (now.toDateString() === messageDate.toDateString()) {
                return messageDate.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                });
            }
            
            // 어제인 경우
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (yesterday.toDateString() === messageDate.toDateString()) {
                return '어제';
            }
            
            // 일주일 이내인 경우
            const oneWeekAgo = new Date(now);
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            if (messageDate > oneWeekAgo) {
                return messageDate.toLocaleDateString('ko-KR', { weekday: 'long' });
            }
            
            // 그 외의 경우
            return messageDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return timeString; // 에러 발생 시 원본 문자열 반환
        }
    };

    // 추가: 스크롤을 맨 아래로 이동시키는 함수
    const scrollToBottom = () => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    };

    // 메시지 목록이 업데이트될 때마다 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 검색 핸들러 분리
    const handleChatSearch = (e) => {
        const query = e.target.value;
        setChatSearchQuery(query);
        const filtered = chats.filter(chat => 
            chat.username.toLowerCase().includes(query.toLowerCase()) ||
            chat.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredChats(filtered);
    };

    const handleContactSearch = (e) => {
        const query = e.target.value;
        setContactSearchQuery(query);
        // 연락처 검색 로직 구현 시 추가
    };

    // 메시지 입력 핸들러 분리
    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    // 그룹 이름 입력 핸들러는 그대로 유지
    const handleGroupNameChange = (e) => {
        setGroupName(e.target.value);
    };

    // 뒤로가기 핸들러 추가
    const handleBackToChats = () => {
        setCurrentView('chats');
        setChatSearchQuery('');
        setContactSearchQuery('');
        setSelectedContacts([]);
        setGroupName('');
    };

    // 연락처 기능
    const handleContactsClick = () => {
        setCurrentView('contacts');
        setContactSearchQuery('');
    };

    // 그룹 채팅 기능
    const handleGroupClick = () => {
        setShowGroupModal(true);
    };

    // 새 채팅 기능
    const handleNewChatClick = () => {
        setCurrentView('contacts');
        setContactSearchQuery('');
    };

    // 그룹 생성
    const handleCreateGroup = ({ name, members }) => {
        const newGroup = {
            id: Date.now(),
            username: name,
            avatar: 'https://via.placeholder.com/150',
            lastMessage: 'Group created',
            time: new Date().toISOString(),
            unread: 0,
            isGroup: true,
            members
        };

        setChats(prev => [newGroup, ...prev]);
        setSelectedChat(newGroup.id);
        setShowChat(true);
    };

    // 새 채팅 시작
    const handleStartChat = (contact) => {
        const existingChat = chats.find(chat => 
            chat.username === contact.name
        );

        if (existingChat) {
            setSelectedChat(existingChat.id);
        } else {
            const newChat = {
                id: Date.now(),
                username: contact.name,
                avatar: contact.avatar,
                lastMessage: '',
                time: new Date().toISOString(),
                unread: 0
            };
            setChats(prev => [newChat, ...prev]);
            setSelectedChat(newChat.id);
        }

        setCurrentView('chats');
        setShowChat(true);
    };

    // 연락처 선택 처리
    const handleContactSelect = (contactId) => {
        setSelectedContacts(prev => {
            if (prev.includes(contactId)) {
                return prev.filter(id => id !== contactId);
            } else {
                return [...prev, contactId];
            }
        });
    };

    // 사이드바 컨텐츠 컴포넌트들
    const ChatList = () => (
        <>
            <div className={ss.searchBar}>
                <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Search messages" 
                    className={ss.searchInput}
                    value={chatSearchQuery}
                    onChange={handleChatSearch}
                />
            </div>
            <div className={ss.chatList}>
                {(chatSearchQuery ? filteredChats : chats).map(chat => (
                    <div 
                        key={chat.id}
                        className={`${ss.chatItem} ${selectedChat === chat.id ? ss.active : ''}`}
                        onClick={() => handleChatSelect(chat.id)}
                    >
                        <img src={chat.avatar} alt="" className={ss.avatar} />
                        <div className={ss.chatInfo}>
                            <div className={ss.chatHeader}>
                                <span className={ss.username}>{chat.username}</span>
                            </div>
                            <div className={ss.lastMessage}>
                                <p>{chat.lastMessage}</p>
                                <span className={ss.time}>{formatMessageTime(chat.time)}</span>
                                {chat.unread > 0 && (
                                    <span className={ss.unreadBadge}>{chat.unread}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    const ContactsList = () => (
        <>
            <div className={ss.sidebarHeader}>
                <button className={ss.backButton} onClick={handleBackToChats}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <h2>Contacts</h2>
            </div>
            <div className={ss.searchBar}>
                <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Search contacts" 
                    className={ss.searchInput}
                    value={contactSearchQuery}
                    onChange={handleContactSearch}
                />
            </div>
            <div className={ss.chatList}>
                {contacts.map(contact => (
                    <div key={contact.id} className={ss.chatItem}>
                        <img src={contact.avatar} alt="" className={ss.avatar} />
                        <div className={ss.chatInfo}>
                            <div className={ss.chatHeader}>
                                <span className={ss.username}>{contact.name}</span>
                            </div>
                            <div className={ss.lastMessage}>
                                <p>{contact.status}</p>
                            </div>
                        </div>
                        <button 
                            className={ss.startChatButton}
                            onClick={() => handleStartChat(contact)}
                        >
                            Message
                        </button>
                    </div>
                ))}
            </div>
        </>
    );

    const NewGroupView = () => (
        <>
            <div className={ss.sidebarHeader}>
                <button className={ss.backButton} onClick={handleBackToChats}>
                    <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <h2>Create New Group</h2>
            </div>
            <div className={ss.groupNameContainer}>
                <input
                    type="text"
                    placeholder="Group name"
                    value={groupName}
                    onChange={handleGroupNameChange}
                    className={ss.groupNameInput}
                />
            </div>
            <div className={ss.searchBar}>
                <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Search contacts" 
                    className={ss.searchInput}
                    value={contactSearchQuery}
                    onChange={handleContactSearch}
                />
            </div>
            <div className={ss.chatList}>
                {contacts.map(contact => (
                    <div 
                        key={contact.id} 
                        className={`${ss.chatItem} ${
                            selectedContacts.includes(contact.id) ? ss.selected : ''
                        }`}
                        onClick={() => handleContactSelect(contact.id)}
                    >
                        <img src={contact.avatar} alt="" className={ss.avatar} />
                        <div className={ss.chatInfo}>
                            <div className={ss.chatHeader}>
                                <span className={ss.username}>{contact.name}</span>
                            </div>
                            <div className={ss.lastMessage}>
                                <p>{contact.status}</p>
                            </div>
                        </div>
                        <div className={ss.checkbox}>
                            {selectedContacts.includes(contact.id) && (
                                <FontAwesomeIcon icon={faCheck} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {selectedContacts.length > 0 && (
                <button 
                    className={ss.createGroupButton}
                    onClick={() => handleCreateGroup({ name: groupName, members: selectedContacts })}
                    disabled={!groupName}
                >
                    Create Group ({selectedContacts.length} selected)
                </button>
            )}
        </>
    );

    if (!isOpen) return null;

    return (
        <div className={`${ss.overlay} ${isClosing ? ss.closing : ''}`}>
            <div className={ss.modal}>
                <div className={ss.modalHeader}>
                    <h2 className={ss.modalTitle}>
                        <span className={ss.brandName}>HYPER</span>™ <span className={ss.brandName}>DM</span>
                    </h2>
                    <button className={ss.closeButton} onClick={handleClose}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
                
                <div className={`${ss.container} ${showChat ? ss.showChat : ''}`}>
                    <div className={ss.sidebar}>
                        <div className={ss.actionButtons}>
                            <button className={ss.actionButton} onClick={handleContactsClick}>
                                <FontAwesomeIcon icon={faUserPlus} className={ss.icon} />
                                <span>Contacts</span>
                            </button>
                            <button className={ss.actionButton} onClick={handleGroupClick}>
                                <FontAwesomeIcon icon={faUsers} className={ss.icon} />
                                <span>Group</span>
                            </button>
                            <button 
                                className={`${ss.actionButton} ${ss.newChatButton}`}
                                onClick={handleContactsClick}
                            >
                                <FontAwesomeIcon icon={faMessage} className={ss.icon} />
                                <span>New Chat</span>
                            </button>
                        </div>
                        {currentView === 'chats' && <ChatList />}
                        {currentView === 'contacts' && <ContactsList />}
                        {currentView === 'newGroup' && <NewGroupView />}
                    </div>

                    <div className={ss.chatArea}>
                        {selectedChat ? (
                            <>
                                <div className={ss.conversationHeader}>
                                    {isMobile && (
                                        <button 
                                            className={ss.backButton}
                                            onClick={handleBackToList}
                                        >
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                    )}
                                    <div className={ss.conversationUser}>
                                        <img 
                                            src={chats.find(c => c.id === selectedChat)?.avatar} 
                                            alt="" 
                                            className={ss.avatar}
                                        />
                                        <div className={ss.conversationUserInfo}>
                                            <span className={ss.conversationUsername}>
                                                {chats.find(c => c.id === selectedChat)?.username}
                                            </span>
                                            <span className={ss.conversationStatus}>
                                                <span className={ss.conversationStatusDot}></span>
                                                Online
                                            </span>
                                        </div>
                                    </div>
                                    <div className={ss.conversationActions}>
                                        <button className={ss.conversationActionButton}>
                                            <FontAwesomeIcon icon={faPhone} />
                                        </button>
                                        <button className={ss.conversationActionButton}>
                                            <FontAwesomeIcon icon={faVideo} />
                                        </button>
                                        <div className={ss.moreOptionsContainer}>
                                            <button 
                                                className={ss.conversationActionButton}
                                                onClick={handleMoreOptions}
                                            >
                                                <FontAwesomeIcon icon={faEllipsisVertical} />
                                            </button>
                                            {showMoreOptions && (
                                                <div className={ss.moreOptionsMenu}>
                                                    <button onClick={() => handleOptionSelect('mute')}>
                                                        Mute Notifications
                                                    </button>
                                                    <button onClick={() => handleOptionSelect('search')}>
                                                        Search in Chat
                                                    </button>
                                                    <button onClick={() => handleOptionSelect('media')}>
                                                        View Media
                                                    </button>
                                                    <button onClick={() => handleOptionSelect('block')}>
                                                        Block User
                                                    </button>
                                                    <button className={ss.deleteOption} onClick={() => handleOptionSelect('delete')}>
                                                        Delete Chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={ss.messageList} ref={messageListRef}>
                                    {messages.map(msg => (
                                        <div 
                                            key={msg.id} 
                                            className={`${ss.message} ${msg.isMine ? ss.mine : ''}`}
                                        >
                                            {!msg.isMine && (
                                                <img src={msg.avatar} alt="" className={ss.messageAvatar} />
                                            )}
                                            <div className={ss.messageContent}>
                                                <div className={ss.messageHeader}>
                                                    <span className={ss.messageSender}>{msg.sender}</span>
                                                    <span className={ss.messageTime}>
                                                        {formatMessageTime(msg.time)}
                                                    </span>
                                                </div>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form className={ss.messageInput} onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={message}
                                        onChange={handleMessageChange}
                                    />
                                    <button type="submit">
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className={ss.noChat}>
                                <div className={ss.noChatContent}>
                                    <h2>Select a conversation</h2>
                                    <p>Choose from your existing conversations or start a new one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <GroupModal 
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                contacts={contacts}
                onCreateGroup={handleCreateGroup}
            />
        </div>
    );
};

export default MessagesModal; 