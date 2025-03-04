import React, { useState } from 'react'
import ss from './Settings.module.css'

const SecuritySettings = ({ formData, setFormData }) => {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    return (
        <div className={ss.form_section}>
            {/* Account Privacy Section */}
            <div className={ss.section}>
                <h3>Account Privacy</h3>
                <div className={ss.checkbox_group}>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.security?.isPrivate}
                            onChange={(e) => setFormData({
                                ...formData,
                                security: {
                                    ...formData.security,
                                    isPrivate: e.target.checked
                                }
                            })}
                        />
                        Private Account
                    </label>
                    <p className={ss.privacy_description}>
                        {formData.security?.isPrivate 
                            ? "Only approved followers can see your profile and content"
                            : "Anyone can see your profile and content"
                        }
                    </p>
                </div>
            </div>

            {/* Password Change Section */}
            <div className={ss.section}>
                <h3>Change Password</h3>
                <div className={ss.input_group}>
                    <label>Current Password</label>
                    <div className={ss.password_input}>
                        <input 
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter your current password"
                            value={formData.currentPassword || ''}
                            onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        />
                        <button 
                            type="button"
                            className={ss.show_password}
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
                <div className={ss.input_group}>
                    <label>New Password</label>
                    <div className={ss.password_input}>
                        <input 
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={formData.newPassword || ''}
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        />
                        <button 
                            type="button"
                            className={ss.show_password}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
                <div className={ss.input_group}>
                    <label>Confirm New Password</label>
                    <div className={ss.password_input}>
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            value={formData.confirmPassword || ''}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        />
                        <button 
                            type="button"
                            className={ss.show_password}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Two-Factor Authentication Section */}
            <div className={ss.section}>
                <h3>Two-Factor Authentication</h3>
                <div className={ss.checkbox_group}>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.security?.twoFactorAuth}
                            onChange={(e) => setFormData({
                                ...formData,
                                security: {
                                    ...formData.security,
                                    twoFactorAuth: e.target.checked
                                }
                            })}
                        />
                        Enable Two-Factor Authentication
                    </label>
                </div>
                {formData.security?.twoFactorAuth && (
                    <div className={ss.auth_method}>
                        <select 
                            className={ss.select_input}
                            value={formData.security?.authMethod || 'sms'}
                            onChange={(e) => setFormData({
                                ...formData,
                                security: {
                                    ...formData.security,
                                    authMethod: e.target.value
                                }
                            })}
                        >
                            <option value="sms">SMS</option>
                            <option value="email">Email</option>
                            <option value="authenticator">Authenticator App</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Login History Section */}
            <div className={ss.section}>
                <h3>Login History</h3>
                <div className={ss.login_history}>
                    <div className={ss.history_item}>
                        <span>Seoul, South Korea</span>
                        <span>Chrome - Windows</span>
                        <span>Just now</span>
                    </div>
                    <div className={ss.history_item}>
                        <span>Tokyo, Japan</span>
                        <span>Safari - macOS</span>
                        <span>2 days ago</span>
                    </div>
                </div>
            </div>

            {/* Account Security Section */}
            <div className={ss.section}>
                <h3>Account Security</h3>
                <div className={ss.button_group}>
                    <button className={`${ss.basic_btn} ${ss.warning_btn}`}>
                        Sign Out All Devices
                    </button>
                    <button className={`${ss.basic_btn} ${ss.remove_btn}`}>
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SecuritySettings 