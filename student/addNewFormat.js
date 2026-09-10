// addNewFormat.js

// 전화번호 형식
export function formatMobile(value) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);

    if (numbers.length <= 3) {
        return numbers;
    }

    if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

// 날짜 형식
export function formatDateInput(value) {
    const numbers = value.replace(/\D/g, "").slice(0, 8);

    if (numbers.length <= 4) {
        return numbers;
    }

    if (numbers.length <= 6) {
        return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    }

    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`;
}

// 오늘 날짜
export function setToday(input) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    input.value = `${year}-${month}-${day}`;
}