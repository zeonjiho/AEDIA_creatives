import React, { useState } from 'react'
import ss from './Settings.module.css'
import GeneralSettings from './GeneralSettings'
import NotificationSettings from './NotificationSettings'
import SecuritySettings from './SecuritySettings'
import BillingSettings from './BillingSettings'

const Settings = ({ formData, setFormData }) => {
    const [activeSettingTab, setActiveSettingTab] = useState('general')

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'security', label: 'Security' },
        { id: 'billing', label: 'Billing' }
    ]

    return (
        <div className={ss.settings_container}>
            <div className={ss.tabs_outer_container}>
                <div className={ss.tabs_scroll_container}>
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            className={`${ss.tab} ${activeSettingTab === tab.id ? ss.active : ''}`}
                            onClick={() => setActiveSettingTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={ss.settings_content}>
                {activeSettingTab === 'general' && (
                    <GeneralSettings formData={formData} setFormData={setFormData} />
                )}
                {activeSettingTab === 'notifications' && (
                    <NotificationSettings formData={formData} setFormData={setFormData} />
                )}
                {activeSettingTab === 'security' && (
                    <SecuritySettings formData={formData} setFormData={setFormData} />
                )}
                {activeSettingTab === 'billing' && (
                    <BillingSettings formData={formData} setFormData={setFormData} />
                )}
            </div>
        </div>
    )
}

export default Settings 