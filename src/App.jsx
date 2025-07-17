import { Route, Routes } from 'react-router-dom';
import './App.css';
import AppLayout from './layout/AppLayout/AppLayout';
import Home from './page/Home/Home';
import Login from './page/Login/Login';
import Attendance from './page/Attendance/Attendance';
import TodoList from './page/TodoList/TodoList';
import Calendar from './page/Calendar/Calendar';
import RoomReservation from './page/RoomReservation/RoomReservation';
import ProjectStatus from './page/ProjectStatus/ProjectStatus';

import Receipts from './page/Receipts/Receipts';
import ForgotPassword from './page/ForgotPassword/ForgotPassword';
import Profile from './page/Profile/Profile';
import Settings from './page/Settings/Settings';
import Contact from './page/Contact/Contact';
import AdminLayout from './layout/AdminLayout/AdminLayout';
import AdminMain from './page/Admin/AdminMain/AdminMain';
import AdminProject from './page/Admin/AdminProject/AdminProject';
import AdminUser from './page/Admin/AdminUser/AdminUser';
import AdminStaff from './page/Admin/AdminStaff/AdminStaff';
import AdminFinanceMeal from './page/Admin/AdminFinance/AdminFinanceMeal';
import AdminFinanceTaxi from './page/Admin/AdminFinance/AdminFinanceTaxi';
import AdminFinanceOther from './page/Admin/AdminFinance/AdminFinanceOther';
import AdminRoom from './page/Admin/AdminRoom/AdminRoom';
import AdminAttendance from './page/Admin/AdminAttendance/AdminAttendance';
// import AdminAttendanceSummary from './page/Admin/AdminAttendance/AdminAttendanceSummary';
import AdminDeleted from './page/Admin/AdminUser/AdminDeleted';
import AdminCreditCard from './page/Admin/AdminFinance/AdminCreditCard';
import AdminAdvanced from './page/Admin/AdminAdvanced/AdminAdvanced';
import AdminDepartment from './page/Admin/AdminDepartment/AdminDepartment';


function App() {

  if (window.location.pathname !== '/login' && !localStorage.getItem('token')) {
    window.location.href = '/login'
    return
  }

  return (
    <div>
      <Routes>
        <Route path='login' element={<Login />} />
        <Route path='forgot-password' element={<ForgotPassword />} />

        <Route path='/' element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path='attendance' element={<Attendance />} />
          <Route path='todo' element={<TodoList />} />
          <Route path='calendar' element={<Calendar />} />
          <Route path='room-reservation' element={<RoomReservation />} />
          <Route path='projects' element={<ProjectStatus />} />
          <Route path='contact' element={<Contact />} />
          
          <Route path='receipts' element={<Receipts />} />
          <Route path='profile' element={<Profile />} />
          <Route path='settings' element={<Settings />} />
        </Route>

        <Route path='/admin' element={<AdminLayout />}>
          <Route index element={<AdminMain />} />
          <Route path='user-list' element={<AdminUser />} />
          <Route path='deleted-list' element={<AdminDeleted />} />
          <Route path='staff-list' element={<AdminStaff />} />
          <Route path='department' element={<AdminDepartment />} />
          <Route path='attendance' element={<AdminAttendance />} />
          {/* <Route path='attendance/summary' element={<AdminAttendanceSummary />} /> */}
          <Route path='finance'>
            <Route path='meal' element={<AdminFinanceMeal />} />
            <Route path='taxi' element={<AdminFinanceTaxi />} />
            <Route path='other' element={<AdminFinanceOther />} />
            <Route path='credit-card' element={<AdminCreditCard />} />
          </Route>
          <Route path='project' element={<AdminProject />} />
          <Route path='room' element={<AdminRoom />} />
          <Route path='advanced-setting' element={<AdminAdvanced />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
