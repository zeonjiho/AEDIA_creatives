require('dotenv').config()
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

// 슬랙 관련
const { WebClient } = require('@slack/web-api')
const slackToken = process.env.SLACK_TOKEN
const slackBot = new WebClient(slackToken)

const app = express()

const port = 8181;
const tokenSecretKey = 'temp_key';

const User = require('./models/User')
const Todo = require('./models/Todo')
const Calendar = require('./models/Calendar')
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
// API 라우터
// ----------------------------------------------------------

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.get('/get-user-list', async (req, res) => {
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

app.post('/signup', async (req, res) => {
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

app.post('/login', async (req, res) => {
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

        if (user.userType === 'external') {
            res.status(401).json({ message: '외부 사용자는 로그인할 수 없습니다.' });
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
app.get('/admin/approve-user/:userId', async (req, res) => {
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
app.get('/get-user-info', async (req, res) => {
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

// 출근 체크인 API
app.post('/attendance/check-in', async (req, res) => {
    const { location, method = 'manual' } = req.body;
    const { userId } = req.query;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
        const now = new Date();

        // 오늘 출석 기록 찾기
        let todayAttendance = user.attendance.find(att => att.date === today);

        const newRecord = {
            type: 'checkIn',
            time: now,
            method: method
        };

        if (!todayAttendance) {
            // 새로운 출석 기록 생성 - MongoDB $push 사용
            await User.findByIdAndUpdate(userId, {
                $push: {
                    attendance: {
                        date: today,
                        records: [newRecord]
                    }
                }
            });
        } else {
            // 기존 출석 기록에 새로운 출근 기록 추가 - MongoDB $push 사용
            await User.findOneAndUpdate(
                { _id: userId, 'attendance.date': today },
                {
                    $push: {
                        'attendance.$.records': newRecord
                    }
                }
            );
        }

        // 9시 이후면 지각
        const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

        const responseData = {
            message: '출근 처리되었습니다.',
            checkInTime: now,
            isLate: isLate,
            status: isLate ? '지각' : '정시'
        };

        res.status(200).json(responseData);

    } catch (err) {
        console.error('출근 처리 중 오류:', err);
        res.status(500).json({ message: '출근 처리 중 오류가 발생했습니다.' });
    }
});

// 퇴근 체크아웃 API
app.post('/attendance/check-out', async (req, res) => {
    const { location, method = 'manual' } = req.body;
    const { userId } = req.query;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // 오늘 출석 기록 찾기
        let todayAttendance = user.attendance.find(att => att.date === today);
        if (!todayAttendance) {
            return res.status(400).json({ message: '출근 기록이 없습니다.' });
        }

        // 가장 최근 출근 기록 중에서 퇴근하지 않은 기록 찾기
        const checkInRecords = todayAttendance.records.filter(r => r.type === 'checkIn');
        const checkOutRecords = todayAttendance.records.filter(r => r.type === 'checkOut');

        if (checkInRecords.length === 0) {
            return res.status(400).json({ message: '출근 기록이 없습니다.' });
        }

        if (checkInRecords.length <= checkOutRecords.length) {
            return res.status(400).json({ message: '이미 퇴근 처리되었습니다.' });
        }

        // 퇴근 기록 추가 - MongoDB $push 사용
        const newRecord = {
            type: 'checkOut',
            time: now,
            method: method
        };

        await User.findOneAndUpdate(
            { _id: userId, 'attendance.date': today },
            {
                $push: {
                    'attendance.$.records': newRecord
                }
            }
        );

        // 가장 최근 출근과 퇴근 시간으로 근무 시간 계산
        const lastCheckIn = checkInRecords[checkInRecords.length - 1];
        const workMinutes = Math.floor((now - new Date(lastCheckIn.time)) / (1000 * 60));

        res.status(200).json({
            message: '퇴근 처리되었습니다.',
            checkOutTime: now,
            workHours: workMinutes,
            workHoursFormatted: `${Math.floor(workMinutes / 60)}시간 ${workMinutes % 60}분`
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '퇴근 처리 중 오류가 발생했습니다.' });
    }
});

// 출석 기록 조회 API
app.get('/attendance/history', async (req, res) => {
    const { userId } = req.query;
    const { limit = 30 } = req.query; // 기본 30개 기록

    try {
        const user = await User.findById(userId).select('attendance');
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 최신 순으로 정렬하고 제한
        const attendanceHistory = user.attendance
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
            .map(att => {
                const checkInRecords = att.records.filter(r => r.type === 'checkIn');
                const checkOutRecords = att.records.filter(r => r.type === 'checkOut');

                // 첫 번째 출근과 마지막 퇴근 시간
                const firstCheckIn = checkInRecords.length > 0 ? checkInRecords[0] : null;
                const lastCheckOut = checkOutRecords.length > 0 ? checkOutRecords[checkOutRecords.length - 1] : null;

                // 상태 결정
                let status = '정상';
                if (firstCheckIn) {
                    const isLate = new Date(firstCheckIn.time).getHours() >= 9;
                    if (isLate) status = '지각';
                }
                if (!lastCheckOut && firstCheckIn) status = '미퇴근';
                if (checkInRecords.length === 0) status = '결근';

                // 총 근무시간 계산
                let totalWorkMinutes = 0;
                for (let i = 0; i < Math.min(checkInRecords.length, checkOutRecords.length); i++) {
                    const checkInTime = new Date(checkInRecords[i].time);
                    const checkOutTime = new Date(checkOutRecords[i].time);
                    totalWorkMinutes += Math.floor((checkOutTime - checkInTime) / (1000 * 60));
                }

                return {
                    date: att.date,
                    checkIn: firstCheckIn ? new Date(firstCheckIn.time).toTimeString().slice(0, 5) : '-',
                    checkOut: lastCheckOut ? new Date(lastCheckOut.time).toTimeString().slice(0, 5) : '-',
                    workHours: totalWorkMinutes,
                    workHoursFormatted: totalWorkMinutes > 0 ? `${Math.floor(totalWorkMinutes / 60)}시간 ${totalWorkMinutes % 60}분` : '-',
                    status: status,
                    memo: att.memo || '',
                    recordCount: checkInRecords.length + checkOutRecords.length
                };
            });

        res.status(200).json(attendanceHistory);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '출석 기록 조회 중 오류가 발생했습니다.' });
    }
});

// 오늘 출석 상태 조회 API
app.get('/attendance/today', async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId).select('attendance');
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = user.attendance.find(att => att.date === today);

        if (!todayAttendance || todayAttendance.records.length === 0) {
            const response = {
                status: '미출근',
                records: [],
                canCheckIn: true,
                canCheckOut: false
            };
            return res.status(200).json(response);
        }

        const checkInRecords = todayAttendance.records.filter(r => r.type === 'checkIn');
        const checkOutRecords = todayAttendance.records.filter(r => r.type === 'checkOut');

        let status = '미출근';
        let canCheckOut = false;

        if (checkInRecords.length > 0) {
            if (checkInRecords.length > checkOutRecords.length) {
                status = '출근';
                canCheckOut = true;
            } else {
                status = '퇴근';
            }
        }

        const response = {
            status: status,
            records: todayAttendance.records,
            canCheckIn: true, // 언제든 출근 가능
            canCheckOut: canCheckOut,
            attendanceRecord: todayAttendance
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('오늘 출석 상태 조회 중 오류:', err);
        res.status(500).json({ message: '오늘 출석 상태 조회 중 오류가 발생했습니다.' });
    }
});

// 출퇴근 기록 수정 API
app.patch('/attendance/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { date, recordIndex, time } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const targetAttendance = user.attendance.find(att => att.date === date);
        if (!targetAttendance) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록이 없습니다.' });
        }

        if (recordIndex >= targetAttendance.records.length) {
            return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
        }

        const newTime = new Date(time);
        targetAttendance.records[recordIndex].time = newTime;
        targetAttendance.records[recordIndex].method = 'manual_edit';

        await user.save();

        res.status(200).json({
            message: '출석 기록이 수정되었습니다.',
            updatedRecord: targetAttendance
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '출석 기록 수정 중 오류가 발생했습니다.' });
    }
});

// 출퇴근 기록 삭제 API
app.delete('/attendance/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    const { date, recordIndex } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const targetAttendance = user.attendance.find(att => att.date === date);
        if (!targetAttendance) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록이 없습니다.' });
        }

        if (recordIndex >= targetAttendance.records.length) {
            return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
        }

        targetAttendance.records.splice(recordIndex, 1);

        // 기록이 모두 삭제되면 날짜 자체도 삭제
        if (targetAttendance.records.length === 0) {
            user.attendance = user.attendance.filter(att => att.date !== date);
        }

        await user.save();

        res.status(200).json({
            message: '출석 기록이 삭제되었습니다.',
            updatedRecord: targetAttendance.records.length > 0 ? targetAttendance : null
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '출석 기록 삭제 중 오류가 발생했습니다.' });
    }
});

