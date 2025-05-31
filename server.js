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
const Room = require('./models/Room')
const Project = require('./models/Project')
const SlackCode = require('./models/SlackCode')

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
            const userList = await User.find({ status: { $ne: 'deleted' } }).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'internal') {
            const userList = await User.find({ userType: 'internal', status: { $ne: 'deleted' } }).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'external') {
            const userList = await User.find({ userType: 'external', status: { $ne: 'deleted' } }).select('-password');
            res.status(200).json(userList);
        }
    } catch (err) {
        console.log(err)
        res.status(500).json()
    }
})

app.post('/slack/code', async (req, res) => {
    const { slackId } = req.body;
    try {
        // 기존 코드가 있으면 삭제
        const alreadyExists = await SlackCode.findOne({ slackId });
        if (alreadyExists) {
            await SlackCode.findByIdAndDelete(alreadyExists._id);
        }

        // 6자리 인증코드 생성
        const code = Math.floor(100000 + Math.random() * 900000);

        // 데이터베이스에 저장
        const newSlackCode = new SlackCode({
            slackId,
            code
        });
        await newSlackCode.save();

        try {
            // 슬랙으로 인증코드 DM 전송
            await slackBot.chat.postMessage({
                channel: slackId, // 사용자 ID로 DM 전송
                text: `🔐 AEDIA 회원가입 인증코드: ${code}\n\n이 코드를 회원가입 페이지에 입력해주세요.\n(유효시간: 10분)`
            });

            console.log(`슬랙 인증코드 전송 성공: ${slackId} -> ${code}`);
            res.status(200).json({ message: '인증코드가 전송되었습니다.' });
        } catch (slackError) {
            console.error('슬랙 메시지 전송 실패:', slackError);
            // 슬랙 전송 실패 시 생성된 코드 삭제
            await SlackCode.findByIdAndDelete(newSlackCode._id);

            if (slackError.data?.error === 'channel_not_found' || slackError.data?.error === 'user_not_found') {
                res.status(404).json({ message: '해당 슬랙 멤버 ID를 찾을 수 없습니다.' });
            } else {
                res.status(500).json({ message: '슬랙 메시지 전송에 실패했습니다.' });
            }
        }
    } catch (err) {
        console.error('슬랙 코드 생성 실패:', err);
        res.status(500).json({ message: '인증코드 생성에 실패했습니다.' });
    }
});

