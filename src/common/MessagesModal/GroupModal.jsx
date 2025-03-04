import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faXmark, 
    faSearch, 
    faCheck, 
    faCamera, 
    faLock, 
    faBell, 
    faUserPlus,
    faCircleInfo,
    faShieldHalved
} from '@fortawesome/free-solid-svg-icons';
import ss from './GroupModal.module.css';

const GroupModal = ({ isOpen, onClose, contacts, onCreateGroup }) => {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [groupImage, setGroupImage] = useState(null);
    const [groupDescription, setGroupDescription] = useState('');
    const [settings, setSettings] = useState({
        isPrivate: false,
        allowInvites: true,
        muteNotifications: false,
        adminOnly: false,
        autoDeleteMessages: '0' // 0: Never, 24: 24h, 168: 1week, 720: 1month
    });
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleContactSelect = (contactId) => {
        setSelectedContacts(prev => {
            if (prev.includes(contactId)) {
                return prev.filter(id => id !== contactId);
            } else {
                return [...prev, contactId];
            }
        });
    };

    const handleCreateGroup = () => {
        if (groupName && selectedContacts.length >= 2) {
            onCreateGroup({
                name: groupName,
                members: selectedContacts,
                image: groupImage,
                description: groupDescription,
                settings: settings
            });
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedContacts([]);
        setGroupName('');
        setSearchQuery('');
        setGroupImage(null);
        setGroupDescription('');
        setSettings({
            isPrivate: false,
            allowInvites: true,
            muteNotifications: false,
            adminOnly: false,
            autoDeleteMessages: '0'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={ss.modalOverlay} onClick={handleClose}>
            <div className={ss.subModal} onClick={e => e.stopPropagation()}>
                <div className={ss.modalHeader}>
                    <h2 className={ss.modalTitle}>Create New Group</h2>
                    <button className={ss.closeButton} onClick={handleClose}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className={ss.modalContent}>
                    <div className={ss.groupBasicInfo}>
                        <div className={ss.groupImageSection}>
                            <div 
                                className={ss.groupImageUpload}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {groupImage ? (
                                    <img src={groupImage} alt="Group" className={ss.previewImage} />
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCamera} className={ss.cameraIcon} />
                                        <span className={ss.uploadText}>Upload Photo</span>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className={ss.hiddenInput}
                            />
                        </div>

                        <div className={ss.groupInfoSection}>
                            <input
                                type="text"
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className={ss.groupNameInput}
                            />
                            <textarea
                                placeholder="Group description (optional)"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                className={ss.groupDescriptionInput}
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className={ss.settingsSection}>
                        <h3 className={ss.sectionTitle}>
                            <span>Group Settings</span>
                            <div className={ss.divider} />
                        </h3>
                        <div className={ss.settingItem}>
                            <div className={ss.settingInfo}>
                                <FontAwesomeIcon icon={faLock} />
                                <span>Private Group</span>
                            </div>
                            <label className={ss.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.isPrivate}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        isPrivate: e.target.checked
                                    }))}
                                />
                                <span className={ss.slider}></span>
                            </label>
                        </div>

                        <div className={ss.settingItem}>
                            <div className={ss.settingInfo}>
                                <FontAwesomeIcon icon={faUserPlus} />
                                <span>Allow Member Invites</span>
                            </div>
                            <label className={ss.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.allowInvites}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        allowInvites: e.target.checked
                                    }))}
                                />
                                <span className={ss.slider}></span>
                            </label>
                        </div>

                        <div className={ss.settingItem}>
                            <div className={ss.settingInfo}>
                                <FontAwesomeIcon icon={faBell} />
                                <span>Mute Notifications</span>
                            </div>
                            <label className={ss.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.muteNotifications}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        muteNotifications: e.target.checked
                                    }))}
                                />
                                <span className={ss.slider}></span>
                            </label>
                        </div>

                        <div className={ss.settingItem}>
                            <div className={ss.settingInfo}>
                                <FontAwesomeIcon icon={faShieldHalved} />
                                <span>Admin Only Messages</span>
                            </div>
                            <label className={ss.switch}>
                                <input
                                    type="checkbox"
                                    checked={settings.adminOnly}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        adminOnly: e.target.checked
                                    }))}
                                />
                                <span className={ss.slider}></span>
                            </label>
                        </div>

                        <div className={ss.settingItem}>
                            <div className={ss.settingInfo}>
                                <FontAwesomeIcon icon={faCircleInfo} />
                                <span>Auto Delete Messages</span>
                            </div>
                            <select
                                className={ss.select}
                                value={settings.autoDeleteMessages}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    autoDeleteMessages: e.target.value
                                }))}
                            >
                                <option value="0">Never</option>
                                <option value="24">After 24 hours</option>
                                <option value="168">After 1 week</option>
                                <option value="720">After 1 month</option>
                            </select>
                        </div>
                    </div>

                    <div className={ss.membersSection}>
                        <h3 className={ss.sectionTitle}>
                            <span>Add Members</span>
                            <div className={ss.divider} />
                        </h3>
                        <div className={ss.searchBar}>
                            <FontAwesomeIcon icon={faSearch} className={ss.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Search contacts" 
                                className={ss.searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className={ss.contactsList}>
                            {contacts
                                .filter(contact => 
                                    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(contact => (
                                    <div 
                                        key={contact.id} 
                                        className={`${ss.contactItem} ${
                                            selectedContacts.includes(contact.id) ? ss.selected : ''
                                        }`}
                                        onClick={() => handleContactSelect(contact.id)}
                                    >
                                        <img src={contact.avatar} alt="" className={ss.avatar} />
                                        <div className={ss.contactInfo}>
                                            <span className={ss.contactName}>{contact.name}</span>
                                            <span className={ss.contactStatus}>{contact.status}</span>
                                        </div>
                                        <div className={ss.checkbox}>
                                            {selectedContacts.includes(contact.id) && (
                                                <FontAwesomeIcon icon={faCheck} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <button 
                        className={ss.createButton}
                        onClick={handleCreateGroup}
                        disabled={!groupName || selectedContacts.length < 2}
                    >
                        Create Group {selectedContacts.length > 0 && `(${selectedContacts.length} selected)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupModal; 