// 새로운 출근 처리 (기존 퇴근 기록이 있어도 가능) - 이제 불필요하므로 기본 check-in과 동일
app.post('/attendance/new-check-in', async (req, res) => {
    // 기본 check-in API와 동일한 로직 사용
    const { location, method = 'manual' } = req.body;
    const { userId } = req.query;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // 오늘 출석 기록 찾기
        let todayAttendance = user.attendance.find(att => att.date === today);

        if (!todayAttendance) {
            // 새로운 출석 기록 생성
            todayAttendance = {
                date: today,
                records: []
            };
            user.attendance.push(todayAttendance);
        }

        // 새로운 출근 기록 추가
        todayAttendance.records.push({
            type: 'checkIn',
            time: now,
            method: method
        });

        await user.save();

        // 9시 이후면 지각
        const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

        res.status(200).json({
            message: '출근 처리되었습니다.',
            checkInTime: now,
            isLate: isLate,
            status: isLate ? '지각' : '정시'
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '출근 처리 중 오류가 발생했습니다.' });
    }
});

// Todo 관련 API
// 할 일 목록 조회
app.get('/todos', async (req, res) => {
    const { userId } = req.query;
    try {
        const todos = await Todo.find({ poster: userId })
            .populate('poster', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(todos);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '할 일 목록 조회 실패' });
    }
});

