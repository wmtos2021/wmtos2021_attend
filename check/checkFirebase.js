// checkFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db,
    auth
} from "../firebase.js";

// 선생님 Device ID 확인
export function getTeacherDeviceInfo(deviceId) {
    return get(
        ref(db, `deviceId/teacher/${deviceId}`)
    );
}

// Firebase Authentication 확인
export function getAuthUser() {
    return auth.currentUser;
}