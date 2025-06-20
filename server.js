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
const cron = require('node-cron')

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
const CreditCard = require('./models/CreditCard')

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


// 회의실 예약 정리 스케줄러 (매일 자정 실행)
cron.schedule('0 0 * * *', async () => {
    try {
        console.log(`\x1b[33m[${new Date().toLocaleString()}] 데이터 정리 스케줄러 시작\x1b[0m`);

        // 7일 전 날짜 계산
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. 회의실 예약 정리
        console.log(`\x1b[34m[회의실 예약 정리 시작]\x1b[0m`);
        const rooms = await Room.find({});
        let totalDeletedReservations = 0;

        for (const room of rooms) {
            // 7일 이상 경과한 예약 필터링
            const reservationsToDelete = room.reservations.filter(reservation => {
                const endTime = new Date(reservation.endTime);
                return endTime < sevenDaysAgo;
            });

            if (reservationsToDelete.length > 0) {
                // 7일 이상 경과한 예약들을 제거
                room.reservations = room.reservations.filter(reservation => {
                    const endTime = new Date(reservation.endTime);
                    return endTime >= sevenDaysAgo;
                });

                await room.save();
                totalDeletedReservations += reservationsToDelete.length;

                console.log(`\x1b[36m회의실 "${room.roomName}": ${reservationsToDelete.length}개 예약 삭제\x1b[0m`);
            }
        }

        console.log(`\x1b[32m회의실 예약 정리 완료 - 총 ${totalDeletedReservations}개 예약 삭제\x1b[0m`);

        // 2. SlackCode 정리
        console.log(`\x1b[34m[SlackCode 정리 시작]\x1b[0m`);
        const deleteResult = await SlackCode.deleteMany({
            createdAt: { $lt: sevenDaysAgo }
        });

        console.log(`\x1b[32mSlackCode 정리 완료 - 총 ${deleteResult.deletedCount}개 인증코드 삭제\x1b[0m`);

        console.log(`\x1b[32m[${new Date().toLocaleString()}] 데이터 정리 스케줄러 완료 - 예약 ${totalDeletedReservations}개, 인증코드 ${deleteResult.deletedCount}개 삭제\x1b[0m`);

    } catch (error) {
        console.error(`\x1b[31m[${new Date().toLocaleString()}] 데이터 정리 중 오류:`, error, '\x1b[0m');
    }
}, {
    timezone: "Asia/Seoul"
});

