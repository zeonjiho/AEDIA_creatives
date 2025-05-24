const express = require('express');
const cors = require('cors')
const https = require('https')
const fs = require('fs')
const mongoose = require('mongoose')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const axios = require('axios')
const jwt = require('jsonwebtoken')

const app = express()

const port = 8181;
const tokenSecretKey = 'temp_key';

const User = require('./models/User')
    // const Category = require('./models/Category')
    // const Review = require('./models/Review')
    // const Product = require('./models/Product')
    // const Order = require('./models/Order')
    // const MainBanner = require('./models/MainBanner')
    // const FreeDesign = require('./models/FreeDesign')

//로컬 버전 http 서버
app.listen(port, () => {
    console.log(`\x1b[35mServer is running on port \x1b[32m${port}\x1b[0m ${new Date().toLocaleString()}`);
})

//배포 버전 https 서버
// const sslKey = fs.readFileSync('/etc/letsencrypt/live/alpha1024.raulsoft.com/privkey.pem');
// const sslCert = fs.readFileSync('/etc/letsencrypt/live/alpha1024.raulsoft.com/fullchain.pem');
// const credentials = { key: sslKey, cert: sslCert };
// https.createServer(credentials, app).listen(port, () => {
//     console.log(`\x1b[32mhttps \x1b[35mServer is running on port \x1b[32m${port}\x1b[0m ${new Date().toLocaleString()}`);
// });

//MongoDB 연결
mongoose.connect('mongodb+srv://bilvin0709:qyxFXyPck7WgAjVt@cluster0.sduy2do.mongodb.net/aedia')
    .then(() => {
        const db = mongoose.connection;
        console.log(`\x1b[35mMongoDB Connected in \x1b[32m${db.name}\x1b[0m ${new Date().toLocaleString()}`)
    })
    .catch((err => console.log(err)))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 업로드된, 실제 이미지 서빙을 위한 정적 파일 경로 설정
app.use('/uploads', express.static('uploads'));


// ----------------------------------------------------------
// 목업 데이터
// ----------------------------------------------------------

