import React from 'react';
import { FaSearch, FaEllipsisV, FaPaperPlane } from 'react-icons/fa';
import ss from './PCMsg.module.css';

const PC = ({ 
    selectedChat, 
    message, 
    chats, 
    messages, 
    handleChatSelect, 
    handleSendMessage, 
    setMessage 
}) => {
    return (
        <div className={ss.container}>
            <div className={ss.sidebar}>
                <div className={ss.searchBar}>
                    <FaSearch className={ss.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Search messages" 
                        className={ss.searchInput}
                    />
                </div>
                <div className={ss.chatList}>
                    {chats.map(chat => (
                        <div 
                            key={chat.id}
                            className={`${ss.chatItem} ${selectedChat === chat.id ? ss.active : ''}`}
                            onClick={() => handleChatSelect(chat.id)}
                        >
                            <img src={chat.avatar} alt={chat.username} className={ss.avatar} />
                            <div className={ss.chatInfo}>
                                <div className={ss.chatHeader}>
                                    <span className={ss.username}>{chat.username}</span>
                                    <span className={ss.time}>{chat.time}</span>
                                </div>
                                <div className={ss.lastMessage}>
                                    <p>{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span className={ss.unreadBadge} />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className={ss.chatArea}>
                {selectedChat ? (
                    <>
                        <div className={ss.chatHeader}>
                            <div className={ss.chatUser}>
                                <img 
                                    src={chats.find(c => c.id === selectedChat)?.avatar} 
                                    alt="User" 
                                    className={ss.avatar} 
                                />
                                <span className={ss.username}>
                                    {chats.find(c => c.id === selectedChat)?.username}
                                </span>
                            </div>
                            <button className={ss.moreBtn}>
                                <FaEllipsisV />
                            </button>
                        </div>
                        
                        <div className={ss.messageList}>
                            {messages.length > 0 ? (
                                messages.map(msg => (
                                    <div 
                                        key={msg.id} 
                                        className={`${ss.message} ${msg.isMine ? ss.mine : ''}`}
                                    >
                                        <div className={ss.messageContent}>
                                            <p>{msg.content}</p>
                                            <span className={ss.messageTime}>{msg.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={ss.noMessages}>
                                    <div className={ss.noMessagesContent}>
                                        <h3>No messages yet</h3>
                                        <p>Send your first message!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <form onSubmit={handleSendMessage} className={ss.messageInput}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <button type="submit">
                                <FaPaperPlane />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className={ss.noChat}>
                        <div className={ss.noChatContent}>
                            <h2>Start a new conversation</h2>
                            <p>Select someone from the left to start chatting or begin a new conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PC; 