// 자동 퇴근 처리 스케줄러 (매 10분마다 실행)
cron.schedule('*/10 * * * *', async () => {
    try {
        const now = new Date();
        console.log(`\x1b[33m[${now.toLocaleString()}] 자동 퇴근 처리 스케줄러 시작\x1b[0m`);

        // 모든 활성 사용자 조회 (slackId 유무와 관계없이)
        const users = await User.find({
            status: 'active'
        }).select('_id name slackId attendance');

        let notificationsSent = 0;
        let autoCheckoutsProcessed = 0;

        for (const user of users) {
            if (!user.attendance || user.attendance.length === 0) continue;

            // 출석 기록을 시간 순으로 정렬 (최신순)
            const sortedAttendance = user.attendance.sort((a, b) => new Date(b.time) - new Date(a.time));
            const lastRecord = sortedAttendance[0];

            // 가장 최근 기록이 체크인인 경우만 처리
            if (lastRecord && lastRecord.type === 'checkIn') {
                const checkInTime = new Date(lastRecord.time);
                const elapsedHours = (now - checkInTime) / (1000 * 60 * 60); // 시간 단위
                const elapsedMinutes = (now - checkInTime) / (1000 * 60); // 분 단위

                // 12시간 경과 시 자동 퇴근 처리 (모든 사용자 대상)
                if (elapsedHours >= 12) {
                    console.log(`\x1b[31m자동 퇴근 처리 대상: ${user.name} (경과시간: ${elapsedHours.toFixed(1)}시간)\x1b[0m`);

                    // 자동 퇴근 기록 추가
                    const autoCheckoutRecord = {
                        type: 'checkOut',
                        time: now,
                        date: now.toISOString().split('T')[0],
                        method: 'auto_checkout'
                    };

                    user.attendance.push(autoCheckoutRecord);
                    await user.save();

                    // 자동 퇴근 처리 슬랙 알림 (slackId가 있는 경우만)
                    if (user.slackId) {
                        try {
                            const workHours = Math.floor(elapsedMinutes / 60);
                            const workMinutes = Math.floor(elapsedMinutes % 60);

                            await slackBot.chat.postMessage({
                                channel: user.slackId,
                                text: `🏢 **자동 퇴근 처리되었습니다**\n\n출근 시간: ${checkInTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}\n퇴근 시간: ${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}\n근무 시간: ${workHours}시간 ${workMinutes}분\n\n다음부터는 퇴근 시 꼭 퇴근 버튼을 눌러주세요! 😊`
                            });
                            console.log(`\x1b[32m자동 퇴근 알림 전송 성공: ${user.name}\x1b[0m`);
                        } catch (slackError) {
                            console.error(`\x1b[31m자동 퇴근 알림 전송 실패 - ${user.name}:`, slackError, '\x1b[0m');
                        }
                    } else {
                        console.log(`\x1b[33m자동 퇴근 처리 완료 (슬랙 알림 없음): ${user.name}\x1b[0m`);
                    }

                    autoCheckoutsProcessed++;
                }
                // 퇴근 예정 알림 (60분, 30분, 20분, 10분 전) - slackId가 있는 경우만
                else if (elapsedHours >= 11 && user.slackId) {
                    const remainingMinutes = 12 * 60 - elapsedMinutes; // 자동 퇴근까지 남은 분

                    // 알림 시점들 (60, 30, 20, 10분 전)
                    const notificationPoints = [60, 30, 20, 10];

                    for (const notificationMinutes of notificationPoints) {
                        // 알림 시점에 근접한지 확인 (±5분 오차 허용)
                        if (Math.abs(remainingMinutes - notificationMinutes) <= 5) {
                            console.log(`\x1b[36m퇴근 알림 대상: ${user.name} (${notificationMinutes}분 전 알림)\x1b[0m`);

                            try {
                                await slackBot.chat.postMessage({
                                    channel: user.slackId,
                                    text: `⏰ **퇴근 버튼을 누르는 것을 잊지는 않으셨나요?**\n\n현재 근무 시간: ${Math.floor(elapsedHours)}시간 ${Math.floor(elapsedMinutes % 60)}분\n\n${notificationMinutes}분 후에 자동 퇴근 처리됩니다.\n퇴근 시에는 꼭 퇴근 버튼을 눌러주세요! 🚪`
                                });
                                console.log(`\x1b[32m퇴근 예정 알림 전송 성공: ${user.name} (${notificationMinutes}분 전)\x1b[0m`);
                                notificationsSent++;
                            } catch (slackError) {
                                console.error(`\x1b[31m퇴근 예정 알림 전송 실패 - ${user.name}:`, slackError, '\x1b[0m');
                            }

                            break; // 한 번만 알림 보내기
                        }
                    }
                }
                // 슬랙ID가 없는 사용자의 경우 알림 없이 로그만 출력
                else if (elapsedHours >= 11 && !user.slackId) {
                    const remainingMinutes = 12 * 60 - elapsedMinutes;
                    const notificationPoints = [60, 30, 20, 10];

                    for (const notificationMinutes of notificationPoints) {
                        if (Math.abs(remainingMinutes - notificationMinutes) <= 5) {
                            console.log(`\x1b[33m퇴근 예정 (슬랙 알림 없음): ${user.name} (${notificationMinutes}분 전)\x1b[0m`);
                            break;
                        }
                    }
                }
            }
        }

        if (notificationsSent > 0 || autoCheckoutsProcessed > 0) {
            console.log(`\x1b[32m[${now.toLocaleString()}] 자동 퇴근 스케줄러 완료 - 알림 ${notificationsSent}건, 자동 퇴근 ${autoCheckoutsProcessed}건 처리\x1b[0m`);
        }

    } catch (error) {
        console.error(`\x1b[31m[${new Date().toLocaleString()}] 자동 퇴근 처리 중 오류:`, error, '\x1b[0m');
    }
}, {
    timezone: "Asia/Seoul"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 업로드된, 실제 이미지 서빙을 위한 정적 파일 경로 설정
app.use('/uploads', express.static('uploads'));

// ----------------------------------------------------------
// Multer 설정
// ----------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/product/');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000); // 6자리 랜덤 숫자로 변경
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}-${randomNum}${ext}`);
    }
});

// uploads 디렉토리 확인 및 생성
const uploadDir = './uploads/product';
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB 제한
});


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
        } else if (userType === 'all-deleted') {
            const userList = await User.find({ status: 'deleted' }).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'internal') {
            const userList = await User.find({ userType: 'internal', status: { $ne: 'deleted' } }).select('-password');
            res.status(200).json(userList);
        } else if (userType === 'external') {
            const userList = await User.find({ userType: 'external', status: { $ne: 'deleted' } }).select('-password');
            res.status(200).json(userList);
        } else {
            res.status(400).json({ message: '잘못된 userType 파라미터입니다.' });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '사용자 목록 조회 실패' });
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
        if (user.status === 'deleted' || user.status === 'inactive') {
            res.status(401).json({ message: '삭제 또는 비활성 계정입니다. 관리자에게 문의해주세요.' });
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

// 사용자 정보 업데이트 API (관리자용)
app.put('/admin/update-user/:userId', async (req, res) => {
    const { userId } = req.params;
    const { status, userType, roles, hireYear, department, adminMemo } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 업데이트할 데이터 준비
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (userType !== undefined) updateData.userType = userType;
        if (roles !== undefined) updateData.roles = roles;
        if (hireYear !== undefined) updateData.hireYear = hireYear;
        if (department !== undefined) updateData.department = department;
        if (adminMemo !== undefined) updateData.adminMemo = adminMemo;

        console.log(`유저 업데이트 요청 - ID: ${userId}, 업데이트 데이터:`, updateData);

        // 사용자 정보 업데이트
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        console.log(`유저 업데이트 완료 - ID: ${userId}, 새 상태: ${updatedUser.status}`);

        res.status(200).json({
            message: '사용자 정보가 업데이트되었습니다.',
            user: updatedUser
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '사용자 정보 업데이트 중 오류가 발생했습니다.' });
    }
})

// 사용자 삭제 API (관리자용) - status를 deleted로 변경
app.delete('/admin/delete-user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // status를 'deleted'로 변경 (실제 삭제가 아닌 논리적 삭제)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { status: 'deleted' },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: '사용자가 삭제되었습니다.',
            user: updatedUser
        });
    } catch (err) {
        console.error('사용자 삭제 실패:', err);
        res.status(500).json({ message: '사용자 삭제에 실패했습니다.' });
    }
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: '존재하지 않는 이메일입니다.' });
        }

        const slackId = user.slackId;
        if (!slackId) {
            return res.status(404).json({ message: '슬랙 ID가 없습니다.' });
        }

        const code = Math.floor(100000 + Math.random() * 900000);

        await slackBot.chat.postMessage({
            channel: slackId,
            text: `🔐 AEDIA 임시 비밀번호: [${code}]입니다.`
        });
        user.password = code;
        await user.save();

        res.status(200).json({ message: '임시 비밀번호가 발송되었습니다.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '임시 비밀번호 발송 중 오류가 발생했습니다.' });
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

// 사용자 프로필 업데이트 API
app.put('/update-user-profile', async (req, res) => {
    const { userId } = req.query;
    const {
        name,
        email,
        phone,
        address,
        emergencyContact,
        department,
        bio,
        roles,
        avatar
    } = req.body;

    try {
        // 이메일 중복 체크 (다른 사용자가 같은 이메일 사용하는지)
        if (email) {
            const existingUser = await User.findOne({
                email: email,
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: '이미 사용중인 이메일입니다.'
                });
            }
        }

        // 아바타가 변경되었고 기존 아바타가 로컬 파일인 경우 삭제
        if (avatar) {
            const existingUser = await User.findById(userId);
            if (existingUser && existingUser.avatar &&
                existingUser.avatar !== avatar &&
                !existingUser.avatar.startsWith('http')) {

                const oldFilePath = path.join('./uploads/product/', existingUser.avatar);

                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log('기존 아바타 파일 삭제:', existingUser.avatar);
                    }
                } catch (fileError) {
                    console.error('기존 아바타 파일 삭제 실패:', fileError);
                    // 파일 삭제 실패해도 프로필 업데이트는 계속 진행
                }
            }
        }

        const updateData = {};

        // 제공된 필드만 업데이트
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
        if (department !== undefined) updateData.department = department;
        if (bio !== undefined) updateData.bio = bio;
        if (roles !== undefined) updateData.roles = roles;
        if (avatar !== undefined) updateData.avatar = avatar;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.status(200).json({
            message: '프로필이 성공적으로 업데이트되었습니다.',
            user: updatedUser
        });

    } catch (err) {
        console.error('프로필 업데이트 실패:', err);
        res.status(500).json({ message: '프로필 업데이트 중 오류가 발생했습니다.' });
    }
});

// 비밀번호 변경 API
app.put('/change-password', async (req, res) => {
    const { userId } = req.query;
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 현재 비밀번호 확인
        if (user.password !== currentPassword) {
            return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
        }

        // 새 비밀번호로 업데이트
        await User.findByIdAndUpdate(userId, { password: newPassword });

        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (err) {
        console.error('비밀번호 변경 실패:', err);
        res.status(500).json({ message: '비밀번호 변경 중 오류가 발생했습니다.' });
    }
});

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
            id, {
            text,
            dueDate,
            dueTime: dueTime || null,
            projectId: projectId || null,
            updatedAt: new Date()
        }, { new: true }
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
            id, {
            completed: !todo.completed,
            updatedAt: new Date()
        }, { new: true }
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
            userId, { mainLayout: layouts }, { new: true }
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
            id, {
            roomName,
            location: location || '',
            tools: tools || []
        }, { new: true }
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

// 스태프 삭제 API (관리자용) - status를 deleted로 변경
app.delete('/admin/delete-staff/:staffId', async (req, res) => {
    const { staffId } = req.params;

    try {
        const staff = await User.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: '스태프를 찾을 수 없습니다.' });
        }

        if (staff.userType !== 'external') {
            return res.status(400).json({ message: '외부 스태프만 삭제할 수 있습니다.' });
        }

        // status를 'deleted'로 변경 (실제 삭제가 아닌 논리적 삭제)
        const updatedStaff = await User.findByIdAndUpdate(
            staffId,
            { status: 'deleted' },
            { new: true }
        ).select('-password');

        res.status(200).json({
            message: '스태프가 삭제되었습니다.',
            staff: updatedStaff
        });
    } catch (err) {
        console.error('스태프 삭제 실패:', err);
        res.status(500).json({ message: '스태프 삭제에 실패했습니다.' });
    }
});

// 프로젝트 관련 API

// 썸네일 업로드 API
app.post('/upload-thumbnail', upload.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
        }

        console.log('썸네일 업로드 요청:', req.file.filename);

        // 파일 경로 및 새 파일명 생성
        const originalPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname);
        const timestamp = Date.now();
        const newFilename = `project_thumbnail_${timestamp}${fileExtension}`;
        const newPath = path.join('./uploads/product/', newFilename);

        // 이미지 리사이징 및 최적화 (선택적)
        if (req.file.mimetype.startsWith('image/')) {
            await sharp(originalPath)
                .resize(800, 600, {
                    fit: 'cover',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toFile(newPath);

            // 원본 파일 삭제
            fs.unlinkSync(originalPath);
        } else {
            // 이미지가 아닌 경우 그대로 이동
            fs.renameSync(originalPath, newPath);
        }

        res.status(200).json({
            message: '썸네일 업로드 성공',
            filename: newFilename
        });
    } catch (err) {
        console.error('썸네일 업로드 실패:', err);
        res.status(500).json({ message: '썸네일 업로드 실패' });
    }
});

// 프로필 사진 업로드 API
app.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
        }

        console.log('프로필 사진 업로드 요청:', req.file.filename);

        // 파일 경로 및 새 파일명 생성
        const originalPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname);
        const timestamp = Date.now();
        const newFilename = `avatar_${timestamp}${fileExtension}`;
        const newPath = path.join('./uploads/product/', newFilename);

        // 이미지 리사이징 및 최적화 (프로필 사진은 정사각형으로)
        if (req.file.mimetype.startsWith('image/')) {
            await sharp(originalPath)
                .resize(400, 400, {
                    fit: 'cover',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85 })
                .toFile(newPath);

            // 원본 파일 삭제
            fs.unlinkSync(originalPath);
        } else {
            // 이미지가 아닌 경우 그대로 이동
            fs.renameSync(originalPath, newPath);
        }

        res.status(200).json({
            message: '프로필 사진 업로드 성공',
            filename: newFilename
        });
    } catch (err) {
        console.error('프로필 사진 업로드 실패:', err);
        res.status(500).json({ message: '프로필 사진 업로드 실패' });
    }
});

// 프로젝트 생성 API
app.post('/add-project', async (req, res) => {
    const { title, description, status, deadline, thumbnail, staffList, team, tasks } = req.body;

    try {
        // 필수 필드 검증
        if (!title || !description || !deadline) {
            return res.status(400).json({
                message: '프로젝트명, 설명, 마감일은 필수 입력사항입니다.'
            });
        }

        // 마감일 유효성 검증
        const deadlineDate = new Date(deadline);
        if (deadlineDate < new Date()) {
            return res.status(400).json({
                message: '마감일은 현재 날짜보다 이후여야 합니다.'
            });
        }

        console.log('프로젝트 생성 요청:', { title, status, deadline, staffListLength: staffList?.length });

        const newProject = new Project({
            title: title.trim(),
            description: description.trim(),
            status: status || 'concept',
            deadline: deadlineDate,
            thumbnail: thumbnail || 'default_thumbnail.jpeg',
            progress: 0,
            staffList: staffList || [],
            team: team || []
        });

        await newProject.save();

        // populate해서 반환
        const populatedProject = await Project.findById(newProject._id)
            .populate('team', 'name email department')
            .populate('staffList.members.userId', 'name email department');

        console.log('프로젝트 생성 성공:', populatedProject._id);

        // 팀원들에게 슬랙 알림 보내기
        if (team && team.length > 0) {
            try {
                // 팀원들의 정보 조회
                const teamMembers = await User.find({
                    _id: { $in: team }
                }).select('name slackId');

                console.log('새 프로젝트 팀원들:', teamMembers);

                // 각 팀원에게 슬랙 알림 발송
                for (const member of teamMembers) {
                    if (member.slackId) {
                        try {
                            await slackBot.chat.postMessage({
                                channel: member.slackId,
                                text: `🎬 **${title}** 프로젝트에 초대되었습니다.\n\n프로젝트 상태: ${status || 'concept'}\n마감일: ${deadlineDate.toLocaleDateString('ko-KR')}\n\n새로운 프로젝트가 시작되었습니다! 프로젝트에 대한 자세한 정보는 AEDIA 시스템에서 확인하실 수 있습니다.`
                            });
                            console.log(`새 프로젝트 슬랙 알림 전송 성공: ${member.name} (${member.slackId})`);
                        } catch (slackError) {
                            console.error(`새 프로젝트 슬랙 알림 전송 실패 - ${member.name}:`, slackError);
                            // 슬랙 전송 실패해도 프로젝트 생성은 계속 진행
                        }
                    } else {
                        console.log(`슬랙 ID가 없는 사용자: ${member.name}`);
                    }
                }
            } catch (memberError) {
                console.error('팀원 정보 조회 실패:', memberError);
            }
        }

        res.status(200).json({
            message: '프로젝트가 성공적으로 생성되었습니다.',
            project: populatedProject
        });
    } catch (err) {
        console.error('프로젝트 생성 실패:', err);
        res.status(500).json({ message: '프로젝트 생성 실패' });
    }
});

// 프로젝트 목록 조회 API
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find({})
            .populate('team', 'name email department')
            .populate('staffList.members.userId', 'name email department')
            .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (err) {
        console.error('프로젝트 목록 조회 실패:', err);
        res.status(500).json({ message: '프로젝트 목록 조회 실패' });
    }
});

// 특정 프로젝트 조회 API
app.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('team', 'name email department')
            .populate('staffList.members.userId', 'name email department');

        if (!project) {
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }

        res.status(200).json(project);
    } catch (err) {
        console.error('프로젝트 조회 실패:', err);
        res.status(500).json({ message: '프로젝트 조회 실패' });
    }
});

// 프로젝트 수정 API
app.put('/projects/:id', async (req, res) => {
    try {
        const { title, description, status, deadline, thumbnail, progress, team, staffList } = req.body;

        // 기존 프로젝트 조회 (썸네일 파일 삭제용 및 팀원 비교용)
        const existingProject = await Project.findById(req.params.id)
            .populate('team', 'name email slackId');
        if (!existingProject) {
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }

        // 썸네일이 변경되었고 기존 썸네일이 로컬 파일인 경우 삭제
        if (thumbnail && thumbnail !== existingProject.thumbnail) {
            const oldThumbnail = existingProject.thumbnail;
            // 기존 썸네일이 기본 썸네일이 아니고, 로컬 파일명인 경우 삭제
            if (oldThumbnail &&
                oldThumbnail !== 'default_thumbnail.jpeg' &&
                !oldThumbnail.startsWith('http')) {

                const oldFilePath = path.join('./uploads/product/', oldThumbnail);

                try {
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                        console.log('기존 썸네일 파일 삭제:', oldThumbnail);
                    }
                } catch (fileError) {
                    console.error('기존 썸네일 파일 삭제 실패:', fileError);
                    // 파일 삭제 실패해도 프로젝트 업데이트는 계속 진행
                }
            }
        }

        const updateData = {
            title,
            description,
            status,
            deadline,
            thumbnail,
            progress
        };

        // 상태 변경 감지 및 알림
        const statusChanged = status && status !== existingProject.status;
        if (statusChanged) {
            console.log(`프로젝트 상태 변경 감지: ${existingProject.status} -> ${status}`);
        }

        // team과 staffList는 제공된 경우에만 업데이트
        if (team !== undefined) {
            updateData.team = team;

            // 새로 추가된 팀원 찾기
            const existingTeamIds = existingProject.team.map(member =>
                typeof member === 'object' ? member._id.toString() : member.toString()
            );

            const newTeamIds = team.filter(newMemberId => {
                const memberIdStr = typeof newMemberId === 'object' ? newMemberId._id || newMemberId.id : newMemberId;
                return !existingTeamIds.includes(memberIdStr.toString());
            });

            console.log('기존 팀원 IDs:', existingTeamIds);
            console.log('새로운 팀원 IDs:', newTeamIds);

            // 새로 추가된 팀원들에게 슬랙 알림 보내기
            if (newTeamIds.length > 0) {
                try {
                    // 새로 추가된 팀원들의 정보 조회
                    const newMembers = await User.find({
                        _id: { $in: newTeamIds }
                    }).select('name slackId');

                    console.log('새로 추가된 팀원들:', newMembers);

                    // 각 새 팀원에게 슬랙 알림 발송
                    for (const member of newMembers) {
                        if (member.slackId) {
                            try {
                                await slackBot.chat.postMessage({
                                    channel: member.slackId,
                                    text: `🎬 **${title}** 프로젝트에 초대되었습니다.\n\n프로젝트 상태: ${status}\n마감일: ${new Date(deadline).toLocaleDateString('ko-KR')}\n\n프로젝트에 대한 자세한 정보는 AEDIA 시스템에서 확인하실 수 있습니다.`
                                });
                                console.log(`슬랙 알림 전송 성공: ${member.name} (${member.slackId})`);
                            } catch (slackError) {
                                console.error(`슬랙 알림 전송 실패 - ${member.name}:`, slackError);
                                // 슬랙 전송 실패해도 프로젝트 업데이트는 계속 진행
                            }
                        } else {
                            console.log(`슬랙 ID가 없는 사용자: ${member.name}`);
                        }
                    }
                } catch (memberError) {
                    console.error('새 팀원 정보 조회 실패:', memberError);
                }
            }
        }
        if (staffList !== undefined) {
            updateData.staffList = staffList;
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true }
        )
            .populate('team', 'name email department position')
            .populate('staffList.members.userId', 'name email department');

        // 프로젝트 상태 변경 시 모든 팀원에게 알림
        if (statusChanged) {
            try {
                // 현재 팀원 목록 조회 (업데이트된 프로젝트 기준)
                const currentTeam = await User.find({
                    _id: { $in: updatedProject.team.map(member => member._id || member) }
                }).select('name slackId');

                console.log('상태 변경 알림 대상 팀원들:', currentTeam.map(m => m.name));

                // 상태 한글화 함수
                const getStatusText = (status) => {
                    switch (status) {
                        case 'concept': return 'Concept';
                        case 'development': return 'Development';
                        case 'pre_production': return 'Pre-Production';
                        case 'production': return 'Production';
                        case 'post_production': return 'Post-Production';
                        case 'vfx': return 'VFX/CG';
                        case 'sound_design': return 'Sound Design';
                        case 'quality_check': return 'Quality Check';
                        case 'delivery': return 'Delivery';
                        default: return status;
                    }
                };

                const oldStatusText = getStatusText(existingProject.status);
                const newStatusText = getStatusText(status);

                // 각 팀원에게 상태 변경 알림 발송
                for (const member of currentTeam) {
                    if (member.slackId) {
                        try {
                            await slackBot.chat.postMessage({
                                channel: member.slackId,
                                text: `📋 **${title}** 프로젝트의 상태가 **${newStatusText}**으로 변경되었습니다.\n\n이전 상태: ${oldStatusText}\n현재 상태: ${newStatusText}\n진행률: ${progress}%\n마감일: ${new Date(deadline).toLocaleDateString('ko-KR')}\n\n프로젝트 상태가 업데이트되었습니다. AEDIA 시스템에서 자세한 내용을 확인해주세요! 🚀`
                            });
                            console.log(`상태 변경 알림 전송 성공: ${member.name} (${member.slackId})`);
                        } catch (slackError) {
                            console.error(`상태 변경 알림 전송 실패 - ${member.name}:`, slackError);
                        }
                    } else {
                        console.log(`상태 변경 알림 대상이지만 슬랙 ID가 없는 사용자: ${member.name}`);
                    }
                }
            } catch (statusNotificationError) {
                console.error('상태 변경 알림 처리 중 오류:', statusNotificationError);
            }
        }

        res.status(200).json({
            message: '프로젝트가 성공적으로 수정되었습니다.',
            project: updatedProject
        });
    } catch (err) {
        console.error('프로젝트 수정 실패:', err);
        res.status(500).json({ message: '프로젝트 수정 실패' });
    }
});

// 프로젝트 삭제 API
app.delete('/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // 프로젝트 존재 확인
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }

        // 관련된 캘린더 연동 정보도 함께 삭제 (cascade)
        const deletedCalendarLinks = await Calendar.deleteMany({ projectId: projectId });
        console.log(`프로젝트 삭제와 함께 캘린더 연동 ${deletedCalendarLinks.deletedCount}개 삭제됨`);

        // 프로젝트 삭제
        const deletedProject = await Project.findByIdAndDelete(projectId);

        res.status(200).json({
            message: '프로젝트가 성공적으로 삭제되었습니다.',
            deletedCalendarLinks: deletedCalendarLinks.deletedCount
        });
    } catch (err) {
        console.error('프로젝트 삭제 실패:', err);
        res.status(500).json({ message: '프로젝트 삭제 실패' });
    }
});

// 캘린더 관련 API

// 캘린더 연동 정보 조회
app.get('/calendar/links', async (req, res) => {
    try {
        const links = await Calendar.find({})
            .populate({
                path: 'projectId',
                select: 'title description status progress thumbnail deadline team staffList',
                populate: [
                    {
                        path: 'team',
                        select: 'name email department userType'
                    },
                    {
                        path: 'staffList.members.userId',
                        select: 'name email department userType'
                    }
                ]
            })
            .sort({ createdAt: -1 });

        // null 참조된 프로젝트 필터링 및 정리
        const validLinks = []
        const invalidLinkIds = []

        for (const link of links) {
            if (!link.projectId) {
                // 프로젝트가 삭제되어 null인 경우
                invalidLinkIds.push(link._id)
                console.log(`무효한 캘린더 연동 발견 (삭제된 프로젝트): ${link.linkId}`)
                continue
            }

            // team 배열에서 null 참조 제거
            if (link.projectId.team) {
                link.projectId.team = link.projectId.team.filter(member => member !== null)
            }

            // staffList에서 null 참조 제거
            if (link.projectId.staffList) {
                link.projectId.staffList = link.projectId.staffList.map(role => ({
                    ...role,
                    members: role.members ? role.members.filter(member =>
                        member && member.userId !== null
                    ) : []
                }))
            }

            validLinks.push(link)
        }

        // 무효한 연동 정보 자동 삭제
        if (invalidLinkIds.length > 0) {
            await Calendar.deleteMany({ _id: { $in: invalidLinkIds } })
            console.log(`무효한 캘린더 연동 ${invalidLinkIds.length}개 자동 삭제됨`)
        }

        res.status(200).json(validLinks);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '캘린더 연동 정보 조회 실패' });
    }
});

// 캘린더 이벤트와 프로젝트 연동
app.post('/calendar/link', async (req, res) => {
    const { linkId, projectId } = req.body;

    try {
        // 필수 필드 검증
        if (!linkId || !projectId) {
            return res.status(400).json({
                message: '캘린더 이벤트 ID와 프로젝트 ID는 필수입니다.'
            });
        }

        // 프로젝트 존재 여부 확인
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }

        // 기존 연동이 있으면 삭제
        await Calendar.deleteMany({ linkId: linkId });

        // 새 연동 생성
        const newLink = new Calendar({
            linkId,
            projectId
        });

        await newLink.save();

        // populate해서 반환
        const populatedLink = await Calendar.findById(newLink._id)
            .populate({
                path: 'projectId',
                select: 'title description status progress thumbnail deadline team staffList',
                populate: [
                    {
                        path: 'team',
                        select: 'name email department userType'
                    },
                    {
                        path: 'staffList.members.userId',
                        select: 'name email department userType'
                    }
                ]
            });

        res.status(201).json({
            message: '캘린더 이벤트와 프로젝트가 연동되었습니다.',
            link: populatedLink
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '캘린더 연동 생성 실패' });
    }
});

// 캘린더 연동 해제
app.delete('/calendar/link/:linkId', async (req, res) => {
    const { linkId } = req.params;

    try {
        const deletedLink = await Calendar.findOneAndDelete({ linkId: linkId });

        if (!deletedLink) {
            return res.status(404).json({ message: '연동 정보를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '캘린더 연동이 해제되었습니다.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '캘린더 연동 해제 실패' });
    }
});

// 특정 캘린더 이벤트의 연동 프로젝트 조회
app.get('/calendar/link/:linkId', async (req, res) => {
    const { linkId } = req.params;

    try {
        const link = await Calendar.findOne({ linkId: linkId })
            .populate({
                path: 'projectId',
                select: 'title description status progress thumbnail deadline team staffList',
                populate: [
                    {
                        path: 'team',
                        select: 'name email department userType'
                    },
                    {
                        path: 'staffList.members.userId',
                        select: 'name email department userType'
                    }
                ]
            });

        if (!link) {
            return res.status(404).json({ message: '연동된 프로젝트가 없습니다.' });
        }

        // 프로젝트가 삭제되어 null인 경우 처리
        if (!link.projectId) {
            // 무효한 연동 정보 삭제
            await Calendar.findByIdAndDelete(link._id)
            console.log(`무효한 캘린더 연동 삭제됨 (삭제된 프로젝트): ${linkId}`)
            return res.status(404).json({ message: '연동된 프로젝트가 삭제되었습니다.' });
        }

        // team 배열에서 null 참조 제거
        if (link.projectId.team) {
            link.projectId.team = link.projectId.team.filter(member => member !== null)
        }

        // staffList에서 null 참조 제거
        if (link.projectId.staffList) {
            link.projectId.staffList = link.projectId.staffList.map(role => ({
                ...role,
                members: role.members ? role.members.filter(member =>
                    member && member.userId !== null
                ) : []
            }))
        }

        res.status(200).json(link);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '연동 프로젝트 조회 실패' });
    }
});

// 일괄 연동 생성 (여러 이벤트를 한 번에 연동)
app.post('/calendar/links/batch', async (req, res) => {
    const { links } = req.body; // [{ linkId, projectId }, ...]

    try {
        if (!Array.isArray(links) || links.length === 0) {
            return res.status(400).json({
                message: '연동할 링크 정보가 필요합니다.'
            });
        }

        const results = [];
        const errors = [];

        for (const linkData of links) {
            try {
                const { linkId, projectId } = linkData;

                // 프로젝트 존재 여부 확인
                const project = await Project.findById(projectId);
                if (!project) {
                    errors.push({ linkId, error: '프로젝트를 찾을 수 없습니다.' });
                    continue;
                }

                // 기존 연동이 있으면 삭제
                await Calendar.deleteMany({ linkId: linkId });

                // 새 연동 생성
                const newLink = new Calendar({
                    linkId,
                    projectId
                });

                await newLink.save();
                results.push({ linkId, projectId, status: 'success' });

            } catch (error) {
                errors.push({ linkId: linkData.linkId, error: error.message });
            }
        }

        res.status(200).json({
            message: `${results.length}개 연동 완료, ${errors.length}개 실패`,
            results,
            errors
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '일괄 캘린더 연동 실패' });
    }
});

// 외부 스태프 정보 업데이트 API (관리자용)
app.put('/admin/update-staff/:staffId', async (req, res) => {
    const { staffId } = req.params;
    const { department, roles, snsId, adminMemo, status } = req.body;

    try {
        const staff = await User.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: '스태프를 찾을 수 없습니다.' });
        }

        if (staff.userType !== 'external') {
            return res.status(400).json({ message: '외부 스태프만 이 API를 통해 업데이트할 수 있습니다.' });
        }

        // 업데이트할 데이터 준비
        const updateData = {};
        if (department !== undefined) updateData.department = department;
        if (roles !== undefined) updateData.roles = roles;
        if (snsId !== undefined) updateData.snsId = snsId;
        if (adminMemo !== undefined) updateData.adminMemo = adminMemo;
        if (status !== undefined) updateData.status = status;

        console.log(`스태프 업데이트 요청 - ID: ${staffId}, 업데이트 데이터:`, updateData);

        // 스태프 정보 업데이트
        const updatedStaff = await User.findByIdAndUpdate(
            staffId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({ message: '스태프를 찾을 수 없습니다.' });
        }

        console.log(`스태프 업데이트 완료 - ID: ${staffId}, 새 상태: ${updatedStaff.status}`);

        res.status(200).json({
            message: '스태프 정보가 업데이트되었습니다.',
            staff: updatedStaff
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '스태프 정보 업데이트 중 오류가 발생했습니다.' });
    }
})

// 법인카드 관련 API

// 법인카드 목록 조회
app.get('/credit-cards', async (req, res) => {
    try {
        const cards = await CreditCard.find({ status: 'active' }).sort({ createdAt: -1 });
        res.status(200).json(cards);
    } catch (err) {
        console.error('법인카드 목록 조회 실패:', err);
        res.status(500).json({ message: '법인카드 목록 조회 실패' });
    }
});

// 법인카드 등록
app.post('/credit-cards', async (req, res) => {
    const { cardName, number } = req.body;

    try {
        // 필수 필드 검증
        if (!cardName || !number) {
            return res.status(400).json({ message: '카드명과 카드번호는 필수입니다.' });
        }

        // 카드번호 형식 검증 (앞 4자리 + 뒤 4자리 = 8자리)
        if (number.length !== 8) {
            return res.status(400).json({ message: '카드번호는 앞 4자리와 뒤 4자리로 총 8자리여야 합니다.' });
        }

        // 중복 카드번호 확인
        const existingCard = await CreditCard.findOne({ number: number, status: 'active' });
        if (existingCard) {
            return res.status(400).json({ message: '이미 등록된 카드번호입니다.' });
        }

        const newCard = new CreditCard({
            cardName: cardName.trim(),
            number: number,
            status: 'active'
        });

        await newCard.save();

        console.log(`새 법인카드 등록: ${cardName} (${number})`);

        res.status(201).json({
            message: '법인카드가 성공적으로 등록되었습니다.',
            card: newCard
        });
    } catch (err) {
        console.error('법인카드 등록 실패:', err);
        res.status(500).json({ message: '법인카드 등록에 실패했습니다.' });
    }
});

// 법인카드 수정
app.put('/credit-cards/:cardId', async (req, res) => {
    const { cardId } = req.params;
    const { cardName, number } = req.body;

    try {
        // 필수 필드 검증
        if (!cardName || !number) {
            return res.status(400).json({ message: '카드명과 카드번호는 필수입니다.' });
        }

        // 카드번호 형식 검증
        if (number.length !== 8) {
            return res.status(400).json({ message: '카드번호는 앞 4자리와 뒤 4자리로 총 8자리여야 합니다.' });
        }

        const card = await CreditCard.findById(cardId);
        if (!card || card.status === 'deleted') {
            return res.status(404).json({ message: '법인카드를 찾을 수 없습니다.' });
        }

        // 다른 카드와 번호 중복 확인 (자기 자신 제외)
        const existingCard = await CreditCard.findOne({
            number: number,
            status: 'active',
            _id: { $ne: cardId }
        });
        if (existingCard) {
            return res.status(400).json({ message: '이미 등록된 카드번호입니다.' });
        }

        // 카드 정보 업데이트
        const updatedCard = await CreditCard.findByIdAndUpdate(
            cardId,
            {
                cardName: cardName.trim(),
                number: number
            },
            { new: true }
        );

        console.log(`법인카드 수정: ${updatedCard.cardName} (${updatedCard.number})`);

        res.status(200).json({
            message: '법인카드 정보가 성공적으로 수정되었습니다.',
            card: updatedCard
        });
    } catch (err) {
        console.error('법인카드 수정 실패:', err);
        res.status(500).json({ message: '법인카드 수정에 실패했습니다.' });
    }
});

// 법인카드 삭제 (status를 deleted로 변경)
app.delete('/credit-cards/:cardId', async (req, res) => {
    const { cardId } = req.params;

    try {
        const card = await CreditCard.findById(cardId);
        if (!card || card.status === 'deleted') {
            return res.status(404).json({ message: '법인카드를 찾을 수 없습니다.' });
        }

        // status를 'deleted'로 변경 (논리적 삭제)
        const deletedCard = await CreditCard.findByIdAndUpdate(
            cardId,
            { status: 'deleted' },
            { new: true }
        );

        console.log(`법인카드 삭제: ${deletedCard.cardName} (${deletedCard.number})`);

        res.status(200).json({
            message: '법인카드가 삭제되었습니다.',
            card: deletedCard
        });
    } catch (err) {
        console.error('법인카드 삭제 실패:', err);
        res.status(500).json({ message: '법인카드 삭제에 실패했습니다.' });
    }
});