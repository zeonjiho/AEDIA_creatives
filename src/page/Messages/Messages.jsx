import React, { useState, useEffect } from 'react';
import PCMsg from './components/PCMsg';
import MobileMsg from './components/MobileMsg';
import { FaSearch, FaEllipsisV, FaPaperPlane } from 'react-icons/fa';

const Messages = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState('');
    const [chats, setChats] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 임시 서버 데이터 시뮬레이션
    useEffect(() => {
        // 채팅 목록 데이터
        const chatData = [
            {
                id: 1,
                username: 'John Doe',
                avatar: 'https://i.pravatar.cc/150?img=1',
                unread: 2
            },
            {
                id: 2,
                username: 'Jane Smith',
                avatar: 'https://i.pravatar.cc/150?img=2',
                unread: 0
            },
            {
                id: 3,
                username: 'Mike Johnson',
                avatar: 'https://i.pravatar.cc/150?img=3',
                unread: 1
            },
            {
                id: 4,
                username: 'Sarah Wilson',
                avatar: 'https://i.pravatar.cc/150?img=4',
                unread: 0
            },
            {
                id: 5,
                username: 'David Brown',
                avatar: 'https://i.pravatar.cc/150?img=5',
                unread: 3
            }
        ];

        const messageData = [
            // John Doe의 메시지
            {
                id: 1,
                chatId: 1,
                sender: 'John Doe',
                content: 'Hey, how are you?',
                time: '2:30 PM',
                isMine: false
            },
            {
                id: 2,
                chatId: 1,
                sender: 'You',
                content: "I'm good, thanks! How about you?",
                time: '2:31 PM',
                isMine: true
            },
            {
                id: 3,
                chatId: 1,
                sender: 'John Doe',
                content: 'Pretty good! Working on the new project.',
                time: '2:32 PM',
                isMine: false
            },
            {
                id: 4,
                chatId: 1,
                sender: 'John Doe',
                content: 'Have you seen the latest updates?',
                time: '2:33 PM',
                isMine: false
            },
            {
                id: 5,
                chatId: 1,
                sender: 'You',
                content: 'Yes, I just checked them out. The new features look amazing!',
                time: '2:34 PM',
                isMine: true
            },
            {
                id: 6,
                chatId: 1,
                sender: 'John Doe',
                content: "That's great! Let's discuss more about it tomorrow.",
                time: '2:35 PM',
                isMine: false
            },

            // Jane Smith의 메시지
            // {
            //     id: 7,
            //     chatId: 2,
            //     sender: 'Jane Smith',
            //     content: 'The project looks great!',
            //     time: '1:45 PM',
            //     isMine: false
            // },
            // {
            //     id: 8,
            //     chatId: 2,
            //     sender: 'You',
            //     content: 'Thanks! I worked really hard on it.',
            //     time: '1:46 PM',
            //     isMine: true
            // },
            // {
            //     id: 9,
            //     chatId: 2,
            //     sender: 'Jane Smith',
            //     content: 'The client will love it!',
            //     time: '1:47 PM',
            //     isMine: false
            // },

            // Mike Johnson의 메시지
            {
                id: 10,
                chatId: 3,
                sender: 'Mike Johnson',
                content: 'When is the next meeting?',
                time: '12:15 PM',
                isMine: false
            },
            {
                id: 11,
                chatId: 3,
                sender: 'You',
                content: "It's scheduled for tomorrow at 2 PM",
                time: '12:16 PM',
                isMine: true
            },
            {
                id: 12,
                chatId: 3,
                sender: 'Mike Johnson',
                content: 'Perfect, see you there!',
                time: '12:17 PM',
                isMine: false
            },

            // Sarah Wilson의 메시지
            {
                id: 13,
                chatId: 4,
                sender: 'Sarah Wilson',
                content: 'Did you see the presentation?',
                time: '11:20 AM',
                isMine: false
            },
            {
                id: 14,
                chatId: 4,
                sender: 'You',
                content: 'Yes, it was very informative!',
                time: '11:21 AM',
                isMine: true
            },

            // David Brown의 메시지
            {
                id: 15,
                chatId: 5,
                sender: 'David Brown',
                content: 'Thanks for your help!',
                time: '10:05 AM',
                isMine: false
            },
            {
                id: 16,
                chatId: 5,
                sender: 'You',
                content: 'No problem at all!',
                time: '10:06 AM',
                isMine: true
            },
            {
                id: 17,
                chatId: 5,
                sender: 'David Brown',
                content: 'Could you help me with one more thing?',
                time: '10:07 AM',
                isMine: false
            }
        ];

        // 각 채팅방의 마지막 메시지 찾기
        const chatsWithLastMessage = chatData.map(chat => {
            const chatMessages = messageData.filter(msg => msg.chatId === chat.id);
            const lastMsg = chatMessages[chatMessages.length - 1];
            return {
                ...chat,
                lastMessage: lastMsg ? lastMsg.content : '',
                time: lastMsg ? lastMsg.time : ''
            };
        });

        setChats(chatsWithLastMessage);
    }, []);

    // 선택된 채팅방의 메시지 로드
    useEffect(() => {
        if (selectedChat) {
            const messageData = [
                // John Doe의 메시지
                {
                    id: 1,
                    chatId: 1,
                    sender: 'John Doe',
                    content: 'Hey, how are you?',
                    time: '2:30 PM',
                    isMine: false
                },
                {
                    id: 2,
                    chatId: 1,
                    sender: 'You',
                    content: "I'm good, thanks! How about you?",
                    time: '2:31 PM',
                    isMine: true
                },
                {
                    id: 3,
                    chatId: 1,
                    sender: 'John Doe',
                    content: 'Pretty good! Working on the new project.',
                    time: '2:32 PM',
                    isMine: false
                },
                {
                    id: 4,
                    chatId: 1,
                    sender: 'John Doe',
                    content: 'Have you seen the latest updates?',
                    time: '2:33 PM',
                    isMine: false
                },
                {
                    id: 5,
                    chatId: 1,
                    sender: 'You',
                    content: 'Yes, I just checked them out. The new features look amazing!',
                    time: '2:34 PM',
                    isMine: true
                },
                {
                    id: 6,
                    chatId: 1,
                    sender: 'John Doe',
                    content: "That's great! Let's discuss more about it tomorrow.",
                    time: '2:35 PM',
                    isMine: false
                },

                // Jane Smith의 메시지
                // {
                //     id: 7,
                //     chatId: 2,
                //     sender: 'Jane Smith',
                //     content: 'The project looks great!',
                //     time: '1:45 PM',
                //     isMine: false
                // },
                // {
                //     id: 8,
                //     chatId: 2,
                //     sender: 'You',
                //     content: 'Thanks! I worked really hard on it.',
                //     time: '1:46 PM',
                //     isMine: true
                // },
                // {
                //     id: 9,
                //     chatId: 2,
                //     sender: 'Jane Smith',
                //     content: 'The client will love it!',
                //     time: '1:47 PM',
                //     isMine: false
                // },

                // Mike Johnson의 메시지
                {
                    id: 10,
                    chatId: 3,
                    sender: 'Mike Johnson',
                    content: 'When is the next meeting?',
                    time: '12:15 PM',
                    isMine: false
                },
                {
                    id: 11,
                    chatId: 3,
                    sender: 'You',
                    content: "It's scheduled for tomorrow at 2 PM",
                    time: '12:16 PM',
                    isMine: true
                },
                {
                    id: 12,
                    chatId: 3,
                    sender: 'Mike Johnson',
                    content: 'Perfect, see you there!',
                    time: '12:17 PM',
                    isMine: false
                },

                // Sarah Wilson의 메시지
                {
                    id: 13,
                    chatId: 4,
                    sender: 'Sarah Wilson',
                    content: 'Did you see the presentation?',
                    time: '11:20 AM',
                    isMine: false
                },
                {
                    id: 14,
                    chatId: 4,
                    sender: 'You',
                    content: 'Yes, it was very informative!',
                    time: '11:21 AM',
                    isMine: true
                },

                // David Brown의 메시지
                {
                    id: 15,
                    chatId: 5,
                    sender: 'David Brown',
                    content: 'Thanks for your help!',
                    time: '10:05 AM',
                    isMine: false
                },
                {
                    id: 16,
                    chatId: 5,
                    sender: 'You',
                    content: 'No problem at all!',
                    time: '10:06 AM',
                    isMine: true
                },
                {
                    id: 17,
                    chatId: 5,
                    sender: 'David Brown',
                    content: 'Could you help me with one more thing?',
                    time: '10:07 AM',
                    isMine: false
                }
            ];
            setMessages(messageData.filter(msg => msg.chatId === selectedChat));
        }
    }, [selectedChat]);

    // 채팅방 선택 시 읽지 않은 메시지 초기화
    const handleChatSelect = (chatId) => {
        setSelectedChat(chatId);
        setChats(prevChats => 
            prevChats.map(chat => 
                chat.id === chatId 
                    ? { ...chat, unread: 0 }
                    : chat
            )
        );
    };

    // 새 메시지 전송 시 lastMessage 업데이트
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true 
        });

        const newMessage = {
            id: messages.length + 1,
            chatId: selectedChat,
            sender: 'You',
            content: message,
            time: currentTime,
            isMine: true
        };
        
        setMessages([...messages, newMessage]);
        
        // 채팅 목록의 마지막 메시지 업데이트
        setChats(prevChats =>
            prevChats.map(chat =>
                chat.id === selectedChat
                    ? { ...chat, lastMessage: message, time: currentTime }
                    : chat
            )
        );
        
        setMessage('');
    };

    const commonProps = {
        selectedChat,
        message,
        chats,
        messages,
        handleChatSelect,
        handleSendMessage,
        setMessage
    };

    return isMobile ? (
        <MobileMsg {...commonProps} />
    ) : (
        <PCMsg {...commonProps} />
    );
};

export default Messages; 