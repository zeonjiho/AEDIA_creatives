const express = require('express')
const cors = require('cors')
const https = require('https')
const fs = require('fs')
const mongoose = require('mongoose')
const multer = require('multer')
const sharp = require('sharp')
const path = require('path')
const nodemailer = require('nodemailer')
const axios = require('axios')
const cheerio = require('cheerio')
const jwt = require('jsonwebtoken')

const app = express()

const port = 8787;

const User = require('./models/User')
const Hyperlink = require('./models/Hyperlink')

//로컬 버전 http 서버
app.listen(port, () => {
    console.log(`\x1b[35mServer is running on port \x1b[32m${port}\x1b[0m`)
})

//배포 버전 https 서버
// const sslKey = fs.readFileSync('/etc/letsencrypt/live/beta.hyper.bz/privkey.pem');
// const sslCert = fs.readFileSync('/etc/letsencrypt/live/beta.hyper.bz/fullchain.pem');
// const credentials = { key: sslKey, cert: sslCert };
// https.createServer(credentials, app).listen(port, () => {
//     console.log(`\x1b[32mhttps \x1b[35mServer is running on port \x1b[32m${port}\x1b[0m`);
// });


//MongoDB 연결
mongoose.connect('mongodb+srv://dominic:raul0709@hypercluster.s8pnp.mongodb.net/hyper')
    .then(() => {
        const db = mongoose.connection;
        console.log(`\x1b[35mMongoDB Connected in \x1b[32m${db.name}\x1b[0m ${new Date().toLocaleString()}`)
    })
    .catch((err => console.log(err)))


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// multer 관련 미들웨어 설정
const createStorage = (subDirectory) => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = `./uploads/${subDirectory}`;

            // uploads 디렉토리 확인 및 생성
            if (!fs.existsSync('./uploads/')) {
                fs.mkdirSync('./uploads/');
            }

            // 하위 디렉토리 확인 및 생성
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath);
            }

            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const filename = uniqueSuffix + ext;
            cb(null, filename);
        }
    });
};

// 각 용도별 multer 인스턴스 생성
const avatarUpload = multer({
    storage: createStorage('avatar'),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// 다른 용도의 업로드를 위한 인스턴스들 (예시)
const postUpload = multer({
    storage: createStorage('posts'),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    }
});

const documentUpload = multer({
    storage: createStorage('documents'),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
    }
});

