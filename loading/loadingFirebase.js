// loadingFirebase.js

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";

import { getDeviceId } from "../utils.js";

// 이미지 미리 로딩
function preloadImages() {
    const imageList = [
        "../imageLogin/학원명1_투명.webp"
    ];

    imageList.forEach(src => {
        const image = new Image();
        image.src = src;
    });
}

// 선생님 기본 정보 가져오기
export async function loadTeacherData() {
    preloadImages();

    const deviceId = getDeviceId();

    if (!deviceId) {
        return false;
    }

    const deviceSnapshot = await get(
        ref(
            db,
            `deviceId/teacher/${deviceId}`
        )
    );

    if (!deviceSnapshot.exists()) {
        return false;
    }

    const deviceInfo = deviceSnapshot.val();
    const mobile = deviceInfo.mobile;

    if (!mobile) {
        return false;
    }

    const teacherSnapshot = await get(
        ref(
            db,
            `teacher/${mobile}`
        )
    );

    if (!teacherSnapshot.exists()) {
        return false;
    }

    const teacherInfo = teacherSnapshot.val();
    const classInfo = teacherInfo.class?.math || {};
    const classNames = Object.keys(classInfo);

    sessionStorage.setItem(
        "teacherInfo",
        JSON.stringify(teacherInfo)
    );

    sessionStorage.setItem(
        "teacherClass",
        JSON.stringify(classNames)
    );

    sessionStorage.setItem(
        "deviceInfo",
        JSON.stringify(deviceInfo)
    );

    return true;
}