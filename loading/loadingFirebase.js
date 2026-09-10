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

// 최근 5일 날짜
function getRecentDateKeys() {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 5; i++) {
        const date = new Date(today);

        date.setDate(
            date.getDate() - i
        );

        dates.push(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        );
    }

    return dates;
}

// 반별 학생 목록 미리 가져오기
async function loadClassStudents(classNames) {
    const classStudent = {};

    await Promise.all(
        classNames.map(
            async className => {
                const snapshot = await get(
                    ref(
                        db,
                        `class/math/${className}/student`
                    )
                );

                classStudent[className] = snapshot.exists()
                    ? snapshot.val()
                    : {};
            }
        )
    );

    sessionStorage.setItem(
        "classStudent",
        JSON.stringify(classStudent)
    );

    return classStudent;
}

// 반별 관리 데이터 미리 가져오기
async function loadClassManagement(classNames) {
    const classManagement = {};
    const dateKeys = getRecentDateKeys();

    await Promise.all(
        classNames.map(
            async className => {
                classManagement[className] = {};

                await Promise.all(
                    dateKeys.map(
                        async dateKey => {
                            const snapshot = await get(
                                ref(
                                    db,
                                    `class/math/${className}/management/${dateKey}`
                                )
                            );

                            classManagement[className][dateKey] =
                                snapshot.exists()
                                    ? snapshot.val()
                                    : {};
                        }
                    )
                );
            }
        )
    );

    sessionStorage.setItem(
        "classManagement",
        JSON.stringify(classManagement)
    );

    return classManagement;
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
    const classInfo = deviceInfo.class?.math || {};
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

    await loadClassStudents(
        classNames
    );

    await loadClassManagement(
        classNames
    );

    return true;
}

// 등록 후 해당 반 학생 목록 다시 가져오기
export async function refreshClassStudent(className) {
    if (!className) {
        return false;
    }

    const snapshot = await get(
        ref(
            db,
            `class/math/${className}/student`
        )
    );

    const classStudent = JSON.parse(
        sessionStorage.getItem("classStudent") || "{}"
    );

    classStudent[className] = snapshot.exists()
        ? snapshot.val()
        : {};

    sessionStorage.setItem(
        "classStudent",
        JSON.stringify(classStudent)
    );

    return true;
}

// 해당 반 + 날짜 관리 데이터 다시 가져오기
export async function refreshClassManagement(
    className,
    dateKey
) {
    if (!className || !dateKey) {
        return false;
    }

    const snapshot = await get(
        ref(
            db,
            `class/math/${className}/management/${dateKey}`
        )
    );

    const classManagement = JSON.parse(
        sessionStorage.getItem("classManagement") || "{}"
    );

    if (!classManagement[className]) {
        classManagement[className] = {};
    }

    classManagement[className][dateKey] =
        snapshot.exists()
            ? snapshot.val()
            : {};

    sessionStorage.setItem(
        "classManagement",
        JSON.stringify(classManagement)
    );

    return true;
}