app.post('/slack/code/verify', async (req, res) => {
    const { slackId, code } = req.body;
    try {
        const slackCode = await SlackCode.findOne({ slackId });

        if (!slackCode) {
            return res.status(404).json({ message: '인증코드를 찾을 수 없습니다. 다시 요청해주세요.' });
        }

        // 코드 유효시간 확인 (10분)
        const now = new Date();
        const codeCreatedAt = new Date(slackCode.createdAt);
        const timeDiff = (now - codeCreatedAt) / (1000 * 60); // 분 단위

        if (timeDiff > 10) {
            // 만료된 코드 삭제
            await SlackCode.findByIdAndDelete(slackCode._id);
            return res.status(400).json({ message: '인증코드가 만료되었습니다. 다시 요청해주세요.' });
        }

        // 코드 일치 확인
        if (slackCode.code.toString() !== code.toString()) {
            return res.status(400).json({ message: '인증코드가 일치하지 않습니다.' });
        }

        // 검증 성공 - 코드 삭제
        await SlackCode.findByIdAndDelete(slackCode._id);

        res.status(200).json({ message: '인증이 완료되었습니다.' });
    } catch (err) {
        console.error('슬랙 코드 검증 실패:', err);
        res.status(500).json({ message: '인증코드 검증에 실패했습니다.' });
    }
});

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
            slackId,
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

        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식

        // 새로운 체크인 기록 추가
        const newRecord = {
            type: 'checkIn',
            time: now,
            date: today,
            method: method
        };

        await User.findByIdAndUpdate(userId, {
            $push: { attendance: newRecord }
        });

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

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 가장 최근 기록이 체크인인지 확인
        const sortedAttendance = user.attendance.sort((a, b) => new Date(b.time) - new Date(a.time));

        if (sortedAttendance.length === 0 || sortedAttendance[0].type !== 'checkIn') {
            return res.status(400).json({ message: '출근 기록이 없거나 이미 퇴근 처리되었습니다.' });
        }

        const lastCheckIn = sortedAttendance[0];

        // 새로운 체크아웃 기록 추가
        const newRecord = {
            type: 'checkOut',
            time: now,
            date: today,
            method: method
        };

        await User.findByIdAndUpdate(userId, {
            $push: { attendance: newRecord }
        });

        // 근무 시간 계산
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

        // 날짜별로 그룹화
        const attendanceByDate = {};
        user.attendance.forEach(record => {
            if (!attendanceByDate[record.date]) {
                attendanceByDate[record.date] = [];
            }
            attendanceByDate[record.date].push(record);
        });

        // 날짜별로 정리하여 최신순으로 정렬
        const attendanceHistory = Object.keys(attendanceByDate)
            .sort((a, b) => new Date(b) - new Date(a))
            .slice(0, limit)
            .map(date => {
                const records = attendanceByDate[date].sort((a, b) => new Date(a.time) - new Date(b.time));
                const checkInRecords = records.filter(r => r.type === 'checkIn');
                const checkOutRecords = records.filter(r => r.type === 'checkOut');

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
                    date: date,
                    checkIn: firstCheckIn ? new Date(firstCheckIn.time).toTimeString().slice(0, 5) : '-',
                    checkOut: lastCheckOut ? new Date(lastCheckOut.time).toTimeString().slice(0, 5) : '-',
                    workHours: totalWorkMinutes,
                    workHoursFormatted: totalWorkMinutes > 0 ? `${Math.floor(totalWorkMinutes / 60)}시간 ${totalWorkMinutes % 60}분` : '-',
                    status: status,
                    memo: '',
                    recordCount: records.length
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

        // 출석 기록을 시간 순으로 정렬 (최신순)
        const sortedAttendance = user.attendance.sort((a, b) => new Date(b.time) - new Date(a.time));

        // 현재 상태 결정
        let status = '미출근';
        let canCheckOut = false;

        if (sortedAttendance.length > 0) {
            const lastRecord = sortedAttendance[0];
            if (lastRecord.type === 'checkIn') {
                status = '출근';
                canCheckOut = true;
            } else {
                status = '퇴근';
            }
        }

        // 오늘 기록만 필터링
        const todayRecords = user.attendance.filter(record => record.date === today);

        const response = {
            status: status,
            records: todayRecords,
            canCheckIn: true, // 언제든 출근 가능
            canCheckOut: canCheckOut,
            attendanceRecord: todayRecords.length > 0 ? { date: today, records: todayRecords } : null
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
    const { recordId, time } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const recordIndex = user.attendance.findIndex(record => record._id.toString() === recordId);
        if (recordIndex === -1) {
            return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
        }

        const newTime = new Date(time);
        user.attendance[recordIndex].time = newTime;
        user.attendance[recordIndex].method = 'manual_edit';

        await user.save();

        res.status(200).json({
            message: '출석 기록이 수정되었습니다.',
            updatedRecord: user.attendance[recordIndex]
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '출석 기록 수정 중 오류가 발생했습니다.' });
    }
});

// 출퇴근 기록 삭제 API
app.delete('/attendance/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    const { recordId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const recordIndex = user.attendance.findIndex(record => record._id.toString() === recordId);
        if (recordIndex === -1) {
            return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
        }

        user.attendance.splice(recordIndex, 1);
        await user.save();

        res.status(200).json({
            message: '출석 기록이 삭제되었습니다.'
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

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 새로운 체크인 기록 추가
        const newRecord = {
            type: 'checkIn',
            time: now,
            date: today,
            method: method
        };

        await User.findByIdAndUpdate(userId, {
            $push: { attendance: newRecord }
        });

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

// 회의실 관리 관련 API

// 회의실 목록 조회
app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({})
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json(rooms);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '회의실 목록 조회 실패' });
    }
});

// 회의실 추가
app.post('/rooms', async (req, res) => {
    const { roomName, location, tools } = req.body;

    try {
        const newRoom = new Room({
            roomName,
            location: location || '',
            tools: tools || [],
            reservations: []
        });

        await newRoom.save();

        // populate해서 응답
        const populatedRoom = await Room.findById(newRoom._id)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title');

        res.status(201).json(populatedRoom);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '회의실 추가 실패' });
    }
});

// 회의실 수정
app.post('/rooms/:id/update', async (req, res) => {
    const { id } = req.params;
    const { roomName, location, tools } = req.body;

    try {
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            {
                roomName,
                location: location || '',
                tools: tools || []
            },
            { new: true }
        ).populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title');

        res.status(200).json(updatedRoom);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '회의실 수정 실패' });
    }
});

