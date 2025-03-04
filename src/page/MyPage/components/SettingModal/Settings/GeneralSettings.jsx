import React from 'react'
import ss from './Settings.module.css'

const GeneralSettings = ({ formData, setFormData }) => {
    return (
        <div className={ss.form_section}>
            <div className={ss.input_group}>
                <label>Language</label>
                <select 
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className={ss.select_input}
                >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                </select>
            </div>

            <div className={ss.input_group}>
                <label>Theme</label>
                <select 
                    value={formData.theme}
                    onChange={(e) => setFormData({...formData, theme: e.target.value})}
                    className={ss.select_input}
                >
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                    <option value="system">System Default</option>
                </select>
            </div>

            <div className={ss.input_group}>
                <label>Time Zone</label>
                <select 
                    value={formData.timezone}
                    onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                    className={ss.select_input}
                >
                    <option value="Asia/Seoul">(GMT+09:00) Seoul</option>
                    <option value="Asia/Tokyo">(GMT+09:00) Tokyo</option>
                    <option value="America/New_York">(GMT-05:00) New York</option>
                    <option value="Europe/London">(GMT+00:00) London</option>
                    <option value="Europe/Paris">(GMT+01:00) Paris</option>
                </select>
            </div>

            <div className={ss.input_group}>
                <label>Date Format</label>
                <select 
                    value={formData.dateFormat}
                    onChange={(e) => setFormData({...formData, dateFormat: e.target.value})}
                    className={ss.select_input}
                >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                </select>
            </div>

            <div className={ss.input_group}>
                <label>Accessibility</label>
                <div className={ss.checkbox_group}>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.accessibility?.reduceMotion}
                            onChange={(e) => setFormData({
                                ...formData,
                                accessibility: {
                                    ...formData.accessibility,
                                    reduceMotion: e.target.checked
                                }
                            })}
                        />
                        Reduce Motion
                    </label>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.accessibility?.highContrast}
                            onChange={(e) => setFormData({
                                ...formData,
                                accessibility: {
                                    ...formData.accessibility,
                                    highContrast: e.target.checked
                                }
                            })}
                        />
                        High Contrast
                    </label>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.accessibility?.screenReader}
                            onChange={(e) => setFormData({
                                ...formData,
                                accessibility: {
                                    ...formData.accessibility,
                                    screenReader: e.target.checked
                                }
                            })}
                        />
                        Screen Reader Optimization
                    </label>
                </div>
            </div>

            <div className={ss.input_group}>
                <label>Default Page</label>
                <select 
                    value={formData.defaultPage}
                    onChange={(e) => setFormData({...formData, defaultPage: e.target.value})}
                    className={ss.select_input}
                >
                    <option value="home">Home</option>
                    <option value="explore">Explore</option>
                    <option value="notifications">Notifications</option>
                    <option value="profile">Profile</option>
                </select>
            </div>
        </div>
    )
}

export default GeneralSettings 