const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    loginId: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    phoneVisibility: {
        type: String,
        enum: ['전체', '대의원', '학급', '대의원and학급', '비공개'],
        default: '전체',
    },
    profileVisibility: {
        type: String,
        enum: ['전체', '대의원', '비공개'],
        default: '전체',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School',
    },
    // class의 타입과의 일관성을 위해 grade, class, number 모두 String으로 지정
    grade: {
        type: String,
    },
    class: {
        type: String,
    },
    number: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    pushToken: {
        token: {
            type: String,
        },
        deviceType: {
            type: String,
            enum: ['ios', 'android', 'web'],
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    roles: {
        type: Array,
        default: [],
    },
    notificationSettings: {
        notice_school: {
            type: Boolean,
            default: true,
        },
        notice_grade: {
            type: Boolean,
            default: true,
        },
        notice_class: {
            type: Boolean,
            default: true,
        },
        chatting: {
            type: String,
            enum: ['on', 'off', 'individual'],
            default: 'on',
        },
        board_school: {
            type: Boolean,
            default: true,
        },
        board_grade: {
            type: Boolean,
            default: true,
        },
        board_class: {
            type: Boolean,
            default: true,
        },
        feedback_school: {
            type: Boolean,
            default: true,
        },
        feedback_grade: {
            type: Boolean,
            default: true,
        },
        feedback_class: {
            type: Boolean,
            default: true,
        },
    },
    // 참여 중인 채팅방 목록
    chatRooms: [
        {
            room: {
                type: Schema.Types.ObjectId,
                ref: 'ChatRoom',
            },
            // 이 채팅방에 대한 알림 설정
            notifications: {
                type: Boolean,
                default: true,
            },
            // 채팅방에 참여한 시간
            joinedAt: {
                type: Date,
                default: Date.now,
            },
            // 채팅방에서 나간 시간
            leftAt: {
                type: Date,
            },
            // 활성화 상태
            isActive: {
                type: Boolean,
                default: true,
            },
            // 마지막 읽은 메시지 시간
            lastReadAt: {
                type: Date,
                default: Date.now,
            },
        }
    ],
    blockedUsers: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            blockedAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    modalSettings: {
        classRepModal: {
            hide: {
                type: Boolean,
                default: false,
            },
            hideUntil: {
                type: Date,
            }
        }
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active',
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;