// 회의실 삭제
app.post('/rooms/:id/delete', async (req, res) => {
    const { id } = req.params;

    try {
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        // 예약이 있는지 확인
        const activeReservations = room.reservations.filter(
            reservation => reservation.status === '예약됨'
        );

        if (activeReservations.length > 0) {
            return res.status(400).json({
                message: '예약이 있는 회의실은 삭제할 수 없습니다. 먼저 예약을 취소해주세요.'
            });
        }

        await Room.findByIdAndDelete(id);
        res.status(200).json({ message: '회의실이 삭제되었습니다.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '회의실 삭제 실패' });
    }
});

// 예약 관련 API

// 예약 생성
app.post('/rooms/:roomId/reservations', async (req, res) => {
    const { roomId } = req.params;
    const {
        meetingName,
        meetingDescription,
        startTime,
        endTime,
        participants,
        project
    } = req.body;

    try {
        // 필수 필드 검증
        if (!meetingName || !startTime || !endTime || !participants || participants.length === 0) {
            return res.status(400).json({
                message: '회의 제목, 시작 시간, 종료 시간, 참여인원(최소 1명)은 필수입니다.'
            });
        }

        // 시간 유효성 검증
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return res.status(400).json({
                message: '종료 시간은 시작 시간보다 나중이어야 합니다.'
            });
        }

        // 과거 시간 예약 방지
        if (start < new Date()) {
            return res.status(400).json({
                message: '과거 시간으로는 예약할 수 없습니다.'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        // 시간 충돌 확인
        const conflictingReservation = room.reservations.find(reservation => {
            if (reservation.status === '취소됨') return false;

            const existingStart = new Date(reservation.startTime);
            const existingEnd = new Date(reservation.endTime);

            // 시간 충돌 조건: 새 예약의 시작이 기존 예약 끝나기 전이고, 새 예약의 끝이 기존 예약 시작 후인 경우
            return (start < existingEnd && end > existingStart);
        });

        if (conflictingReservation) {
            const conflictStart = new Date(conflictingReservation.startTime);
            const conflictEnd = new Date(conflictingReservation.endTime);

            const formatTime = (date) => {
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            };

            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            };

            return res.status(400).json({
                message: `예약 시간이 겹칩니다.\n기존 예약: "${conflictingReservation.meetingName}"\n시간: ${formatDate(conflictStart)} ${formatTime(conflictStart)} - ${formatTime(conflictEnd)}\n\n다른 시간을 선택해주세요.`,
                conflictingReservation: {
                    meetingName: conflictingReservation.meetingName,
                    startTime: conflictingReservation.startTime,
                    endTime: conflictingReservation.endTime,
                    status: conflictingReservation.status
                }
            });
        }

        // 새 예약 생성
        const newReservation = {
            participants: participants.map(userId => ({ userId })),
            meetingName,
            meetingDescription: meetingDescription || '',
            startTime: start,
            endTime: end,
            status: '예약됨',
            project: project || null
        };

        room.reservations.push(newReservation);
        await room.save();

        // 생성된 예약 정보를 populate해서 반환
        const populatedRoom = await Room.findById(roomId)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title');

        const createdReservation = populatedRoom.reservations[populatedRoom.reservations.length - 1];

        res.status(201).json(createdReservation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 생성 실패' });
    }
});

// 예약 수정
app.put('/rooms/:roomId/reservations/:reservationId', async (req, res) => {
    const { roomId, reservationId } = req.params;
    const {
        meetingName,
        meetingDescription,
        startTime,
        endTime,
        participants,
        project
    } = req.body;

    try {
        // 필수 필드 검증
        if (!meetingName || !startTime || !endTime || !participants || participants.length === 0) {
            return res.status(400).json({
                message: '회의 제목, 시작 시간, 종료 시간, 참여인원(최소 1명)은 필수입니다.'
            });
        }

        // 시간 유효성 검증
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            return res.status(400).json({
                message: '종료 시간은 시작 시간보다 나중이어야 합니다.'
            });
        }

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        const reservationIndex = room.reservations.findIndex(
            r => r._id.toString() === reservationId
        );

        if (reservationIndex === -1) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        // 시간 충돌 확인 (자기 자신 제외)
        const conflictingReservation = room.reservations.find((reservation, index) => {
            if (index === reservationIndex || reservation.status === '취소됨') return false;

            const existingStart = new Date(reservation.startTime);
            const existingEnd = new Date(reservation.endTime);

            // 시간 충돌 조건: 새 예약의 시작이 기존 예약 끝나기 전이고, 새 예약의 끝이 기존 예약 시작 후인 경우
            return (start < existingEnd && end > existingStart);
        });

        if (conflictingReservation) {
            const conflictStart = new Date(conflictingReservation.startTime);
            const conflictEnd = new Date(conflictingReservation.endTime);

            const formatTime = (date) => {
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            };

            const formatDate = (date) => {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            };

            return res.status(400).json({
                message: `예약 시간이 겹칩니다.\n기존 예약: "${conflictingReservation.meetingName}"\n시간: ${formatDate(conflictStart)} ${formatTime(conflictStart)} - ${formatTime(conflictEnd)}\n\n다른 시간을 선택해주세요.`,
                conflictingReservation: {
                    meetingName: conflictingReservation.meetingName,
                    startTime: conflictingReservation.startTime,
                    endTime: conflictingReservation.endTime,
                    status: conflictingReservation.status
                }
            });
        }

        // 예약 정보 업데이트
        room.reservations[reservationIndex] = {
            ...room.reservations[reservationIndex],
            participants: participants.map(userId => ({ userId })),
            meetingName,
            meetingDescription: meetingDescription || '',
            startTime: start,
            endTime: end,
            project: project || null
        };

        await room.save();

        // 업데이트된 예약 정보를 populate해서 반환
        const populatedRoom = await Room.findById(roomId)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title');

        const updatedReservation = populatedRoom.reservations[reservationIndex];

        res.status(200).json(updatedReservation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 수정 실패' });
    }
});

// 예약 삭제 (상태를 '취소됨'으로 변경)
app.delete('/rooms/:roomId/reservations/:reservationId', async (req, res) => {
    const { roomId, reservationId } = req.params;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        const reservation = room.reservations.find(
            r => r._id.toString() === reservationId
        );

        if (!reservation) {
            return res.status(404).json({ message: '예약을 찾을 수 없습니다.' });
        }

        // 예약 상태를 '취소됨'으로 변경
        reservation.status = '취소됨';
        await room.save();

        res.status(200).json({ message: '예약이 취소되었습니다.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 취소 실패' });
    }
});

// 특정 회의실의 예약 목록 조회
app.get('/rooms/:roomId/reservations', async (req, res) => {
    const { roomId } = req.params;
    const { date } = req.query; // YYYY-MM-DD 형식

    try {
        const room = await Room.findById(roomId)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title');

        if (!room) {
            return res.status(404).json({ message: '회의실을 찾을 수 없습니다.' });
        }

        let reservations = room.reservations.filter(r => r.status !== '취소됨');

        // 날짜 필터링 (옵션)
        if (date) {
            const targetDate = new Date(date);
            reservations = reservations.filter(reservation => {
                const startDate = new Date(reservation.startTime);
                return startDate.toDateString() === targetDate.toDateString();
            });
        }

        res.status(200).json(reservations);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 목록 조회 실패' });
    }
});

// 스태프 추가 API
app.post('/add-staff', async (req, res) => {
    const { name, email, phone, roles, department } = req.body;
    try {
        const newStaff = new User({
            name,
            email,
            phone,
            roles,
            department,
            userType: 'external'
        });
        await newStaff.save();
        res.status(200).json({ message: '스태프 추가 성공', staff: newStaff });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '스태프 추가 실패' });
    }
})

app.post('/modify-staff', async (req, res) => {
    const { staffId, name, email, phone, roles, department } = req.body;
    try {
        const updatedStaff = await User.findByIdAndUpdate(staffId, { name, email, phone, roles, department }, { new: true });
        res.status(200).json({ message: '스태프 수정 성공', staff: updatedStaff });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '스태프 수정 실패' });
    }
})

app.post('/delete-staff', async (req, res) => {
    const { staffId } = req.body;
    try {
        const user = await User.findById(staffId);
        if (!user) {
            return res.status(404).json({ message: '스태프를 찾을 수 없습니다.' });
        }
        user.status = 'deleted';
        await user.save();
        res.status(200).json({ message: '스태프 삭제 성공' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '스태프 삭제 실패' });
    }
})

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