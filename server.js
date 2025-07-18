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
const Company = require('./models/Company')
const Receipt = require('./models/Receipt')
const Department = require('./models/Department')

//로컬 버전 http 서버
app.listen(port, () => {
    console.log(`\x1b[35mServer is running on port \x1b[32m${port}\x1b[0m ${new Date().toLocaleString()}`);
})

//배포 버전 https 서버
// const sslKey = fs.readFileSync('/etc/letsencrypt/live/aedia.app/privkey.pem');
// const sslCert = fs.readFileSync('/etc/letsencrypt/live/aedia.app/fullchain.pem');
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
cron.schedule('0 0 * * *', async() => {
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
cron.schedule('*/10 * * * *', async() => {
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
const receiptUploadDir = './uploads/receipts';

if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(receiptUploadDir)) {
    fs.mkdirSync(receiptUploadDir);
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB 제한
});

// 영수증 이미지 업로드용 multer 설정
const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, receiptUploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000000);
        const ext = path.extname(file.originalname);
        cb(null, `receipt-${timestamp}-${randomNum}${ext}`);
    }
});

const receiptUpload = multer({
    storage: receiptStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
    fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
    }
});


// ----------------------------------------------------------
// API 라우터
// ----------------------------------------------------------

app.get('/', (req, res) => {
    res.send('Hello World');
});

// 영수증 이미지 업로드 API
app.post('/upload', receiptUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: '파일이 업로드되지 않았습니다.' 
            });
        }

        // 업로드된 파일의 URL 생성
        const fileUrl = `/uploads/receipts/${req.file.filename}`;

        console.log('영수증 이미지 업로드 성공:', {
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            url: fileUrl
        });

        res.status(200).json({
            success: true,
            message: '파일 업로드 성공',
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });

    } catch (error) {
        console.error('영수증 이미지 업로드 실패:', error);
        res.status(500).json({
            success: false,
            message: '파일 업로드에 실패했습니다.',
            error: error.message
        });
    }
});

app.get('/get-user-list', async(req, res) => {
    const { userType } = req.query;
    try {
        if (userType === 'all') {
            const userList = await User.find({ status: { $ne: 'deleted' } }).select('-password').populate('department', 'name');
            res.status(200).json(userList);
        } else if (userType === 'all-deleted') {
            const userList = await User.find({ status: 'deleted' }).select('-password').populate('department', 'name');
            res.status(200).json(userList);
        } else if (userType === 'internal') {
            const userList = await User.find({ userType: 'internal', status: { $ne: 'deleted' } }).select('-password').populate('department', 'name');
            res.status(200).json(userList);
        } else if (userType === 'external') {
            const userList = await User.find({ userType: 'external', status: { $ne: 'deleted' } }).select('-password').populate('department', 'name');
            res.status(200).json(userList);
        } else {
            res.status(400).json({ message: '잘못된 userType 파라미터입니다.' });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '사용자 목록 조회 실패' });
    }
})

