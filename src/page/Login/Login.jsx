import React from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {

    const navigate = useNavigate()

    return (
        <div onClick={()=>navigate('/')}>Login</div>
    )
}

export default Login