import { Route, Routes } from 'react-router-dom';
import './App.css';
import AppLayout from './layout/AppLayout/AppLayout';
import Home from './page/Home/Home';
import Landing from './page/Landing/Landing';
import Login from './page/Login/Login';
import Signup from './page/Signup/Signup';
import Pricing from './page/Pricing/Pricing'
import MyPage from './page/MyPage/MyPage';
import ArtworkDetail from './page/ArtworkDetail/ArtworkDetail';
import ForgotPassword from './page/Login/ForgotPassword/ForgotPassword';
import ResetPassword from './page/Login/ResetPassword/ResetPassword';
import Messages from './page/Messages/Messages';
import AdminLayout from './layout/AdminLayout/AdminLayout';
import Jam from './page/Jam/Jam';

function App() {
    return (
        <div style={{
            // backgroundColor: '#000',
            // minHeight: '100vh',
            // color: '#fff'
        }}>
            <Routes>
                <Route path='/' element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path='/landing' element={<Landing />} />
                    <Route path='login' element={<Login />} />
                    <Route path='signup' element={<Signup />} />
                    <Route path='forgot-password' element={<ForgotPassword />} />
                    <Route path='pricing' element={<Pricing />} />
                    <Route path='artwork/:id' element={<ArtworkDetail />} />
                    <Route path=':userNameOnUrl' element={<MyPage />} />
                    <Route path='reset-password' element={<ResetPassword />} />
                    <Route path='messages' element={<Messages />} />
                    <Route path='jam' element={<Jam />} />
                </Route>
                <Route path='/admin' element={<AdminLayout />}>

                </Route>
            </Routes>
        </div>
    );
}

export default App;