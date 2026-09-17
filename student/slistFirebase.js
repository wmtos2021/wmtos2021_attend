// slistFirebase.js
import {
    ref,
    get,
    update,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";
import { db } from "../firebase.js";

// 전체 학생 조회
export async function getAllStudents() {
    const snapshot = await get(ref(db, "student"));
    if (!snapshot.exists()) {
        return {};
    }
    return snapshot.val();
}

// 수학 전체 수업 조회
export async function getMathClasses() {
    const snapshot = await get(ref(db, "class/math"));
    if (!snapshot.exists()) {
        return {};
    }
    return snapshot.val();
}

// 학생 정보 수정
export async function updateStudent(originalStudent, updatedStudent) {
    const originalMobile = originalStudent.mobile;
    const updatedMobile = updatedStudent.mobile;
    if (!originalMobile || !updatedMobile) {
        throw new Error("학생 연락처가 없습니다.");
    }
    const studentData = {
        name: updatedStudent.name,
        birthday: updatedStudent.birthday,
        enrollment: updatedStudent.enrollment,
        className: updatedStudent.className,
        totalP: updatedStudent.point,
        totalG: updatedStudent.gold,
        loginCount: updatedStudent.loginCount
    };
    if (originalMobile === updatedMobile) {
        await update(ref(db, `student/${originalMobile}`), studentData);
        return;
    }
    await set(ref(db, `student/${updatedMobile}`), studentData);
    await remove(ref(db, `student/${originalMobile}`));
}