// 할 일 추가
app.post('/todos', async (req, res) => {
    const { userId } = req.query;
    const { text, dueDate, dueTime, projectId } = req.body;

    try {
        const newTodo = new Todo({
            text,
            dueDate,
            dueTime: dueTime || null,
            poster: userId,
            projectId: projectId || null
        });

        await newTodo.save();

        // populate해서 응답 (projectId 제외)
        const populatedTodo = await Todo.findById(newTodo._id)
            .populate('poster', 'name email');

        res.status(201).json(populatedTodo);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '할 일 추가 실패' });
    }
});

// 할 일 수정
app.put('/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    const { text, dueDate, dueTime, projectId } = req.body;

    try {
        const todo = await Todo.findOne({ _id: id, poster: userId });
        if (!todo) {
            return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            {
                text,
                dueDate,
                dueTime: dueTime || null,
                projectId: projectId || null,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('poster', 'name email');

        res.status(200).json(updatedTodo);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '할 일 수정 실패' });
    }
});

// 할 일 완료/미완료 토글
app.patch('/todos/:id/toggle', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    try {
        const todo = await Todo.findOne({ _id: id, poster: userId });
        if (!todo) {
            return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            {
                completed: !todo.completed,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('poster', 'name email');

        res.status(200).json(updatedTodo);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '할 일 상태 변경 실패' });
    }
});

// 할 일 삭제
app.delete('/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;

    try {
        const todo = await Todo.findOne({ _id: id, poster: userId });
        if (!todo) {
            return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
        }

        await Todo.findByIdAndDelete(id);
        res.status(200).json({ message: '할 일이 삭제되었습니다.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '할 일 삭제 실패' });
    }
});

// 대시보드 레이아웃 관련 API
// 레이아웃 저장
app.patch('/dashboard/layout', async (req, res) => {
    const { userId } = req.query;
    const { layouts } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { mainLayout: layouts },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: '레이아웃이 저장되었습니다.',
            mainLayout: updatedUser.mainLayout
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '레이아웃 저장 실패' });
    }
});

// 레이아웃 불러오기
app.get('/dashboard/layout', async (req, res) => {
    const { userId } = req.query;

    try {
        const user = await User.findById(userId).select('mainLayout');
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({
            mainLayout: user.mainLayout || {}
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '레이아웃 불러오기 실패' });
    }
});





// // TEST API
// const devTest_slack = async () => {
//     try {
//         const message = '안녕하세요. 테스트 메시지입니다.'

//         // 방법 1: 테스트 채널 사용 (권장)
//         await slackBot.chat.postMessage({
//             channel: 'U062BR8GUTW', // @빼면 안 되는 듯.
//             // channel: '@zeonjiho', // @빼면 안 되는 듯.
//             text: message
//         })

//         console.log('슬랙 메시지 전송 성공')
//     } catch (err) {
//         console.log('슬랙 메시지 전송 실패:', err)
//     }
// }
// devTest_slack()