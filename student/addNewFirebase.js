// addNewFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";
import { refreshClassStudent } from "../loading/loadingFirebase.js";

// 학생 이름 조회
export async function getStudentNames() {
    const snapshot = await get(
        ref(
            db,
            "student/name"
        )
    );

    return snapshot.exists()
        ? snapshot.val()
        : {};
}

// 전화번호 중복 확인
export async function checkStudentMobile(mobile) {
    const snapshot = await get(
        ref(
            db,
            `student/${mobile}`
        )
    );

    return snapshot.exists();
}

// 수학 수업 조회
export async function getMathClasses() {
    const snapshot = await get(
        ref(
            db,
            "class/math"
        )
    );

    return snapshot.exists()
        ? snapshot.val()
        : {};
}

// 학생 등록
export async function saveStudent(
    mobile,
    name,
    birthday,
    enrollment,
    className
) {
    const studentData = {
        name,
        mobile,
        birthday,
        enrollment,
        class: {
            math: className
        },
        loginCount: 0,
        totalG: 0,
        totalP: 0,
        withdrawal: ""
    };

    const updates = {
        [`student/${mobile}`]: studentData,
        [`student/name/${name}`]: mobile,

        // 반별 학생 목록
        [`class/math/${className}/student/${mobile}`]: name
    };

    await update(
        ref(db),
        updates
    );

    await refreshClassStudent(
        className
    );
}