const mockUsers = [{
        loginId: 'kim.minsu',
        password: 'password123',
        name: '김민수',
        userType: 'internal',
        phone: '010-1234-5678',
        email: 'kim.minsu@aedia.com',
        roles: ['producer', 'project_manager'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'lee.soojin',
        password: 'password123',
        name: '이수진',
        userType: 'internal',
        phone: '010-2345-6789',
        email: 'lee.soojin@aedia.com',
        roles: ['creative_director'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'park.jiwon',
        password: 'password123',
        name: '박지원',
        userType: 'internal',
        phone: '010-3456-7890',
        email: 'park.jiwon@aedia.com',
        roles: ['editor', 'motion_graphics'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'choi.dohyun',
        password: 'password123',
        name: '최도현',
        userType: 'external',
        phone: '010-4567-8901',
        email: 'choi.dohyun@freelancer.com',
        roles: ['director', 'camera'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'jung.minji',
        password: 'password123',
        name: '정민지',
        userType: 'internal',
        phone: '010-5678-9012',
        email: 'jung.minji@aedia.com',
        roles: ['art_director', 'designer'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'kang.seungho',
        password: 'password123',
        name: '강승호',
        userType: 'external',
        phone: '010-6789-0123',
        email: 'kang.seungho@lighting.com',
        roles: ['lighting_director'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'yoon.haeun',
        password: 'password123',
        name: '윤하은',
        userType: 'internal',
        phone: '010-7890-1234',
        email: 'yoon.haeun@aedia.com',
        roles: ['account_manager'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'lim.jaehyuk',
        password: 'password123',
        name: '임재혁',
        userType: 'external',
        phone: '010-8901-2345',
        email: 'lim.jaehyuk@sound.com',
        roles: ['sound_engineer'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'han.yejin',
        password: 'password123',
        name: '한예진',
        userType: 'internal',
        phone: '010-9012-3456',
        email: 'han.yejin@aedia.com',
        roles: ['copywriter', 'content_planner'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'song.mingyu',
        password: 'password123',
        name: '송민규',
        userType: 'external',
        phone: '010-0123-4567',
        email: 'song.mingyu@photo.com',
        roles: ['photographer'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'oh.soyeon',
        password: 'password123',
        name: '오소연',
        userType: 'internal',
        phone: '010-1357-2468',
        email: 'oh.soyeon@aedia.com',
        roles: ['production_coordinator'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'kwon.taemin',
        password: 'password123',
        name: '권태민',
        userType: 'external',
        phone: '010-2468-1357',
        email: 'kwon.taemin@vfx.com',
        roles: ['vfx_artist'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'shin.eunji',
        password: 'password123',
        name: '신은지',
        userType: 'internal',
        phone: '010-3691-4702',
        email: 'shin.eunji@aedia.com',
        roles: ['marketing_manager'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'bae.jongsoo',
        password: 'password123',
        name: '배종수',
        userType: 'external',
        phone: '010-4702-5813',
        email: 'bae.jongsoo@grip.com',
        roles: ['gaffer', 'grip'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'moon.chaeyoung',
        password: 'password123',
        name: '문채영',
        userType: 'internal',
        phone: '010-5813-6924',
        email: 'moon.chaeyoung@aedia.com',
        roles: ['finance_manager'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'ahn.hyunwoo',
        password: 'password123',
        name: '안현우',
        userType: 'external',
        phone: '010-6924-7035',
        email: 'ahn.hyunwoo@music.com',
        roles: ['composer', 'music_director'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'go.yuri',
        password: 'password123',
        name: '고유리',
        userType: 'internal',
        phone: '010-7035-8146',
        email: 'go.yuri@aedia.com',
        roles: ['hr_manager'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'nam.jihoon',
        password: 'password123',
        name: '남지훈',
        userType: 'external',
        phone: '010-8146-9257',
        email: 'nam.jihoon@makeup.com',
        roles: ['makeup_artist'],
        status: 'waiting',
        projects: []
    },
    {
        loginId: 'ryu.seungmin',
        password: 'password123',
        name: '류승민',
        userType: 'internal',
        phone: '010-9257-0368',
        email: 'ryu.seungmin@aedia.com',
        roles: ['tech_manager', 'equipment'],
        status: 'active',
        projects: []
    },
    {
        loginId: 'jeon.yoona',
        password: 'password123',
        name: '전윤아',
        userType: 'external',
        phone: '010-0368-1479',
        email: 'jeon.yoona@styling.com',
        roles: ['stylist', 'wardrobe'],
        status: 'active',
        projects: []
    }
];


// ----------------------------------------------------------
// API 라우터
// ----------------------------------------------------------

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/get-user-list', async(req, res) => {
    const { userType } = req.query;
    try {
        if (userType === 'all') {
            const userList = await User.find({}).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'internal') {
            const userList = await User.find({ userType: 'internal' }).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'external') {
            const userList = await User.find({ userType: 'external' }).select('-password');
            res.status(200).json(userList);
        }
    } catch (err) {
        console.log(err)
        res.status(500).json()
    }
})

app.post('/signup', async(req, res) => {
    const { password, name, slackId, phone, email, position } = req.body;
    try {
        const alreadyExists = await User.findOne({ email: email });
        if (alreadyExists) {
            res.status(401).json({ message: '이미 존재하는 이메일입니다.' });
            return;
        }
        const newUser = new User({
            password,
            name,
            loginId: slackId,
            userType: 'internal',
            phone,
            email,
            roles: [position],
            status: 'waiting',
            projects: []
        });
        await newUser.save();
        res.status(200).json({ message: 'User added successfully' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to add user' });
    }
})

app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
            return;
        }
        if (user.password !== password) {
            res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            return;
        }
        if (user.status === 'waiting') {
            res.status(401).json({ message: '대기 상태입니다. 관리자 승인 후 로그인 가능합니다.' });
            return;
        }
        // JWT 토큰 생성 - userId만 포함 (시크릿 키 없이)
        const token = jwt.sign({ userId: user._id },
            tokenSecretKey,
            // { expiresIn: '1d' } // 유효기간 따로 없음
        );
        res.status(200).json({ message: '로그인 성공', user, token });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '로그인 실패' });
    }
})

// 유저 승인 API
app.get('/admin/approve-user/:userId', async(req, res) => {
    const { userId } = req.params;
    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId, { status: 'active' }, { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '사용자가 승인되었습니다.', user: updatedUser });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '승인 처리 중 오류가 발생했습니다.' });
    }
})

// 사용자 정보 불러오기 (메인 등에서 사용)
app.get('/get-user-info', async(req, res) => {
    const { userId } = req.query;
    try {
        const user = await User.findById(userId).select('-password');
        if (user) {
            res.status(200).json(user);
            return
        } else {
            res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
            return
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '사용자 정보 불러오기 실패' });
    }
})