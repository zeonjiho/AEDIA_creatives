import React from 'react'
import ss from './Settings.module.css'

const BillingSettings = ({ formData, setFormData }) => {
    return (
        <div className={ss.form_section}>
            {/* 현재 플랜 섹션 */}
            <div className={ss.input_group}>
                <label>Current Plan</label>
                <div className={ss.plan_card}>
                    <div className={ss.plan_info}>
                        <h3>Free Plan</h3>
                        <p>Basic features for personal use</p>
                    </div>
                    <button className={ss.upgrade_btn}>Upgrade Plan</button>
                </div>
            </div>

            {/* 결제 내역 섹션 */}
            <div className={ss.input_group}>
                <label>Payment History</label>
                <div className={ss.payment_history}>
                    <div className={ss.empty_state}>
                        <p>No payment history available</p>
                    </div>
                </div>
            </div>

            {/* 결제 수단 섹션 */}
            <div className={ss.input_group}>
                <label>Payment Methods</label>
                <div className={ss.payment_methods}>
                    <button className={ss.add_payment_btn}>
                        + Add Payment Method
                    </button>
                </div>
            </div>

            {/* 청구 정보 섹션 */}
            <div className={ss.input_group}>
                <label>Billing Information</label>
                <input 
                    type="text"
                    placeholder="Company Name (Optional)"
                    value={formData.billing?.companyName || ''}
                    onChange={(e) => setFormData({
                        ...formData,
                        billing: {
                            ...formData.billing,
                            companyName: e.target.value
                        }
                    })}
                />
                <input 
                    type="text"
                    placeholder="Tax ID (Optional)"
                    value={formData.billing?.taxId || ''}
                    onChange={(e) => setFormData({
                        ...formData,
                        billing: {
                            ...formData.billing,
                            taxId: e.target.value
                        }
                    })}
                />
            </div>
        </div>
    )
}

export default BillingSettings 