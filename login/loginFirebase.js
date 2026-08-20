// loginFirebase.js

import {
    ref,
    get,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    db,
    auth
} from "../firebase.js";


// Firebase Auth용 이메일 생성
function getAuthEmail(phone) {
    return `${phone}@wmtos2026.firebaseapp.com`;
}


// 학생 정보 가져오기
export async function getStudent(phone) {
    const snapshot =
        await get(
            ref(
                db,
                `student/${phone}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// 신규회원 계정 생성
export async function createStudentAccount(
    phone,
    password
) {
    try {
        // 학생 정보 확인
        const student =
            await getStudent(phone);

        if (!student) {
            return false;
        }

        // 현재 Device ID 가져오기
        // ※ 여기서는 절대 새로 생성하지 않음
        const deviceId =
            localStorage.getItem("deviceId");

        if (!deviceId) {
            return false;
        }

        // Firebase Auth 계정 생성
        const email = getAuthEmail(phone);

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        // Auth 프로필 이름 설정
        await updateProfile(
            user,
            {
                displayName:
                    student.name || ""
            }
        );

        // 학생 정보 저장
        await update(
            ref(
                db,
                `student/${phone}`
            ),
            {
                uid: user.uid,
                deviceId: deviceId
            }
        );

        // Device ID에 회원정보 연결
        await update(
            ref(
                db,
                `deviceId/${deviceId}`
            ),
            {
                uid: user.uid,
                mobile: phone,
                name: student.name || "",
                class: student.class || ""
            }
        );

        // UID별 회원 정보
        await update(
            ref(
                db,
                `authUser/${user.uid}`
            ),
            {
                name: student.name || "",
                mobile: phone
            }
        );

        return true;

    } catch (error) {
        console.error(
            "createStudentAccount 오류:",
            error
        );

        return false;
    }
}


// 기존회원 로그인
export async function loginStudent(
    phone,
    password
) {
    try {
        // 학생 정보 확인
        const student =
            await getStudent(phone);

        if (!student) {
            return false;
        }

        // 기존 UID 확인
        if (!student.uid) {
            return false;
        }

        // 현재 Device ID 가져오기
        // ※ 여기서도 절대 새로 생성하지 않음
        const deviceId =
            localStorage.getItem("deviceId");

        if (!deviceId) {
            return false;
        }

        // Firebase Auth 로그인
        const email = getAuthEmail(phone);

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        // Auth UID 확인
        if (
            user.uid !== student.uid
        ) {
            return false;
        }

        // 기존 Device ID
        const oldDeviceId =
            student.deviceId;

        // 기존 Device ID와 현재 Device ID가
        // 다른 경우 기존 Device ID 삭제
        if (
            oldDeviceId &&
            oldDeviceId !== deviceId
        ) {
            await remove(
                ref(
                    db,
                    `deviceId/${oldDeviceId}`
                )
            );
        }

        // 학생 정보에 현재 Device ID 저장
        await update(
            ref(
                db,
                `student/${phone}`
            ),
            {
                deviceId: deviceId
            }
        );

        // 현재 Device ID에 회원정보 연결
        await update(
            ref(
                db,
                `deviceId/${deviceId}`
            ),
            {
                uid: user.uid,
                mobile: phone,
                name: student.name || "",
                class: student.class || ""
            }
        );

        // UID별 회원 정보
        await update(
            ref(
                db,
                `authUser/${user.uid}`
            ),
            {
                name: student.name || "",
                mobile: phone
            }
        );

        return true;

    } catch (error) {
        return false;
    }
}