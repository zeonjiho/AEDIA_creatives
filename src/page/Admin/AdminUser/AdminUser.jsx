import React, { useEffect, useState } from 'react'
import ss from './AdminUser.module.css'
import api from '../../../utils/api'

const AdminUser = () => {

  const [userList, setUserList] = useState([]);

  useEffect(() => {
    fetchUserList();
  }, [])

  const fetchUserList = async () => {
    try {
      const response = await api.get('/get-user-list?userType=internal');
      setUserList(response.data);
    } catch (err) {
      console.log(err);
    }
  }
  
  return (
    <div>
      {userList && userList.length > 0 && userList.map((user, idx) => (
        <div key={idx} style={{ marginBottom: '20px' }}>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <p>{user.phone}</p>
          <p>{user.status}</p>
          <p>{user.roles.join(', ')}</p>
        </div>
      ))}
    </div>
  )
}

export default AdminUser