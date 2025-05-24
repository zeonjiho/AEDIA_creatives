import { Route, Routes } from 'react-router-dom';
import './App.css';
import AppLayout from './layout/AppLayout/AppLayout';
import Home from './page/Home/Home';
import Login from './page/Login/Login';
import Attendance from './page/Attendance/Attendance';
import TodoList from './page/TodoList/TodoList';
import RoomReservation from './page/RoomReservation/RoomReservation';
import ProjectStatus from './page/ProjectStatus/ProjectStatus';
import TeamNotifications from './page/TeamNotifications/TeamNotifications';
import Receipts from './page/Receipts/Receipts';
import Signup from './page/Signup/Signup';
import ForgotPassword from './page/ForgotPassword/ForgotPassword';
import Profile from './page/Profile/Profile';
import AdminLayout from './layout/AdminLayout/AdminLayout';
import AdminMain from './page/Admin/AdminMain/AdminMain';
import AdminUser from './page/Admin/AdminUser/AdminUser';
import AdminProject from './page/Admin/AdminProject/AdminProject';

function App() {
  return (
    <div>
      <Routes>
        <Route path='login' element={<Login />} />
        <Route path='signup' element={<Signup />} />
        <Route path='forgot-password' element={<ForgotPassword />} />
        
        <Route path='/' element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path='attendance' element={<Attendance />} />
          <Route path='todo' element={<TodoList />} />
          <Route path='room-reservation' element={<RoomReservation />} />
          <Route path='projects' element={<ProjectStatus />} />
          <Route path='notifications' element={<TeamNotifications />} />
          <Route path='receipts' element={<Receipts />} />
          <Route path='profile' element={<Profile />} />
        </Route>

        <Route path='/admin' element={<AdminLayout />}>
          <Route index element={<AdminMain />} />
          <Route path='user' element={<AdminUser />} />
          <Route path='project' element={<AdminProject />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
