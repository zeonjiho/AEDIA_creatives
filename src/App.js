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
import TeamNotifications from './page/TeamNotifications/TeamNotifications';
import Receipts from './page/Receipts/Receipts';

function App() {
  return (
    <div>
      <Routes>
        <Route path='/' element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path='login' element={<Login />} />
          <Route path='attendance' element={<Attendance />} />
          <Route path='todo' element={<TodoList />} />
          <Route path='calendar' element={<Calendar />} />
          <Route path='room-reservation' element={<RoomReservation />} />
          <Route path='projects' element={<ProjectStatus />} />
          <Route path='notifications' element={<TeamNotifications />} />
          <Route path='receipts' element={<Receipts />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