app.post('/slack/code', async(req, res) => {
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
                text: `🔐 AEDIA 인증코드: ${code}\n\n이 코드를 입력해주세요.\n(유효시간: 10분)`
            });

            console.log(`슬랙 인증코드 전송 성공: ${slackId} -> ${code}`);
            res.status(200).json({ message: '인증코드가 전송되었습니다.' });
        } catch (slackError) {
            console.error('슬랙 메시지 전송 실패:', slackError);
            // 슬랙 전송 실패 시 생성된 코드 삭제
            await SlackCode.findByIdAndDelete(newSlackCode._id);

            if (slackError.data && slackError.data.error === 'channel_not_found' || slackError.data && slackError.data.error === 'user_not_found') {
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

app.post('/slack/code/verify', async(req, res) => {
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

// 사용자 정보 업데이트 API (관리자용)
app.put('/admin/update-user/:userId', async(req, res) => {
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
            updateData, { new: true }
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
app.delete('/admin/delete-user/:userId', async(req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // status를 'deleted'로 변경 (실제 삭제가 아닌 논리적 삭제)
        const updatedUser = await User.findByIdAndUpdate(
            userId, { status: 'deleted' }, { new: true }
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

app.post('/forgot-password', async(req, res) => {
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
app.get('/get-user-info', async(req, res) => {
    const { userId } = req.query;
    try {
        const user = await User.findById(userId).select('-password').populate('department', 'name');
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
app.put('/update-user-profile', async(req, res) => {
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
        avatar,
        slackId
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
        if (slackId !== undefined) updateData.slackId = slackId;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData, { new: true }
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
app.put('/change-password', async(req, res) => {
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
app.post('/attendance/check-in', async(req, res) => {
    const { location, method = 'manual', isOffSite = false, offSiteReason = '' } = req.body;
    const { userId } = req.query;

    console.log('🔵 체크인 API 호출:', {
        userId,
        location,
        method,
        isOffSite,
        offSiteReason,
        timestamp: new Date().toISOString()
    });

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD 형식

        // 중복 체크인 방지: 최근 30초 내 체크인 기록 확인
        const recentCheckIn = user.attendance
            .filter(record => record.type === 'checkIn' && record.date === today)
            .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

        if (recentCheckIn) {
            const timeDiff = Math.abs(now - new Date(recentCheckIn.time)) / 1000; // 초 단위
            if (timeDiff < 30) {
                console.log(`🔵 중복 체크인 차단: ${timeDiff}초 전에 이미 체크인함`);
                return res.status(400).json({
                    message: '너무 빠른 시간 내에 중복 출근 처리를 시도했습니다. 잠시 후 다시 시도해주세요.'
                });
            }
        }

        // 회사 위치 정보 조회 (거리 계산용)
        let distance = null;
        if (location && location.latitude && location.longitude) {
            try {
                const company = await Company.findOne({}).select('latitude longitude');
                if (company && company.latitude && company.longitude) {
                    // 거리 계산 (Haversine 공식)
                    const R = 6371e3; // 지구 반지름 (미터)
                    const φ1 = location.latitude * Math.PI / 180;
                    const φ2 = company.latitude * Math.PI / 180;
                    const Δφ = (company.latitude - location.latitude) * Math.PI / 180;
                    const Δλ = (company.longitude - location.longitude) * Math.PI / 180;

                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distance = Math.round(R * c); // 미터 단위
                }
            } catch (companyError) {
                console.error('회사 위치 정보 조회 실패:', companyError);
            }
        }

        // 새로운 체크인 기록 추가
        const newRecord = {
            type: 'checkIn',
            time: now,
            date: today,
            method: method,
            originalTime: now, // 원본 시간 저장
            isModified: false, // 최초 생성시는 수정되지 않음
            isOffSite: isOffSite,
            offSiteReason: isOffSite ? offSiteReason : null,
            location: location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                distance: distance
            } : null
        };

        console.log('🔵 저장할 체크인 기록:', JSON.stringify(newRecord, null, 2));

        const updateResult = await User.findByIdAndUpdate(userId, {
            $push: { attendance: newRecord }
        });

        console.log('🔵 데이터베이스 업데이트 결과:', updateResult ? '성공' : '실패');

        // 저장 후 실제 데이터 확인
        const updatedUser = await User.findById(userId).select('attendance');
        const latestRecord = updatedUser.attendance[updatedUser.attendance.length - 1];
        console.log('🔵 저장된 최신 기록:', JSON.stringify(latestRecord, null, 2));

        // 9시 이후면 지각
        const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

        const responseData = {
            message: isOffSite ? '외부 위치에서 출근 처리되었습니다.' : '출근 처리되었습니다.',
            checkInTime: now,
            isLate: isLate,
            status: isLate ? '지각' : '정시',
            isOffSite: isOffSite,
            distance: distance
        };

        // 외부 위치 출근 시 관리자에게 슬랙 알림
        if (isOffSite && distance !== null) {
            try {
                // 관리자 목록 조회
                const company = await Company.findOne({}).populate('adminUsers.userId', 'name slackId');
                if (company && company.adminUsers) {
                    const adminUsers = company.adminUsers.map(admin => admin.userId).filter(admin => admin && admin.slackId);

                    for (const admin of adminUsers) {
                        try {
                            await slackBot.chat.postMessage({
                                channel: admin.slackId,
                                text: `⚠️ **외부 위치 출근 알림**\n\n사용자: ${user.name}\n출근 시간: ${now.toLocaleString('ko-KR')}\n회사로부터 거리: ${distance}m\n사유: ${offSiteReason}\n\n관리자 페이지에서 자세한 내용을 확인하실 수 있습니다.`
                            });
                            console.log(`외부 출근 관리자 알림 전송 성공: ${admin.name}`);
                        } catch (slackError) {
                            console.error(`외부 출근 관리자 알림 전송 실패 - ${admin.name}:`, slackError);
                        }
                    }
                }
            } catch (adminNotificationError) {
                console.error('관리자 알림 처리 중 오류:', adminNotificationError);
            }
        }

        res.status(200).json(responseData);

    } catch (err) {
        console.error('출근 처리 중 오류:', err);
        res.status(500).json({ message: '출근 처리 중 오류가 발생했습니다.' });
    }
});

// 퇴근 체크아웃 API
app.post('/attendance/check-out', async(req, res) => {
    const { location, method = 'manual', isOffSite = false, offSiteReason = '' } = req.body;
    const { userId } = req.query;

    console.log('🔴 체크아웃 API 호출:', {
        userId,
        location,
        method,
        isOffSite,
        offSiteReason,
        timestamp: new Date().toISOString()
    });

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

        // 중복 체크아웃 방지: 최근 30초 내 체크아웃 기록 확인
        const recentCheckOut = user.attendance
            .filter(record => record.type === 'checkOut' && record.date === today)
            .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

        if (recentCheckOut) {
            const timeDiff = Math.abs(now - new Date(recentCheckOut.time)) / 1000; // 초 단위
            if (timeDiff < 30) {
                console.log(`🔴 중복 체크아웃 차단: ${timeDiff}초 전에 이미 체크아웃함`);
                return res.status(400).json({
                    message: '너무 빠른 시간 내에 중복 퇴근 처리를 시도했습니다. 잠시 후 다시 시도해주세요.'
                });
            }
        }

        // 회사 위치 정보 조회 (거리 계산용)
        let distance = null;
        if (location && location.latitude && location.longitude) {
            try {
                const company = await Company.findOne({}).select('latitude longitude');
                if (company && company.latitude && company.longitude) {
                    // 거리 계산 (Haversine 공식)
                    const R = 6371e3; // 지구 반지름 (미터)
                    const φ1 = location.latitude * Math.PI / 180;
                    const φ2 = company.latitude * Math.PI / 180;
                    const Δφ = (company.latitude - location.latitude) * Math.PI / 180;
                    const Δλ = (company.longitude - location.longitude) * Math.PI / 180;

                    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    distance = Math.round(R * c); // 미터 단위
                }
            } catch (companyError) {
                console.error('회사 위치 정보 조회 실패:', companyError);
            }
        }

        // 새로운 체크아웃 기록 추가
        const newRecord = {
            type: 'checkOut',
            time: now,
            date: today,
            method: method,
            originalTime: now, // 원본 시간 저장
            isModified: false, // 최초 생성시는 수정되지 않음
            isOffSite: isOffSite,
            offSiteReason: isOffSite ? offSiteReason : null,
            location: location ? {
                latitude: location.latitude,
                longitude: location.longitude,
                distance: distance
            } : null
        };

        console.log('🔴 저장할 체크아웃 기록:', JSON.stringify(newRecord, null, 2));

        const updateResult = await User.findByIdAndUpdate(userId, {
            $push: { attendance: newRecord }
        });

        console.log('🔴 데이터베이스 업데이트 결과:', updateResult ? '성공' : '실패');

        // 저장 후 실제 데이터 확인
        const updatedUser = await User.findById(userId).select('attendance');
        const latestRecord = updatedUser.attendance[updatedUser.attendance.length - 1];
        console.log('🔴 저장된 최신 기록:', JSON.stringify(latestRecord, null, 2));

        // 근무 시간 계산
        const workMinutes = Math.floor((now - new Date(lastCheckIn.time)) / (1000 * 60));

        const responseData = {
            message: isOffSite ? '외부 위치에서 퇴근 처리되었습니다.' : '퇴근 처리되었습니다.',
            checkOutTime: now,
            workHours: workMinutes,
            workHoursFormatted: `${Math.floor(workMinutes / 60)}시간 ${workMinutes % 60}분`,
            isOffSite: isOffSite,
            distance: distance
        };

        // 외부 위치 퇴근 시 관리자에게 슬랙 알림
        if (isOffSite && distance !== null) {
            try {
                // 관리자 목록 조회
                const company = await Company.findOne({}).populate('adminUsers.userId', 'name slackId');
                if (company && company.adminUsers) {
                    const adminUsers = company.adminUsers.map(admin => admin.userId).filter(admin => admin && admin.slackId);

                    for (const admin of adminUsers) {
                        try {
                            await slackBot.chat.postMessage({
                                channel: admin.slackId,
                                text: `⚠️ **외부 위치 퇴근 알림**\n\n사용자: ${user.name}\n퇴근 시간: ${now.toLocaleString('ko-KR')}\n근무 시간: ${responseData.workHoursFormatted}\n회사로부터 거리: ${distance}m\n사유: ${offSiteReason}\n\n관리자 페이지에서 자세한 내용을 확인하실 수 있습니다.`
                            });
                            console.log(`외부 퇴근 관리자 알림 전송 성공: ${admin.name}`);
                        } catch (slackError) {
                            console.error(`외부 퇴근 관리자 알림 전송 실패 - ${admin.name}:`, slackError);
                        }
                    }
                }
            } catch (adminNotificationError) {
                console.error('관리자 알림 처리 중 오류:', adminNotificationError);
            }
        }

        res.status(200).json(responseData);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '퇴근 처리 중 오류가 발생했습니다.' });
    }
});

// 출석 기록 조회 API
app.get('/attendance/history', async(req, res) => {
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
app.get('/attendance/today', async(req, res) => {
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
app.patch('/attendance/update/:userId', async(req, res) => {
    const { userId } = req.params;
    const { recordId, time, reason } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const recordIndex = user.attendance.findIndex(record => record._id.toString() === recordId);
        if (recordIndex === -1) {
            return res.status(404).json({ message: '해당 기록을 찾을 수 없습니다.' });
        }

        const record = user.attendance[recordIndex];
        const oldTime = record.time;
        const newTime = new Date(time);

        // 원본 시간 저장 (최초 수정 시)
        if (!record.originalTime) {
            record.originalTime = oldTime;
        }

        // 수정 이력 추가
        if (!record.modificationHistory) {
            record.modificationHistory = [];
        }

        record.modificationHistory.push({
            timestamp: new Date(),
            modifiedBy: user.name || '사용자',
            changes: `시간 수정: ${oldTime.toLocaleTimeString('ko-KR')} → ${newTime.toLocaleTimeString('ko-KR')}`,
            reason: reason || '사유 없음',
            previousValues: {
                time: oldTime,
                memo: record.memo,
                method: record.method
            }
        });

        // 기록 업데이트
        record.time = newTime;
        record.method = 'manual_edit';
        record.isModified = true;

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
app.delete('/attendance/delete/:userId', async(req, res) => {
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
app.post('/attendance/new-check-in', async(req, res) => {
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
            method: method,
            originalTime: now, // 원본 시간 저장
            isModified: false // 최초 생성시는 수정되지 않음
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
app.get('/todos', async(req, res) => {
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
app.post('/todos', async(req, res) => {
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
app.put('/todos/:id', async(req, res) => {
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
app.patch('/todos/:id/toggle', async(req, res) => {
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
app.delete('/todos/:id', async(req, res) => {
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
app.patch('/dashboard/layout', async(req, res) => {
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
app.get('/dashboard/layout', async(req, res) => {
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
app.get('/rooms', async(req, res) => {
    try {
        const rooms = await Room.find({})
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title')
            .populate('reservations.createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(rooms);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '회의실 목록 조회 실패' });
    }
});

// 회의실 추가
app.post('/rooms', async(req, res) => {
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
app.post('/rooms/:id/update', async(req, res) => {
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
app.post('/rooms/:id/delete', async(req, res) => {
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
app.post('/rooms/:roomId/reservations', async(req, res) => {
    const { roomId } = req.params;
    const {
        meetingName,
        meetingDescription,
        startTime,
        endTime,
        participants,
        project,
        createdBy
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
            project: project || null,
            createdBy: createdBy || null
        };

        room.reservations.push(newReservation);
        await room.save();

        // 생성된 예약 정보를 populate해서 반환
        const populatedRoom = await Room.findById(roomId)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title')
            .populate('reservations.createdBy', 'name email');

        const createdReservation = populatedRoom.reservations[populatedRoom.reservations.length - 1];

        res.status(201).json(createdReservation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 생성 실패' });
    }
});

// 예약 수정
app.put('/rooms/:roomId/reservations/:reservationId', async(req, res) => {
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
            .populate('reservations.project', 'title')
            .populate('reservations.createdBy', 'name email');

        const updatedReservation = populatedRoom.reservations[reservationIndex];

        res.status(200).json(updatedReservation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: '예약 수정 실패' });
    }
});

// 예약 삭제 (상태를 '취소됨'으로 변경)
app.delete('/rooms/:roomId/reservations/:reservationId', async(req, res) => {
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
app.get('/rooms/:roomId/reservations', async(req, res) => {
    const { roomId } = req.params;
    const { date } = req.query; // YYYY-MM-DD 형식

    try {
        const room = await Room.findById(roomId)
            .populate('reservations.participants.userId', 'name email')
            .populate('reservations.project', 'title')
            .populate('reservations.createdBy', 'name email');

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
app.post('/add-staff', async(req, res) => {
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

app.post('/modify-staff', async(req, res) => {
    const { staffId, name, email, phone, roles, department } = req.body;
    try {
        const updatedStaff = await User.findByIdAndUpdate(staffId, { name, email, phone, roles, department }, { new: true });
        res.status(200).json({ message: '스태프 수정 성공', staff: updatedStaff });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: '스태프 수정 실패' });
    }
})

app.post('/delete-staff', async(req, res) => {
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
app.delete('/admin/delete-staff/:staffId', async(req, res) => {
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
            staffId, { status: 'deleted' }, { new: true }
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
app.post('/upload-thumbnail', upload.single('thumbnail'), async(req, res) => {
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
app.post('/upload-avatar', upload.single('avatar'), async(req, res) => {
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
app.post('/add-project', async(req, res) => {
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

        console.log('프로젝트 생성 요청:', { title, status, deadline, staffListLength: staffList ? staffList.length : 0 });

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
app.get('/projects', async(req, res) => {
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
app.get('/projects/:id', async(req, res) => {
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
app.put('/projects/:id', async(req, res) => {
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
                        case 'concept':
                            return 'Concept';
                        case 'development':
                            return 'Development';
                        case 'pre_production':
                            return 'Pre-Production';
                        case 'production':
                            return 'Production';
                        case 'post_production':
                            return 'Post-Production';
                        case 'vfx':
                            return 'VFX/CG';
                        case 'sound_design':
                            return 'Sound Design';
                        case 'quality_check':
                            return 'Quality Check';
                        case 'delivery':
                            return 'Delivery';
                        default:
                            return status;
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
app.delete('/projects/:id', async(req, res) => {
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
app.get('/calendar/links', async(req, res) => {
    try {
        const links = await Calendar.find({})
            .populate({
                path: 'projectId',
                select: 'title description status progress thumbnail deadline team staffList',
                populate: [{
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
app.post('/calendar/link', async(req, res) => {
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
                populate: [{
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
app.delete('/calendar/link/:linkId', async(req, res) => {
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
app.get('/calendar/link/:linkId', async(req, res) => {
    const { linkId } = req.params;

    try {
        const link = await Calendar.findOne({ linkId: linkId })
            .populate({
                path: 'projectId',
                select: 'title description status progress thumbnail deadline team staffList',
                populate: [{
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
app.post('/calendar/links/batch', async(req, res) => {
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
app.put('/admin/update-staff/:staffId', async(req, res) => {
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
            updateData, { new: true }
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
app.get('/credit-cards', async(req, res) => {
    try {
        const cards = await CreditCard.find({ status: 'active' });
        res.status(200).json(cards);
    } catch (err) {
        console.error('법인카드 목록 조회 실패:', err);
        res.status(500).json({ message: '법인카드 목록 조회 실패' });
    }
});

// 삭제된 법인카드 목록 조회
app.get('/credit-cards/deleted', async(req, res) => {
    try {
        const cards = await CreditCard.find({ status: 'deleted' });
        res.status(200).json(cards);
    } catch (err) {
        console.error('삭제된 법인카드 목록 조회 실패:', err);
        res.status(500).json({ message: '삭제된 법인카드 목록 조회 실패' });
    }
});

// 법인카드 등록
app.post('/credit-cards', async(req, res) => {
    const { cardName, number, label } = req.body;

    try {
        // 필수 필드 검증
        if (!cardName || !number || !label) {
            return res.status(400).json({ message: '카드명, 카드번호, 라벨은 모두 필수입니다.' });
        }

        // 카드번호 형식 검증 (앞 4자리 + 뒤 4자리 = 8자리)
        if (number.length !== 8) {
            return res.status(400).json({ message: '카드번호는 앞 4자리와 뒤 4자리로 총 8자리여야 합니다.' });
        }

        // 라벨 검증 (알파벳 대문자 한 글자)
        if (!/^[A-Z]$/.test(label)) {
            return res.status(400).json({ message: '라벨은 알파벳 대문자 한 글자여야 합니다.' });
        }

        // 중복 카드번호 확인
        const existingCard = await CreditCard.findOne({ number: number, status: 'active' });
        if (existingCard) {
            return res.status(400).json({ message: '이미 등록된 카드번호입니다.' });
        }



        const newCard = new CreditCard({
            cardName: cardName.trim(),
            number: number,
            label: label || null,
            status: 'active'
        });

        await newCard.save();

        console.log(`새 법인카드 등록: ${cardName} (${label ? label + ' ' : ''}${number})`);

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
app.put('/credit-cards/:cardId', async(req, res) => {
    const { cardId } = req.params;
    const { cardName, number, label } = req.body;

    try {
        // 필수 필드 검증
        if (!cardName || !number || !label) {
            return res.status(400).json({ message: '카드명, 카드번호, 라벨은 모두 필수입니다.' });
        }

        // 카드번호 형식 검증
        if (number.length !== 8) {
            return res.status(400).json({ message: '카드번호는 앞 4자리와 뒤 4자리로 총 8자리여야 합니다.' });
        }

        // 라벨 검증 (알파벳 대문자 한 글자)
        if (!/^[A-Z]$/.test(label)) {
            return res.status(400).json({ message: '라벨은 알파벳 대문자 한 글자여야 합니다.' });
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
            cardId, {
                cardName: cardName.trim(),
                number: number,
                label: label || null
            }, { new: true }
        );

        console.log(`법인카드 수정: ${updatedCard.cardName} (${updatedCard.label ? updatedCard.label + ' ' : ''}${updatedCard.number})`);

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
app.delete('/credit-cards/:cardId', async(req, res) => {
    const { cardId } = req.params;

    try {
        const card = await CreditCard.findById(cardId);
        if (!card || card.status === 'deleted') {
            return res.status(404).json({ message: '법인카드를 찾을 수 없습니다.' });
        }

        // status를 'deleted'로 변경 (논리적 삭제)
        const deletedCard = await CreditCard.findByIdAndUpdate(
            cardId, { status: 'deleted' }, { new: true }
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

// 법인카드 복구 (status를 active로 변경)
app.patch('/credit-cards/:cardId/restore', async(req, res) => {
    const { cardId } = req.params;

    try {
        const card = await CreditCard.findById(cardId);
        if (!card || card.status !== 'deleted') {
            return res.status(404).json({ message: '삭제된 법인카드를 찾을 수 없습니다.' });
        }



        // 카드번호 중복 확인 (복구 시)
        const existingCard = await CreditCard.findOne({
            number: card.number,
            status: 'active',
            _id: { $ne: cardId }
        });
        if (existingCard) {
            return res.status(400).json({
                message: '동일한 카드번호가 이미 사용중입니다. 다른 카드를 먼저 수정해주세요.'
            });
        }

        // status를 'active'로 변경 (복구)
        const restoredCard = await CreditCard.findByIdAndUpdate(
            cardId, { status: 'active' }, { new: true }
        );

        console.log(`법인카드 복구: ${restoredCard.cardName} (${restoredCard.label ? restoredCard.label + ' ' : ''}${restoredCard.number})`);

        res.status(200).json({
            message: '법인카드가 복구되었습니다.',
            card: restoredCard
        });
    } catch (err) {
        console.error('법인카드 복구 실패:', err);
        res.status(500).json({ message: '법인카드 복구에 실패했습니다.' });
    }
});

// Company/Advanced Setting 관련 API

// 회사 설정 조회
app.get('/company/settings', async(req, res) => {
    try {
        let company = await Company.findOne({})
            .populate('adminUsers.userId', 'name email department userType')
            .populate('adminUsers.addedBy', 'name email');

        if (!company) {
            // 기본 회사 설정 생성
            company = new Company({
                name: 'AEDIA STUDIO',
                logo: 'AEDIALOGO.svg',
                address: '',
                phone: '',
                email: '',
                website: '',
                adminUsers: [],
                settings: {
                    autoLogout: 24,
                    slackIntegration: true,
                    emailNotification: true
                }
            });
            await company.save();
        }

        res.status(200).json(company);
    } catch (err) {
        console.error('회사 설정 조회 실패:', err);
        res.status(500).json({ message: '회사 설정 조회에 실패했습니다.' });
    }
});

// 회사 기본 정보 업데이트
app.put('/company/basic-info', async(req, res) => {
    const { name, logo, address, latitude, longitude, phone, email, website } = req.body;

    try {
        let company = await Company.findOne({});

        if (!company) {
            company = new Company({});
        }

        // 업데이트할 데이터 준비
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (logo !== undefined) updateData.logo = logo;
        if (address !== undefined) updateData.address = address.trim();
        if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
        if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
        if (phone !== undefined) updateData.phone = phone.trim();
        if (email !== undefined) updateData.email = email.trim();
        if (website !== undefined) updateData.website = website.trim();

        const updatedCompany = await Company.findByIdAndUpdate(
                company._id,
                updateData, { new: true, upsert: true }
            ).populate('adminUsers.userId', 'name email department userType')
            .populate('adminUsers.addedBy', 'name email');

        console.log('회사 기본 정보 업데이트:', updateData);

        res.status(200).json({
            message: '회사 정보가 성공적으로 업데이트되었습니다.',
            company: updatedCompany
        });
    } catch (err) {
        console.error('회사 정보 업데이트 실패:', err);
        res.status(500).json({ message: '회사 정보 업데이트에 실패했습니다.' });
    }
});

// 어드민 사용자 추가
app.post('/company/admin-users', async(req, res) => {
    const { userId, role = 'admin', addedBy } = req.body;

    try {
        // 필수 필드 검증
        if (!userId) {
            return res.status(400).json({ message: '사용자 ID는 필수입니다.' });
        }

        // 사용자 존재 여부 확인
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        let company = await Company.findOne({});
        if (!company) {
            company = new Company({});
            await company.save();
        }

        // 이미 어드민으로 등록되어 있는지 확인
        const existingAdmin = company.adminUsers.find(
            admin => admin.userId.toString() === userId.toString()
        );

        if (existingAdmin) {
            return res.status(400).json({ message: '이미 어드민으로 등록된 사용자입니다.' });
        }

        // 새 어드민 사용자 추가
        const newAdminUser = {
            userId: userId,
            role: role,
            addedAt: new Date(),
            addedBy: addedBy || null
        };

        company.adminUsers.push(newAdminUser);
        await company.save();

        // populate해서 반환
        const updatedCompany = await Company.findById(company._id)
            .populate('adminUsers.userId', 'name email department userType')
            .populate('adminUsers.addedBy', 'name email');

        console.log(`새 어드민 사용자 추가: ${user.name} (${user.email}) - Role: ${role}`);

        res.status(200).json({
            message: '어드민 사용자가 성공적으로 추가되었습니다.',
            company: updatedCompany
        });
    } catch (err) {
        console.error('어드민 사용자 추가 실패:', err);
        res.status(500).json({ message: '어드민 사용자 추가에 실패했습니다.' });
    }
});

// 어드민 사용자 삭제
app.delete('/company/admin-users/:userId', async(req, res) => {
    const { userId } = req.params;

    try {
        let company = await Company.findOne({});
        if (!company) {
            return res.status(404).json({ message: '회사 설정을 찾을 수 없습니다.' });
        }

        // 어드민 사용자 찾기
        const adminIndex = company.adminUsers.findIndex(
            admin => admin.userId.toString() === userId.toString()
        );

        if (adminIndex === -1) {
            return res.status(404).json({ message: '해당 어드민 사용자를 찾을 수 없습니다.' });
        }

        // 어드민이 한 명만 남은 경우 삭제 방지
        if (company.adminUsers.length === 1) {
            return res.status(400).json({
                message: '최소 한 명의 어드민 사용자가 필요합니다.'
            });
        }

        // 어드민 사용자 삭제
        const removedAdmin = company.adminUsers[adminIndex];
        company.adminUsers.splice(adminIndex, 1);
        await company.save();

        console.log(`어드민 사용자 삭제: ${userId} - Role: ${removedAdmin.role}`);

        res.status(200).json({
            message: '어드민 사용자가 성공적으로 삭제되었습니다.'
        });
    } catch (err) {
        console.error('어드민 사용자 삭제 실패:', err);
        res.status(500).json({ message: '어드민 사용자 삭제에 실패했습니다.' });
    }
});

// 어드민 사용자 역할 수정
app.put('/company/admin-users/:userId', async(req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    try {
        if (!role || !['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({
                message: '유효한 역할을 입력해주세요. (admin, super_admin)'
            });
        }

        let company = await Company.findOne({});
        if (!company) {
            return res.status(404).json({ message: '회사 설정을 찾을 수 없습니다.' });
        }

        // 어드민 사용자 찾기
        const adminUser = company.adminUsers.find(
            admin => admin.userId.toString() === userId.toString()
        );

        if (!adminUser) {
            return res.status(404).json({ message: '해당 어드민 사용자를 찾을 수 없습니다.' });
        }

        // 역할 업데이트
        adminUser.role = role;
        await company.save();

        // populate해서 반환
        const updatedCompany = await Company.findById(company._id)
            .populate('adminUsers.userId', 'name email department userType')
            .populate('adminUsers.addedBy', 'name email');

        console.log(`어드민 사용자 역할 변경: ${userId} - 새 역할: ${role}`);

        res.status(200).json({
            message: '어드민 사용자 역할이 성공적으로 변경되었습니다.',
            company: updatedCompany
        });
    } catch (err) {
        console.error('어드민 사용자 역할 변경 실패:', err);
        res.status(500).json({ message: '어드민 사용자 역할 변경에 실패했습니다.' });
    }
});

// 회사 설정 업데이트
app.put('/company/settings', async(req, res) => {
    const { autoLogout, slackIntegration, emailNotification } = req.body;

    try {
        let company = await Company.findOne({});
        if (!company) {
            company = new Company({});
            await company.save();
        }

        // 설정 업데이트
        const updateData = {};
        if (autoLogout !== undefined) updateData['settings.autoLogout'] = autoLogout;
        if (slackIntegration !== undefined) updateData['settings.slackIntegration'] = slackIntegration;
        if (emailNotification !== undefined) updateData['settings.emailNotification'] = emailNotification;

        const updatedCompany = await Company.findByIdAndUpdate(
                company._id,
                updateData, { new: true }
            ).populate('adminUsers.userId', 'name email department userType')
            .populate('adminUsers.addedBy', 'name email');

        console.log('회사 설정 업데이트:', updateData);

        res.status(200).json({
            message: '회사 설정이 성공적으로 업데이트되었습니다.',
            company: updatedCompany
        });
    } catch (err) {
        console.error('회사 설정 업데이트 실패:', err);
        res.status(500).json({ message: '회사 설정 업데이트에 실패했습니다.' });
    }
});

// 어드민 권한 확인 API
app.get('/company/check-admin/:userId', async(req, res) => {
    const { userId } = req.params;

    try {
        const company = await Company.findOne({})
            .populate('adminUsers.userId', 'name email');

        if (!company) {
            return res.status(200).json({ isAdmin: false, role: null });
        }

        const adminUser = company.adminUsers.find(
            admin => admin.userId._id.toString() === userId.toString()
        );

        if (adminUser) {
            res.status(200).json({
                isAdmin: true,
                role: adminUser.role,
                addedAt: adminUser.addedAt
            });
        } else {
            res.status(200).json({ isAdmin: false, role: null });
        }
    } catch (err) {
        console.error('어드민 권한 확인 실패:', err);
        res.status(500).json({ message: '어드민 권한 확인에 실패했습니다.' });
    }
});

// 로고 업로드 API
app.post('/company/upload-logo', upload.single('logo'), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: '로고 파일이 업로드되지 않았습니다.' });
        }

        console.log('로고 업로드 요청:', req.file.filename);

        // 파일 경로 및 새 파일명 생성
        const originalPath = req.file.path;
        const fileExtension = path.extname(req.file.originalname);
        const timestamp = Date.now();
        const newFilename = `company_logo_${timestamp}${fileExtension}`;
        const newPath = path.join('./uploads/product/', newFilename);

        // 이미지 리사이징 및 최적화
        if (req.file.mimetype.startsWith('image/')) {
            await sharp(originalPath)
                .resize(400, 200, {
                    fit: 'contain',
                    withoutEnlargement: true,
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png({ quality: 90 })
                .toFile(newPath);

            // 원본 파일 삭제
            fs.unlinkSync(originalPath);
        } else {
            // 이미지가 아닌 경우 그대로 이동
            fs.renameSync(originalPath, newPath);
        }

        res.status(200).json({
            message: '로고 업로드 성공',
            filename: newFilename
        });
    } catch (err) {
        console.error('로고 업로드 실패:', err);
        res.status(500).json({ message: '로고 업로드에 실패했습니다.' });
    }
});

// 회사 위치 정보 조회 API (출석 관리용)
app.get('/company/location', async(req, res) => {
    try {
        const company = await Company.findOne({}).select('latitude longitude name address');

        console.log('🏢 회사 위치 정보 조회:', {
            회사데이터존재: !!company,
            위도: company ? company.latitude : null,
            경도: company ? company.longitude : null,
            회사명: company ? company.name : null,
            주소: company ? company.address : null
        });

        if (!company) {
            console.log('🏢 회사 정보가 없어 기본값 반환');
            return res.status(200).json({
                latitude: null,
                longitude: null,
                name: 'AEDIA STUDIO',
                address: '',
                hasLocation: false,
                radius: 100
            });
        }

        const hasLocation = company.latitude !== null && company.longitude !== null;

        const locationInfo = {
            latitude: company.latitude,
            longitude: company.longitude,
            name: company.name,
            address: company.address,
            hasLocation: hasLocation,
            radius: company.radius || 100 // 기본 반경 100m
        };

        console.log('🏢 반환할 회사 위치 정보:', locationInfo);

        res.status(200).json(locationInfo);
    } catch (err) {
        console.error('회사 위치 정보 조회 실패:', err);
        res.status(500).json({ message: '회사 위치 정보 조회에 실패했습니다.' });
    }
});

// Admin 출석 관리 API들

// Admin 출석 목록 조회 API
app.get('/admin/attendance/list', async(req, res) => {
    const { startDate, endDate, userId, status, userType, searchName } = req.query;

    try {
        // 사용자 필터 조건 생성
        let userFilter = { status: 'active' };

        if (userType && userType !== 'all') {
            userFilter.userType = userType;
        }

        if (searchName && searchName.trim()) {
            userFilter.name = { $regex: searchName.trim(), $options: 'i' };
        }

        if (userId && userId !== 'all') {
            userFilter._id = userId;
        }

        // 사용자 목록 조회
        const users = await User.find(userFilter).select('name userType attendance');

        const attendanceList = [];

        // 각 사용자의 출석 데이터 처리
        for (const user of users) {
            if (!user.attendance || user.attendance.length === 0) continue;

            // 날짜 필터링
            let filteredAttendance = user.attendance;
            if (startDate || endDate) {
                filteredAttendance = user.attendance.filter(record => {
                    const recordDate = new Date(record.date);
                    let include = true;

                    if (startDate) {
                        include = include && recordDate >= new Date(startDate);
                    }
                    if (endDate) {
                        include = include && recordDate <= new Date(endDate);
                    }

                    return include;
                });
            }

            // 날짜별로 그룹화
            const attendanceByDate = {};
            filteredAttendance.forEach(record => {
                if (!attendanceByDate[record.date]) {
                    attendanceByDate[record.date] = [];
                }
                attendanceByDate[record.date].push(record);
            });

            // 날짜별 출석 데이터 생성
            Object.keys(attendanceByDate).forEach(date => {
                const records = attendanceByDate[date].sort((a, b) => new Date(a.time) - new Date(b.time));
                const checkInRecords = records.filter(r => r.type === 'checkIn');
                const checkOutRecords = records.filter(r => r.type === 'checkOut');

                // 첫 번째 출근과 마지막 퇴근 시간
                const firstCheckIn = checkInRecords.length > 0 ? checkInRecords[0] : null;
                const lastCheckOut = checkOutRecords.length > 0 ? checkOutRecords[checkOutRecords.length - 1] : null;

                // 상태 결정
                let attendanceStatus = 'present';
                if (firstCheckIn) {
                    const checkInTime = new Date(firstCheckIn.time);
                    const isLate = checkInTime.getHours() >= 9;
                    if (isLate) attendanceStatus = 'late';
                }
                if (!lastCheckOut && firstCheckIn) attendanceStatus = 'present'; // 미퇴근도 출석으로 표시
                if (checkInRecords.length === 0) attendanceStatus = 'absent';

                // 상태 필터링
                if (status && status !== 'all' && attendanceStatus !== status) {
                    return;
                }

                // 총 근무시간 계산
                let totalWorkMinutes = 0;
                for (let i = 0; i < Math.min(checkInRecords.length, checkOutRecords.length); i++) {
                    const checkInTime = new Date(checkInRecords[i].time);
                    const checkOutTime = new Date(checkOutRecords[i].time);
                    totalWorkMinutes += Math.floor((checkOutTime - checkInTime) / (1000 * 60));
                }

                const workHours = totalWorkMinutes > 0 ? Math.round((totalWorkMinutes / 60) * 10) / 10 : 0;

                // 수정 여부 확인 - method가 manual_edit이거나 isModified가 true이거나 수정 이력이 있는 경우
                const isModified = records.some(record =>
                    record.method === 'manual_edit' ||
                    record.isModified === true ||
                    (record.modificationHistory && record.modificationHistory.length > 0)
                );

                // 모든 수정 이력 수집
                const allModificationHistory = records.reduce((acc, record) => {
                    if (record.modificationHistory && record.modificationHistory.length > 0) {
                        acc.push(...record.modificationHistory);
                    }
                    return acc;
                }, []);

                // console.log(`날짜 ${date}, 사용자 ${user.name}: 수정여부=${isModified}, 수정이력=${allModificationHistory.length}개`);

                // 외부 위치 정보 수집
                const hasOffSiteRecord = records.some(record => record.isOffSite === true);
                const offSiteRecords = records.filter(record => record.isOffSite === true);

                // console.log(`📊 ${user.name} (${date}) 외부위치 분석:`, {
                //     총기록수: records.length,
                //     외부기록여부: hasOffSiteRecord,
                //     외부기록수: offSiteRecords.length,
                //     첫출근외부여부: firstCheckIn ? firstCheckIn.isOffSite : false,
                //     마지막퇴근외부여부: lastCheckOut ? lastCheckOut.isOffSite : false,
                //     모든기록외부정보: records.map(r => ({
                //         type: r.type,
                //         isOffSite: r.isOffSite,
                //         offSiteReason: r.offSiteReason
                //     }))
                // });

                const offSiteInfo = hasOffSiteRecord ? {
                    checkIn: firstCheckIn && firstCheckIn.isOffSite ? {
                        reason: firstCheckIn.offSiteReason,
                        distance: firstCheckIn.location ? firstCheckIn.location.distance : null
                    } : null,
                    checkOut: lastCheckOut && lastCheckOut.isOffSite ? {
                        reason: lastCheckOut.offSiteReason,
                        distance: lastCheckOut.location ? lastCheckOut.location.distance : null
                    } : null
                } : null;

                // if (hasOffSiteRecord) {
                //     console.log(`📊 ${user.name} (${date}) 외부위치 정보:`, JSON.stringify(offSiteInfo, null, 2));
                // }

                const responseData = {
                    _id: `${user._id}_${date}`,
                    userId: user._id,
                    userName: user.name,
                    userType: user.userType,
                    date: date,
                    checkInTime: firstCheckIn ? firstCheckIn.time : null,
                    checkOutTime: lastCheckOut ? lastCheckOut.time : null,
                    workHours: workHours,
                    status: attendanceStatus,
                    note: firstCheckIn ? firstCheckIn.memo || '' : '',
                    records: records,
                    isModified: isModified,
                    modificationHistory: allModificationHistory,
                    hasOffSite: hasOffSiteRecord,
                    offSiteInfo: offSiteInfo,
                    offSiteCount: offSiteRecords.length
                };

                // console.log(`🔍 응답 데이터 (${user.name}, ${date}):`, {
                //     hasOffSite: responseData.hasOffSite,
                //     offSiteCount: responseData.offSiteCount,
                //     recordsCount: responseData.records ? responseData.records.length : 0
                // });

                attendanceList.push(responseData);
            });
        }

        // 최신순으로 정렬
        attendanceList.sort((a, b) => {
            if (a.date === b.date) {
                return new Date(a.checkInTime || '00:00') - new Date(b.checkInTime || '00:00');
            }
            return new Date(b.date) - new Date(a.date);
        });

        res.status(200).json(attendanceList);

    } catch (err) {
        console.error('Admin 출석 목록 조회 실패:', err);
        res.status(500).json({ message: 'Admin 출석 목록 조회에 실패했습니다.' });
    }
});

// Admin 사용자 목록 조회 API
app.get('/admin/users/list', async(req, res) => {
    try {
        const users = await User.find({
            status: { $ne: 'deleted' }
        }).select('name email userType department status hireYear').sort({ name: 1 });

        res.status(200).json(users);
    } catch (err) {
        console.error('Admin 사용자 목록 조회 실패:', err);
        res.status(500).json({ message: 'Admin 사용자 목록 조회에 실패했습니다.' });
    }
});

// Admin 출석 통계 조회 API
app.get('/admin/attendance/summary', async(req, res) => {
    const { year, month, userType } = req.query;

    try {
        // 사용자 필터 조건 생성
        let userFilter = { status: 'active' };
        if (userType && userType !== 'all') {
            userFilter.userType = userType;
        }

        const users = await User.find(userFilter).select('name userType attendance');

        const summaryList = [];

        // 해당 년월의 근무일 계산 (주말 제외)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const workingDays = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 주말 제외
                workingDays.push(d.toISOString().split('T')[0]);
            }
        }

        const totalWorkingDays = workingDays.length;

        // 각 사용자별 통계 계산
        for (const user of users) {
            if (!user.attendance || user.attendance.length === 0) {
                summaryList.push({
                    userId: { _id: user._id, name: user.name, userType: user.userType },
                    workingDays: totalWorkingDays,
                    present: 0,
                    late: 0,
                    absent: totalWorkingDays,
                    vacation: 0,
                    remote: 0,
                    totalWorkHours: 0,
                    avgWorkHours: 0,
                    attendanceRate: 0,
                    punctualityRate: 0
                });
                continue;
            }

            // 해당 월의 출석 기록 필터링
            const monthlyAttendance = user.attendance.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getFullYear() === parseInt(year) &&
                    recordDate.getMonth() === parseInt(month) - 1;
            });

            // 날짜별로 그룹화
            const attendanceByDate = {};
            monthlyAttendance.forEach(record => {
                if (!attendanceByDate[record.date]) {
                    attendanceByDate[record.date] = [];
                }
                attendanceByDate[record.date].push(record);
            });

            let present = 0;
            let late = 0;
            let absent = 0;
            let totalWorkMinutes = 0;

            // 각 근무일에 대해 상태 판정
            workingDays.forEach(workDay => {
                const dayRecords = attendanceByDate[workDay] || [];
                const checkInRecords = dayRecords.filter(r => r.type === 'checkIn');
                const checkOutRecords = dayRecords.filter(r => r.type === 'checkOut');

                if (checkInRecords.length === 0) {
                    absent++;
                } else {
                    const firstCheckIn = checkInRecords[0];
                    const checkInTime = new Date(firstCheckIn.time);
                    const isLate = checkInTime.getHours() >= 9;

                    if (isLate) {
                        late++;
                    } else {
                        present++;
                    }

                    // 근무시간 계산
                    for (let i = 0; i < Math.min(checkInRecords.length, checkOutRecords.length); i++) {
                        const checkInTime = new Date(checkInRecords[i].time);
                        const checkOutTime = new Date(checkOutRecords[i].time);
                        totalWorkMinutes += Math.floor((checkOutTime - checkInTime) / (1000 * 60));
                    }
                }
            });

            const totalWorkHours = Math.round((totalWorkMinutes / 60) * 10) / 10;
            const avgWorkHours = (present + late) > 0 ? Math.round((totalWorkHours / (present + late)) * 10) / 10 : 0;
            const attendanceRate = Math.round(((present + late) / totalWorkingDays) * 100);
            const punctualityRate = (present + late) > 0 ? Math.round((present / (present + late)) * 100) : 0;

            summaryList.push({
                userId: { _id: user._id, name: user.name, userType: user.userType },
                workingDays: totalWorkingDays,
                present: present,
                late: late,
                absent: absent,
                vacation: 0, // 현재 휴가 정보가 없으므로 0
                remote: 0, // 현재 재택근무 정보가 없으므로 0
                totalWorkHours: totalWorkHours,
                avgWorkHours: avgWorkHours,
                attendanceRate: attendanceRate,
                punctualityRate: punctualityRate
            });
        }

        res.status(200).json(summaryList);

    } catch (err) {
        console.error('Admin 출석 통계 조회 실패:', err);
        res.status(500).json({ message: 'Admin 출석 통계 조회에 실패했습니다.' });
    }
});

// Admin 출석 정보 수정 API
app.patch('/admin/attendance/update/:attendanceId', async(req, res) => {
    const { attendanceId } = req.params;
    const { status, note } = req.body;

    try {
        // attendanceId 형식: userId_date
        const [userId, date] = attendanceId.split('_');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 해당 날짜의 출석 기록들 찾기
        const attendanceRecords = user.attendance.filter(record => record.date === date);

        if (attendanceRecords.length === 0) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록을 찾을 수 없습니다.' });
        }

        // 첫 번째 기록에 메모 업데이트 (status는 실제로는 출근 시간에 따라 자동 결정됨)
        const firstRecord = attendanceRecords[0];
        const recordIndex = user.attendance.findIndex(record =>
            record._id.toString() === firstRecord._id.toString()
        );

        if (recordIndex !== -1) {
            if (note !== undefined) {
                user.attendance[recordIndex].memo = note;
                user.attendance[recordIndex].isModified = true;
                user.attendance[recordIndex].method = 'manual_edit'; // 관리자 수정 표시
            }
            await user.save();
        }

        res.status(200).json({
            message: '출석 정보가 수정되었습니다.',
            updatedRecord: user.attendance[recordIndex]
        });

    } catch (err) {
        console.error('Admin 출석 정보 수정 실패:', err);
        res.status(500).json({ message: 'Admin 출석 정보 수정에 실패했습니다.' });
    }
});

// 개별 출석 기록 수정 API (모달용)
app.patch('/admin/attendance/:attendanceId', async(req, res) => {
    const { attendanceId } = req.params;
    const {
        status,
        checkInTime,
        checkOutTime,
        note,
        isModified,
        modificationHistory
    } = req.body;

    try {
        // attendanceId 형식: userId_date
        const [userId, date] = attendanceId.split('_');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 해당 날짜의 출석 기록들 찾기 및 업데이트
        let updated = false;
        const allChanges = []; // 모든 변경사항 수집

        for (let i = 0; i < user.attendance.length; i++) {
            const record = user.attendance[i];
            if (record.date === date) {
                const recordChanges = []; // 이 기록만의 변경사항

                // 비고 업데이트
                if (record.memo !== note && note !== undefined) {
                    recordChanges.push(`비고: ${record.memo || '없음'} → ${note || '없음'}`);
                    allChanges.push(`${record.type === 'checkIn' ? '출근' : '퇴근'} 비고: ${record.memo || '없음'} → ${note || '없음'}`);
                    // 원본 정보 저장 (최초 1회)
                    if (!record.originalMemo && record.memo) {
                        record.originalMemo = record.memo;
                    }
                    record.memo = note;
                }

                // 출근 시간 업데이트
                if (record.type === 'checkIn' && checkInTime) {
                    const newTime = new Date(`${date}T${checkInTime}:00`);
                    if (record.time.getTime() !== newTime.getTime()) {
                        const oldTimeStr = record.time.toLocaleTimeString('ko-KR');
                        const newTimeStr = newTime.toLocaleTimeString('ko-KR');
                        recordChanges.push(`출근시간: ${oldTimeStr} → ${newTimeStr}`);
                        allChanges.push(`출근시간: ${oldTimeStr} → ${newTimeStr}`);
                        // 원본 시간 저장 (최초 1회)
                        if (!record.originalTime) {
                            record.originalTime = record.time;
                        }
                        record.time = newTime;
                    }
                }

                // 퇴근 시간 업데이트
                if (record.type === 'checkOut' && checkOutTime) {
                    const newTime = new Date(`${date}T${checkOutTime}:00`);
                    if (record.time.getTime() !== newTime.getTime()) {
                        const oldTimeStr = record.time.toLocaleTimeString('ko-KR');
                        const newTimeStr = newTime.toLocaleTimeString('ko-KR');
                        recordChanges.push(`퇴근시간: ${oldTimeStr} → ${newTimeStr}`);
                        allChanges.push(`퇴근시간: ${oldTimeStr} → ${newTimeStr}`);
                        // 원본 시간 저장 (최초 1회)
                        if (!record.originalTime) {
                            record.originalTime = record.time;
                        }
                        record.time = newTime;
                    }
                }

                // 이 기록에 변경사항이 있는 경우에만 수정 이력 추가
                if (recordChanges.length > 0) {
                    record.isModified = true;
                    record.method = 'manual_edit'; // 관리자 수정 표시
                    record.modificationHistory = record.modificationHistory || [];
                    record.modificationHistory.push({
                        timestamp: new Date(),
                        modifiedBy: '관리자',
                        changes: recordChanges.join(', '),
                        previousValues: {
                            time: record.originalTime || record.time,
                            memo: record.originalMemo || record.memo,
                            method: record.method
                        }
                    });
                }

                updated = true;
            }
        }

        if (!updated) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록을 찾을 수 없습니다.' });
        }

        await user.save();

        res.status(200).json({
            message: '출석 정보가 수정되었습니다.',
            changes: allChanges
        });

    } catch (err) {
        console.error('Admin 출석 기록 수정 실패:', err);
        res.status(500).json({ message: 'Admin 출석 기록 수정에 실패했습니다.' });
    }
});

// 개별 출석 기록 삭제 API (모달용)
app.delete('/admin/attendance/:attendanceId', async(req, res) => {
    const { attendanceId } = req.params;

    try {
        // attendanceId 형식: userId_date
        const [userId, date] = attendanceId.split('_');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 해당 날짜의 모든 출석 기록 삭제
        const originalLength = user.attendance.length;
        user.attendance = user.attendance.filter(record => record.date !== date);

        if (user.attendance.length === originalLength) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록을 찾을 수 없습니다.' });
        }

        await user.save();

        res.status(200).json({
            message: '출석 기록이 삭제되었습니다.',
            deletedCount: originalLength - user.attendance.length
        });

    } catch (err) {
        console.error('Admin 출석 기록 삭제 실패:', err);
        res.status(500).json({ message: 'Admin 출석 기록 삭제에 실패했습니다.' });
    }
});

// Admin 출석 기록 삭제 API
app.delete('/admin/attendance/delete/:attendanceId', async(req, res) => {
    const { attendanceId } = req.params;

    try {
        // attendanceId 형식: userId_date
        const [userId, date] = attendanceId.split('_');

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 해당 날짜의 모든 출석 기록 삭제
        const originalLength = user.attendance.length;
        user.attendance = user.attendance.filter(record => record.date !== date);

        if (user.attendance.length === originalLength) {
            return res.status(404).json({ message: '해당 날짜의 출석 기록을 찾을 수 없습니다.' });
        }

        await user.save();

        res.status(200).json({
            message: '출석 기록이 삭제되었습니다.',
            deletedCount: originalLength - user.attendance.length
        });

    } catch (err) {
        console.error('Admin 출석 기록 삭제 실패:', err);
        res.status(500).json({ message: 'Admin 출석 기록 삭제에 실패했습니다.' });
    }
});

// 디버깅: 특정 사용자의 출석 기록 상세 조회 (외부 위치 정보 포함)
app.get('/debug/attendance/:userId', async(req, res) => {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    try {
        const user = await User.findById(userId).select('name attendance');
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 최근 기록들을 가져와서 외부 위치 정보 확인
        const recentRecords = user.attendance
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, limit);

        const debugInfo = {
            userName: user.name,
            totalRecords: user.attendance.length,
            recentRecords: recentRecords.map(record => ({
                _id: record._id,
                type: record.type,
                time: record.time,
                date: record.date,
                isOffSite: record.isOffSite,
                offSiteReason: record.offSiteReason,
                location: record.location,
                method: record.method,
                isModified: record.isModified
            })),
            offSiteRecords: recentRecords.filter(record => record.isOffSite === true).length,
            onSiteRecords: recentRecords.filter(record => !record.isOffSite).length
        };

        console.log('🔍 디버깅 - 사용자 출석 기록 조회:', JSON.stringify(debugInfo, null, 2));

        res.status(200).json(debugInfo);

    } catch (err) {
        console.error('디버깅 출석 기록 조회 실패:', err);
        res.status(500).json({ message: '디버깅 출석 기록 조회에 실패했습니다.' });
    }
});

// ============================================
// Receipt API 엔드포인트들
// ============================================

// 전체 영수증 조회 (필터링 옵션 포함)
app.get('/receipts', async(req, res) => {
    try {
        const {
            type,
            status,
            category,
            userId,
            projectId,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        // 필터 조건 구성
        const filter = {};

        if (type && type !== 'all') filter.type = type;
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        if (userId) filter.userId = userId;
        if (projectId) filter.projectId = projectId;

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        const receipts = await Receipt.find(filter)
            .populate('userId', 'name email')
            .populate('projectId', 'title')
            .populate('creditCardId', 'cardName number label')
            .populate('approvedBy', 'name')
            .sort({ date: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Receipt.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: receipts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('영수증 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 조회에 실패했습니다.',
            error: error.message
        });
    }
});

// 영수증 상세 조회
app.get('/receipts/:id', async(req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('userId', 'name email avatar')
            .populate('projectId', 'title description')
            .populate('creditCardId', 'cardName number label')
            .populate('approvedBy', 'name email');

        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: '영수증을 찾을 수 없습니다.'
            });
        }

        res.status(200).json({
            success: true,
            data: receipt
        });

    } catch (error) {
        console.error('영수증 상세 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 상세 조회에 실패했습니다.',
            error: error.message
        });
    }
});

// 새 영수증 추가
app.post('/receipts', async(req, res) => {
    try {
        const {
            title,
            description,
            amount,
            date,
            time,
            type,
            category,
            paymentMethod,
            creditCardId,
            userId,
            userName,
            projectId,
            projectName,
            route,
            attachmentUrls = [],
            // StepperModal 확장 필드들
            stepperDateTime,
            isSplitPayment = false,
            myAmount,
            isMultiPersonPayment = false,
            participants = [],
            cardCompany,
            cardCompanyOther,
            cardNumber,
            bankName,
            bankNameOther,
            accountNumber
        } = req.body;

        // 필수 필드 검증
        if (!title || !amount || !date || !type || !category || !paymentMethod || !userId || !userName) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다.'
            });
        }

        // 법인카드 결제인 경우 creditCardId 필수
        if (paymentMethod === 'CORPORATE_CARD' && !creditCardId) {
            return res.status(400).json({
                success: false,
                message: '법인카드 결제시 카드 정보가 필요합니다.'
            });
        }

        const receipt = new Receipt({
            title,
            description,
            amount: parseFloat(amount),
            date: new Date(date),
            time,
            type,
            category,
            paymentMethod,
            creditCardId: (paymentMethod === 'CORPORATE_CARD' && creditCardId) ? creditCardId : null,
            userId,
            userName,
            projectId: projectId || null,
            projectName: projectName || null,
            route: type === 'TAXI' ? route : null,
            attachmentUrls,
            status: 'PENDING',
            
            // StepperModal 확장 필드들
            stepperDateTime: stepperDateTime || null,
            isSplitPayment: isSplitPayment || false,
            myAmount: myAmount ? parseFloat(myAmount) : null,
            isMultiPersonPayment: isMultiPersonPayment || false,
            participants: participants || [],
            cardCompany: cardCompany || null,
            cardCompanyOther: cardCompanyOther || null,
            cardNumber: cardNumber || null,
            bankName: bankName || null,
            bankNameOther: bankNameOther || null,
            accountNumber: accountNumber || null
        });

        const savedReceipt = await receipt.save();

        // 생성된 영수증을 populate하여 반환
        const populatedReceipt = await Receipt.findById(savedReceipt._id)
            .populate('userId', 'name email')
            .populate('projectId', 'title')
            .populate('creditCardId', 'cardName number label');

        res.status(201).json({
            success: true,
            message: '영수증이 성공적으로 등록되었습니다.',
            data: populatedReceipt
        });

    } catch (error) {
        console.error('영수증 등록 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 등록에 실패했습니다.',
            error: error.message
        });
    }
});

// 영수증 수정
app.put('/receipts/:id', async(req, res) => {
    try {
        const receiptId = req.params.id;
        const updateData = req.body;

        const existingReceipt = await Receipt.findById(receiptId);
        if (!existingReceipt) {
            return res.status(404).json({
                success: false,
                message: '영수증을 찾을 수 없습니다.'
            });
        }

        // 상태별 특별 처리
        if (updateData.status === 'APPROVED') {
            // 승인으로 변경하는 경우 승인 정보 추가
            updateData.approvedAt = new Date();
            updateData.rejectionReason = null;
            // approvedBy는 프론트엔드에서 전달받음
        } else if (updateData.status && updateData.status !== 'APPROVED') {
            // 승인이 아닌 다른 상태로 변경하는 경우 승인 정보 제거
            updateData.approvedBy = null;
            updateData.approvedAt = null;
            // 거절 상태가 아니라면 거절 사유도 제거
            if (updateData.status !== 'REJECTED') {
                updateData.rejectionReason = null;
            }
        }

        // 금액이 있는 경우 숫자로 변환
        if (updateData.amount) {
            updateData.amount = parseFloat(updateData.amount);
        }

        // 날짜가 있는 경우 Date 객체로 변환
        if (updateData.date) {
            updateData.date = new Date(updateData.date);
        }

        const updatedReceipt = await Receipt.findByIdAndUpdate(
                receiptId,
                updateData, { new: true, runValidators: true }
            ).populate('userId', 'name email')
            .populate('projectId', 'title')
            .populate('creditCardId', 'cardName number label')
            .populate('approvedBy', 'name email');

        res.status(200).json({
            success: true,
            message: '영수증이 성공적으로 수정되었습니다.',
            data: updatedReceipt
        });

    } catch (error) {
        console.error('영수증 수정 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 수정에 실패했습니다.',
            error: error.message
        });
    }
});



// 영수증 승인
app.patch('/receipts/:id/approve', async(req, res) => {
    try {
        const receiptId = req.params.id;
        const { approvedBy } = req.body; // 승인자 ID

        const receipt = await Receipt.findById(receiptId);
        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: '영수증을 찾을 수 없습니다.'
            });
        }

        if (receipt.status === 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: '이미 승인된 영수증입니다.'
            });
        }

        const updatedReceipt = await Receipt.findByIdAndUpdate(
                receiptId, {
                    status: 'APPROVED',
                    approvedBy,
                    approvedAt: new Date(),
                    rejectionReason: null
                }, { new: true }
            ).populate('userId', 'name email')
            .populate('projectId', 'title')
            .populate('creditCardId', 'cardName number label')
            .populate('approvedBy', 'name email');

        res.status(200).json({
            success: true,
            message: '영수증이 승인되었습니다.',
            data: updatedReceipt
        });

    } catch (error) {
        console.error('영수증 승인 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 승인에 실패했습니다.',
            error: error.message
        });
    }
});

// 영수증 거절
app.patch('/receipts/:id/reject', async(req, res) => {
    try {
        const receiptId = req.params.id;
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: '거절 사유를 입력해주세요.'
            });
        }

        const receipt = await Receipt.findById(receiptId);
        if (!receipt) {
            return res.status(404).json({
                success: false,
                message: '영수증을 찾을 수 없습니다.'
            });
        }

        const updatedReceipt = await Receipt.findByIdAndUpdate(
                receiptId, {
                    status: 'REJECTED',
                    rejectionReason,
                    approvedBy: null,
                    approvedAt: null
                }, { new: true }
            ).populate('userId', 'name email')
            .populate('projectId', 'title')
            .populate('creditCardId', 'cardName number label');

        res.status(200).json({
            success: true,
            message: '영수증이 거절되었습니다.',
            data: updatedReceipt
        });

    } catch (error) {
        console.error('영수증 거절 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 거절에 실패했습니다.',
            error: error.message
        });
    }
});

// 영수증 통계 조회
app.get('/receipts/stats/summary', async(req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        const matchStage = {};
        if (type && type !== 'all') matchStage.type = type;
        if (startDate || endDate) {
            matchStage.date = {};
            if (startDate) matchStage.date.$gte = new Date(startDate);
            if (endDate) matchStage.date.$lte = new Date(endDate);
        }

        // 상태별 통계
        const statusStats = await Receipt.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // 타입별 통계
        const typeStats = await Receipt.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // 카테고리별 통계
        const categoryStats = await Receipt.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // 전체 통계
        const totalStats = await Receipt.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                statusStats,
                typeStats,
                categoryStats,
                totalStats: totalStats[0] || { totalCount: 0, totalAmount: 0, avgAmount: 0 }
            }
        });

    } catch (error) {
        console.error('영수증 통계 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '영수증 통계 조회에 실패했습니다.',
            error: error.message
        });
    }
});

// 월별 트렌드 조회
app.get('/receipts/stats/monthly', async(req, res) => {
    try {
        const { type, year = new Date().getFullYear() } = req.query;

        const matchStage = {
            date: {
                $gte: new Date(`${year}-01-01`),
                $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
        };

        if (type && type !== 'all') matchStage.type = type;

        const monthlyStats = await Receipt.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $month: '$date' },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // 12개월 데이터로 채우기
        const fullYearStats = Array.from({ length: 12 }, (_, i) => {
            const monthData = monthlyStats.find(stat => stat._id === i + 1);
            return {
                month: i + 1,
                count: monthData ? monthData.count : 0,
                totalAmount: monthData ? monthData.totalAmount : 0
            };
        });

        res.status(200).json({
            success: true,
            data: fullYearStats
        });

    } catch (error) {
        console.error('월별 트렌드 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '월별 트렌드 조회에 실패했습니다.',
            error: error.message
        });
    }
});


// ============================================
// Department API 엔드포인트들
// ============================================

// 부서 목록 조회
app.get('/departments', async(req, res) => {
    try {
        const departments = await Department.find({}).sort({ name: 1 });
        res.status(200).json(departments);
    } catch (error) {
        console.error('부서 목록 조회 실패:', error);
        res.status(500).json({ message: '부서 목록 조회에 실패했습니다.' });
    }
});

// 부서 추가
app.post('/departments', async(req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: '부서명을 입력해주세요.' });
        }

        // 중복 부서명 확인
        const existingDept = await Department.findOne({ name: name.trim() });
        if (existingDept) {
            return res.status(400).json({ message: '이미 존재하는 부서명입니다.' });
        }

        const newDepartment = new Department({
            name: name.trim()
        });

        await newDepartment.save();
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error('부서 추가 실패:', error);
        res.status(500).json({ message: '부서 추가에 실패했습니다.' });
    }
});

// 부서 수정
app.put('/departments/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: '부서명을 입력해주세요.' });
        }

        // 기존 부서 정보 조회 (이름 변경 전)
        const oldDepartment = await Department.findById(id);
        if (!oldDepartment) {
            return res.status(404).json({ message: '부서를 찾을 수 없습니다.' });
        }

        const oldName = oldDepartment.name;
        const newName = name.trim();

        // 중복 부서명 확인 (자기 자신 제외)
        const existingDept = await Department.findOne({ 
            name: newName, 
            _id: { $ne: id } 
        });
        if (existingDept) {
            return res.status(400).json({ message: '이미 존재하는 부서명입니다.' });
        }

        // 부서 정보 업데이트
        const updatedDepartment = await Department.findByIdAndUpdate(
            id,
            { name: newName },
            { new: true }
        );

        // 해당 부서에 속한 모든 사용자의 department 값도 업데이트
        if (oldName !== newName) {
            await User.updateMany(
                { 
                    $or: [
                        { department: oldName },
                        { 'department.name': oldName }
                    ]
                },
                { department: newName }
            );
            console.log(`부서명 변경: "${oldName}" → "${newName}" - 관련 사용자들의 department 값도 업데이트됨`);
        }

        res.status(200).json(updatedDepartment);
    } catch (error) {
        console.error('부서 수정 실패:', error);
        res.status(500).json({ message: '부서 수정에 실패했습니다.' });
    }
});

// 부서 삭제
app.delete('/departments/:id', async(req, res) => {
    try {
        const { id } = req.params;
        
        // 부서 정보 조회
        const department = await Department.findById(id);
        if (!department) {
            return res.status(404).json({ message: '부서를 찾을 수 없습니다.' });
        }

        // 해당 부서에 속한 사용자가 있는지 확인
        const usersInDepartment = await User.countDocuments({
            $or: [
                { department: department.name },
                { 'department.name': department.name }
            ]
        });

        if (usersInDepartment > 0) {
            return res.status(400).json({ 
                message: `해당 부서에 속한 직원이 ${usersInDepartment}명 있습니다. 모든 직원을 다른 부서로 이동하거나 부서를 해제한 후 삭제해주세요.` 
            });
        }

        // 부서 삭제
        const deletedDepartment = await Department.findByIdAndDelete(id);
        res.status(200).json({ 
            message: '부서가 성공적으로 삭제되었습니다.',
            deletedDepartment 
        });
    } catch (error) {
        console.error('부서 삭제 실패:', error);
        res.status(500).json({ message: '부서 삭제에 실패했습니다.' });
    }
});