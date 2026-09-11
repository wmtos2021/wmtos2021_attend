// addNewVerify.js
import {
    getStudentNames,
    checkStudentMobile
} from "./addNewFirebase.js";

// 이름 입력 검증
export function validateName(name) {
    return Boolean(
        name &&
        name.trim()
    );
}

// 이름 중복 확인
export async function verifyStudentName(name) {
    const existingNames = await getStudentNames();
    const inputName = name.trim();
    const baseName = inputName.replace(/\d/g, "");

    const matchedNames = Object.keys(existingNames).filter(
        existingName =>
            existingName.replace(/\d/g, "") === baseName
    );

    if (matchedNames.length === 0) {
        return {
            name: baseName,
            count: 0,
            duplicate: false
        };
    }

    const usedNumbers = matchedNames.map(
        existingName => {
            const suffixMatch = existingName.match(/(\d+)$/);

            return suffixMatch
                ? Number(suffixMatch[1])
                : 0;
        }
    );

    let nextNumber = Math.max(0, ...usedNumbers) + 1;
    let newName = `${baseName}${nextNumber}`;

    while (
        Object.prototype.hasOwnProperty.call(
            existingNames,
            newName
        )
    ) {
        nextNumber++;
        newName = `${baseName}${nextNumber}`;
    }

    return {
        name: newName,
        count: matchedNames.length,
        duplicate: true
    };
}

// 전화번호 형식 검증
export function validateMobile(mobile) {
    return /^010-\d{4}-\d{4}$/.test(
        mobile.trim()
    );
}

// 전화번호 중복 확인
export async function verifyStudentMobile(mobile) {
    return await checkStudentMobile(
        mobile.trim()
    );
}

// 날짜 검증
export function validateDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const day = Number(value.slice(8, 10));
    const date = new Date(
        year,
        month - 1,
        day
    );

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

// 학생 등록 기본 검증
export function validateStudentInput({
    name,
    mobile,
    birthday,
    enrollment,
    studentClass
}) {
    if (!validateName(name)) {
        return {
            valid: false,
            message: "이름을 입력해주세요.",
            target: "name"
        };
    }

    if (!validateMobile(mobile)) {
        return {
            valid: false,
            message: "전화번호를 확인해주세요.",
            target: "mobile"
        };
    }

    if (!validateDate(birthday)) {
        return {
            valid: false,
            message: "생년월일을 확인해주세요.",
            target: "birthday"
        };
    }

    if (!validateDate(enrollment)) {
        return {
            valid: false,
            message: "등록일을 확인해주세요.",
            target: "enrollment"
        };
    }

    if (!studentClass) {
        return {
            valid: false,
            message: "수업을 선택하세요.",
            target: "class"
        };
    }

    return {
        valid: true
    };
}