const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    bio: {
        type: String,
        default: ''
    },
    education: {
        type: String,
        default: ''
    },
    occupation: {
        type: String,
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    stats: {
        studyHours: {
            type: Number,
            default: 0
        },
        pomodoroCompleted: {
            type: Number,
            default: 0
        },
        tasksCompleted: {
            type: Number,
            default: 0
        },
        codesCompiled: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema); 