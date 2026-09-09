// loginFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    db,
    auth
} from "../firebase.js";

// Firebase Auth용 이메일 생성
function getAuthEmail(phone) {
    return `t${phone}@wmtos2026.firebaseapp.com`;
}

// 선생님 정보 가져오기
export async function getTeacher(phone) {
    const snapshot = await get(
        ref(db, `teacher/${phone}`)
    );

    return snapshot.exists()
        ? snapshot.val()
        : null;
}

// 로그인 정보 저장
async function saveLoginData(
    phone,
    teacher,
    uid,
    deviceId,
    oldDeviceId = null
) {
    const updates = {
        [`teacher/${phone}/uid`]: uid,
        [`teacher/${phone}/deviceId`]: deviceId,
        [`deviceId/teacher/${deviceId}/uid`]: uid,
        [`deviceId/teacher/${deviceId}/mobile`]: phone,
        [`deviceId/teacher/${deviceId}/name`]: teacher.name || "",
        [`deviceId/teacher/${deviceId}/class`]: teacher.class || {},
        [`authUser/teacher/${uid}/name`]: teacher.name || "",
        [`authUser/teacher/${uid}/mobile`]: phone
    };

    if (oldDeviceId && oldDeviceId !== deviceId) {
        updates[`deviceId/teacher/${oldDeviceId}`] = null;
    }

    await update(
        ref(db),
        updates
    );
}

// 신규회원 계정 생성
export async function createTeacherAccount(
    phone,
    password
) {
    let user = null;

    try {
        const teacher = await getTeacher(phone);

        if (!teacher) {
            return {
                success: false,
                reason: "teacher"
            };
        }

        const deviceId = localStorage.getItem("deviceId");

        if (!deviceId) {
            return {
                success: false,
                reason: "device"
            };
        }

        const email = getAuthEmail(phone);

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        user = userCredential.user;

        await updateProfile(user, {
            displayName: teacher.name || ""
        });

        await saveLoginData(
            phone,
            teacher,
            user.uid,
            deviceId
        );

        return {
            success: true
        };
    } catch (error) {
        console.error(
            "선생님 계정 생성 오류:",
            error.code,
            error.message
        );

        if (user) {
            try {
                await deleteUser(user);
            } catch (deleteError) {
                console.error(
                    "Auth 계정 삭제 오류:",
                    deleteError
                );
            }
        }

        return {
            success: false,
            reason: "error"
        };
    }
}

// 기존회원 로그인
export async function loginTeacher(
    phone,
    password
) {
    try {
        const teacher = await getTeacher(phone);

        if (!teacher) {
            return {
                success: false,
                reason: "teacher"
            };
        }

        const deviceId = localStorage.getItem("deviceId");

        if (!deviceId) {
            return {
                success: false,
                reason: "device"
            };
        }

        const email = getAuthEmail(phone);

        let userCredential;

        try {
            userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );
        } catch (error) {
            console.error(
                "Firebase 선생님 로그인 오류:",
                error.code,
                error.message
            );

            return {
                success: false,
                reason: "password"
            };
        }

        const user = userCredential.user;

        // 기존 uid가 있는 선생님은 uid 일치 여부 확인
        if (
            teacher.uid &&
            user.uid !== teacher.uid
        ) {
            await signOut(auth).catch(() => {});

            return {
                success: false,
                reason: "uid"
            };
        }

        const oldDeviceId = teacher.deviceId;

        try {
            await saveLoginData(
                phone,
                teacher,
                user.uid,
                deviceId,
                oldDeviceId
            );
        } catch (error) {
            console.error(
                "선생님 로그인 데이터 저장 오류:",
                error
            );

            await signOut(auth).catch(() => {});

            return {
                success: false,
                reason: "database"
            };
        }

        return {
            success: true
        };
    } catch (error) {
        console.error(
            "선생님 로그인 처리 오류:",
            error
        );

        return {
            success: false,
            reason: "error"
        };
    }
}