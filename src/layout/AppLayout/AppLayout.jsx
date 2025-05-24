import React, { useState, useEffect } from 'react'
import PCLayout from './PCLayout'
import MobileLayout from './MobileLayout'
import { jwtDecode } from 'jwt-decode'

const AppLayout = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [user, setUser] = useState(null)
    
    // 화면 크기 변경 감지
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        if (!localStorage.getItem('token')) {
            return;
        }
        const userId = jwtDecode(localStorage.getItem('token')).userId
        setUser(user)
    }, [])
    
    // 화면 크기에 따라 적절한 레이아웃 렌더링
    return isMobile ? <MobileLayout /> : <PCLayout />
}

export default AppLayout