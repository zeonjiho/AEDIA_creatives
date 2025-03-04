import React from 'react'
import ss from './Settings.module.css'

const NotificationSettings = ({ formData, setFormData }) => {
    return (
        <div className={ss.form_section}>
            <div className={ss.input_group}>
                <label>Email Notifications</label>
                <div className={ss.checkbox_group}>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.notifications.newFollowers}
                            onChange={(e) => setFormData({
                                ...formData,
                                notifications: {
                                    ...formData.notifications,
                                    newFollowers: e.target.checked
                                }
                            })}
                        />
                        New followers
                    </label>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.notifications.likes}
                            onChange={(e) => setFormData({
                                ...formData,
                                notifications: {
                                    ...formData.notifications,
                                    likes: e.target.checked
                                }
                            })}
                        />
                        Likes on your posts
                    </label>
                    <label className={ss.checkbox_label}>
                        <input 
                            type="checkbox"
                            checked={formData.notifications.comments}
                            onChange={(e) => setFormData({
                                ...formData,
                                notifications: {
                                    ...formData.notifications,
                                    comments: e.target.checked
                                }
                            })}
                        />
                        Comments on your posts
                    </label>
                </div>
            </div>
        </div>
    )
}

export default NotificationSettings 