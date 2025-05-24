import React from 'react'
import ss from './AdminLayout.module.css'
import { Outlet } from 'react-router-dom'

const AdminLayout = () => {
    return (
        <div>
            <h2>AdminLayout</h2>
            <Outlet />
        </div>
    )
}

export default AdminLayout