// 썸네일 업로드를 위한 multer 인스턴스 생성
const thumbnailUpload = multer({
    storage: createStorage('thumbnails'),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

app.use('/uploads', express.static('uploads'))


//이메일 관련 함수
const transporter = nodemailer.createTransport({
    service: 'Gmail', // 로컬
    auth: {
        user: 'bilvin0709@gmail.com', // 로컬
        pass: 'sxqnoskwzrzzbbwb', // 로컬
    }
})

const sendEmail = async (to, subject, htmlContent, attachments) => {
    try {
        const info = await transporter.sendMail({
            from: 'HYPER bilvin0709@gmail.com', // 보내는 이메일 주소
            to, // 받는 이메일 주소
            subject, // 이메일 제목
            html: htmlContent, // 이메일 내용(html 형식)
            ...(attachments && attachments.length > 0 && { attachments }) //첨부파일. 조건부 전개 연산자(...)를 사용하여 조건에 부합하지 않는 경우 필드 자체가 생성되지 않음.
        });

        console.log('이메일이 성공적으로 보내졌습니다:', info.response)
        return { success: true, response: info.response }
    } catch (error) {
        console.error('이메일 보내기 실패:', error)
        return { success: false, error }
    }
};



// API
app.get('/hello', async (req, res) => {
    res.send('hello')
})

app.post('/user/signup', async (req, res) => {
    const { email, userName, password, birthday, gender, occupation, phone, language } = req.body
    const birthdayToDate = new Date(birthday)
    try {
        const alreadyEmail = await User.findOne({ email })
        if (alreadyEmail) {
            res.status(201).json({ message: 'email' })
            return
        }
        const alreadyUserName = await User.findOne({ userName })
        if (alreadyUserName) {
            res.status(201).json({ message: 'userName' })
            return
        }
        const genderToNum = parseInt(gender)
        const user = new User({ email, userName, password, birthday: birthdayToDate, gender: genderToNum, occupation, phone, language })
        const savedUser = await user.save()
        if (savedUser) {
            res.status(200).json()
        } else {
            res.status(201).json({ message: 'error' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.post('/user/login', async (req, res) => {
    const { email, phone, userName, password } = req.body
    try {
        let identifierType;
        if (email) {
            identifierType = 'email'
        } else if (phone) {
            identifierType = 'phone'
        } else if (userName) {
            identifierType = 'userName'
        }
        const user = await User.findOne({ [identifierType]: req.body[identifierType] })
        if (user && user.password === password) {
            user.lastVisit = Date.now()
            await user.save()
            const token = jwt.sign({ userId: user._id }, 'quarter_mile', { expiresIn: '1h' });
            res.status(200).json({ token })
        } else {
            res.status(201).json({ message: 'no user' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.post('/user/validation-user-status-and-update-last-visit', async (req, res) => {
    const { userId } = req.body
    try {
        const user = await User.findById(userId)
        // 마지막 방문 날짜와 현재 날짜의 차이 계산 (밀리초 단위)
        const timeDiff = Date.now() - user.lastVisit
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24) // 일 단위로 변환
        if (daysDiff >= 7) {
            res.status(201).json()
            return
        }
        // 우선은 0인지 아닌지만 검증
        if (!user || user.status !== 0) {
            res.status(201).json()
            return
        }

        // findByIdAndUpdate를 사용하여 atomic하게 업데이트
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { lastVisit: Date.now() },
            { new: true }
        )

        res.status(200).json(updatedUser)
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.post('/fetch-metadata', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        res.status(201).json({ message: 'no url' })
        console.log('no url')
        return
    }
    try {
        // URL에서 오리진만 추출
        const { origin } = new URL(url);

        console.log(origin)

        // 오리진 기준으로 메타데이터 가져오기
        const { data: html } = await axios.get(origin);
        const $ = cheerio.load(html);

        let image = $('meta[property="og:image"]').attr('content');

        // 이미지 URL이 http 또는 https로 시작하지 않을 경우 처리
        if (image && !/^https?:\/\//i.test(image)) {
            image = `${origin}${image.startsWith('/') ? image : `/${image}`}`;
        }

        const metadata = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text(),
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
            image, // 변환된 이미지 URL
        };

        res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metadata' });
        console.log(error)
    }
});

app.get('/user/get-info-by-userName', async (req, res) => {
    const { userName } = req.query
    try {
        const user = await User.findOne(
            { userName },
            { password: 0 }  // password 필드만 제외하고 모든 필드를 가져옴
        )
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.get('/user/get-info-by-userId', async (req, res) => {
    const { userId } = req.query
    try {
        const user = await User.findById(
            userId,
            { password: 0 }  // password 필드만 제외하고 모든 필드를 가져옴
        )
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }
        res.status(200).json(user)
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.post('/user/update-user-info', async (req, res) => {
    const { userId, data } = req.body
    try {
        console.log('data : ', data)
        // 아바타가 null로 설정되었고 이전 아바타 파일이 있는 경우
        if (data.avatar === null && data.oldAvatar) {
            console.log('hello')
            const oldPath = path.join(__dirname, 'uploads/avatar', data.oldAvatar);
            if (fs.existsSync(oldPath) && !oldPath.includes('default')) {
                fs.unlinkSync(oldPath);
            }
        }

        // oldAvatar 필드 제거 (DB에 저장하지 않기 위해)
        delete data.oldAvatar;

        const user = await User.findByIdAndUpdate(userId, data)
        if (user) {
            res.status(200).json({ message: 'success' })
        } else {
            res.status(201).json({ message: 'error' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

// 아바타 업로드를 위한 엔드포인트
app.post('/user/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // 기존 파일 삭제 로직
        if (req.body.oldAvatar) {
            const oldPath = path.join(__dirname, 'uploads/avatar', req.body.oldAvatar);
            if (fs.existsSync(oldPath) && !oldPath.includes('default')) {
                fs.unlinkSync(oldPath);
            }
        }

        // 이미지 최적화
        await sharp(req.file.path)
            .resize(120, 120, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 90 })
            // .toFormat(req.file.mimetype.split('/')[1]) // 원본 이미지 형식 유지
            .toFile(path.resolve(req.file.destination, 'resized-' + req.file.filename));

        // 원본 파일 삭제하고 최적화된 파일을 사용
        fs.unlinkSync(req.file.path);
        fs.renameSync(
            path.resolve(req.file.destination, 'resized-' + req.file.filename),
            req.file.path
        );

        res.status(200).json({
            filename: req.file.filename
        });
    } catch (err) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error(err);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// 썸네일 업로드 엔드포인트
app.post('/upload-thumbnail', thumbnailUpload.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const originalFilename = req.file.filename;
        const thumbFilename = originalFilename.replace(/(\.[^.]+)$/, '-thumb$1');

        // 2048px 버전 생성
        await sharp(req.file.path)
            .resize(2048, null, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 100 })
            .toFile(path.resolve(req.file.destination, 'temp-' + originalFilename));

        // 400px 썸네일 버전 생성
        await sharp(req.file.path)
            .resize(400, null, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 90 })
            .toFile(path.resolve(req.file.destination, thumbFilename));

        // 안전한 파일 삭제 함수
        const safeUnlink = async (filePath) => {
            try {
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                }
            } catch (err) {
                console.log(`Failed to delete ${filePath}:`, err);
                // 에러가 발생해도 계속 진행
            }
        };

        // 파일 정리 작업을 비동기로 처리
        await safeUnlink(req.file.path);
        await fs.promises.rename(
            path.resolve(req.file.destination, 'temp-' + originalFilename),
            path.resolve(req.file.destination, originalFilename)
        );

        res.status(200).json({
            filename: originalFilename
        });
    } catch (err) {
        // 에러 발생 시 생성된 파일들 정리
        const filesToClean = [
            req.file.path,
            path.resolve(req.file.destination, 'temp-' + req.file.filename),
            path.resolve(req.file.destination, req.file.filename),
            path.resolve(req.file.destination, req.file.filename.replace(/(\.[^.]+)$/, '-thumb$1'))
        ];

        // 안전한 파일 삭제 처리
        for (const file of filesToClean) {
            try {
                if (fs.existsSync(file)) {
                    await fs.promises.unlink(file);
                }
            } catch (cleanupErr) {
                console.log(`Cleanup failed for ${file}:`, cleanupErr);
            }
        }

        console.error(err);
        res.status(500).json({ message: 'Error uploading file' });
    }
});

app.post('/add-hyperlink', async (req, res) => {
    const { userId, title, isPublic, dataType, content, contentType, tags, description, thumbnail, thumbnailRatio, codeLanguage } = req.body
    try {
        // 기본 데이터 객체 생성
        const hyperlinkData = {
            poster: userId,
            visibility: isPublic ? 'public' : 'private',
            content,
            contentType,
            tags,
            description,
            thumbnail, // 썸네일 파일명 저장
            createdAt: Date.now(),
        }

        if (dataType === 'collection') {
            hyperlinkData.dataType = 'collection'
        }

        if (title) {
            hyperlinkData.title = title
        }
        if (thumbnailRatio) {
            hyperlinkData.thumbnailRatio = thumbnailRatio
        }
        if (contentType === 'code') {
            hyperlinkData.codeLanguage = codeLanguage
        }

        // 임시. 추후 pasteModal에서 dataType을 hyperlink로 받아오면 수정할 것
        if (dataType !== 'collection') {
            const user = await User.findByIdAndUpdate(
                userId,
                { $inc: { 'stats.posts': 1 } },
                { new: true }
            )
            if (!user) {
                return res.status(400).json({ message: 'error' })
            }
        }

        const hyperlink = new Hyperlink(hyperlinkData)
        const savedHyperlink = await hyperlink.save()

        if (savedHyperlink) {
            res.status(200).json({ message: 'success' })
        } else {
            res.status(400).json({ message: 'error' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
})

app.get('/get-all-hyperlinks', async (req, res) => {
    const { from, target, currentUserId } = req.query
    try {
        let hyperlinks;
        if (from === 'home') {
            // home인 경우 public 항목만 조회
            hyperlinks = await Hyperlink.find({ visibility: 'public' })
                .populate('poster', 'userName fullName _id avatar');
        } else if (from === 'posts' && target && currentUserId) {
            const targetUser = await User.findOne({ userName: target })
            if (targetUser._id.toString() === currentUserId) {
                hyperlinks = await Hyperlink.find({ poster: targetUser._id, dataType: 'hyperlink' })
                    .populate('poster', 'userName fullName _id avatar');
            } else {
                hyperlinks = await Hyperlink.find({
                    $and: [
                        { visibility: 'public' },
                        { poster: targetUser._id },
                        { dataType: 'hyperlink' }
                    ]
                }).populate('poster', 'userName fullName _id avatar');
            }
        } else if (from === 'likes') {
            const user = await User.findById(target);
            // 먼저 user.likeList의 순서대로 하이퍼링크를 가져옴
            hyperlinks = await Promise.all(
                user.likeList.map(id =>
                    Hyperlink.findById(id)
                        .populate('poster', 'userName fullName _id avatar')
                )
            );
            // null 값 제거 (삭제된 하이퍼링크가 있을 수 있음)
            hyperlinks = hyperlinks.filter(link => link !== null);
        } else if (from === 'collections' && target && currentUserId) {
            const targetUser = await User.findOne({ userName: target })
            if (targetUser._id.toString() === currentUserId) {
                hyperlinks = await Hyperlink.find({ poster: targetUser._id, dataType: 'collection' })
                    .populate('poster', 'userName fullName _id avatar');
            } else {
                hyperlinks = await Hyperlink.find({
                    $and: [
                        { visibility: 'public' },
                        { poster: targetUser._id },
                        { dataType: 'collection' }
                    ]
                }).populate('poster', 'userName fullName _id avatar');
            }
        } else if (from === 'collections_selector' && currentUserId) {
            hyperlinks = await Hyperlink.find({ poster: currentUserId, dataType: 'collection' })
                .populate('poster', 'userName fullName _id avatar');
        } else {
            // from이 없는 경우 빈 배열 반환
            return res.status(200).json([]);
        }

        res.status(200).json(hyperlinks);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

app.post('/toggle-like', async (req, res) => {
    const { hyperlinkId, userId } = req.body;
    try {
        // 모든 업데이트를 한 번의 트랜잭션으로 처리
        const session = await mongoose.startSession();
        const result = await session.withTransaction(async () => {
            // hyperlink와 user 정보를 동시에 가져오기
            const [hyperlink, user] = await Promise.all([
                Hyperlink.findById(hyperlinkId).session(session),
                User.findById(userId).session(session)
            ]);

            if (!hyperlink) {
                throw new Error('Hyperlink not found');
            }

            const likeIndex = hyperlink.likes.findIndex(id => id.equals(userId));
            const isAdding = likeIndex === -1;

            // hyperlink 업데이트
            if (isAdding) {
                hyperlink.likes.push(userId);
                user.likeList.push(hyperlinkId);
            } else {
                hyperlink.likes.splice(likeIndex, 1);
                user.likeList = user.likeList.filter(id => !id.equals(hyperlinkId));
            }

            // 모든 저장 작업을 병렬로 실행
            await Promise.all([
                hyperlink.save(),
                user.save(),
                User.findByIdAndUpdate(
                    hyperlink.poster,
                    { $inc: { 'stats.likes': isAdding ? 1 : -1 } },
                    { new: true, session }
                )
            ]);

            return { likes: hyperlink.likes.length, isLiked: isAdding };
        });

        session.endSession();
        res.status(200).json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});




// test api

// const testSendEmail = async () => {
//     try {
//         const htmlContent = `
//         <div style="line-height: 1.6;">
//             <h1>HYPER 테스트</h1>
//             <p>test api.</p>
//             <p>&nbsp;</p>
//             <p>hello, world</p>
//         </div>
//     `
//         const emailResult = await sendEmail(
//             'nalkeok@naver.com',
//             'hyper 테스트',
//             htmlContent,
//             // attachments
//         )
//         if (emailResult.success) {
//             // res.status(200).json({ message: '이메일이 성공적으로 보내졌습니다.' })
//             console.log('이메일 전송 성공')
//         } else {
//             // res.status(500).json({ message: '이메일 보내기 실패', error: emailResult.error })
//             console.log('이메일 전송 실패')
//         }
//     } catch (err) {
//         console.log(err)
//     }
// }


// const removeAllHyperlink = async () => {
//     const hyperlinks = await Hyperlink.find()
//     for (const hyperlink of hyperlinks) {
//         await Hyperlink.findByIdAndDelete(hyperlink._id)
//         console.log(`${hyperlink.title} 삭제`)
//     }
// }
// removeAllHyperlink()


// const addDataType = async () => {
//     const hyperlinks = await Hyperlink.find()
//     for (const hyperlink of hyperlinks) {
//         hyperlink.dataType = 'hyperlink'
//         await hyperlink.save()
//     }
// }
// addDataType()