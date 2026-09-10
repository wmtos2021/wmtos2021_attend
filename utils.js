// utils.js

// 버전
export const VERSION = "1.1.0";

// 학원 정보
export const ACADEMY_NAME = "위드엠투에스학원";
export const ACADEMY_ADDRESS = "경남 김해시 활천로 168, 2층";

// 서울 시간대
const TIME_ZONE = "Asia/Seoul";

// 현재 timestamp
export function getTimestamp() {
    const parts =
        new Intl.DateTimeFormat("sv-SE", {
            timeZone: TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23"
        }).formatToParts(new Date());

    const values = {};

    parts.forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`;
}

// timestamp 정보
export function getTimestampParts(timestamp) {
    if (!timestamp) {
        return null;
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const parts =
        new Intl.DateTimeFormat("en-US", {
            timeZone: TIME_ZONE,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            weekday: "short"
        }).formatToParts(date);

    const values = {};

    parts.forEach(part => {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    });

    const dayMap = {
        Sun: "sun",
        Mon: "mon",
        Tue: "tue",
        Wed: "wed",
        Thu: "thu",
        Fri: "fri",
        Sat: "sat"
    };

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        month: `${values.year}-${values.month}`,
        year: values.year,
        monthNumber: values.month,
        day: values.day,
        dayName: dayMap[values.weekday]
    };
}

// 오늘 기준 날짜가 아닌 timestamp 기준 날짜
export function getDateFromTimestamp(timestamp) {
    return getTimestampParts(timestamp)?.date || null;
}

// timestamp 기준 월
export function getMonthFromTimestamp(timestamp) {
    return getTimestampParts(timestamp)?.month || null;
}

// timestamp 기준 요일
export function getDayFromTimestamp(timestamp) {
    return getTimestampParts(timestamp)?.dayName || null;
}

// Device ID
export function getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");

    if (!deviceId) {
        deviceId = crypto.randomUUID();

        localStorage.setItem(
            "deviceId",
            deviceId
        );
    }

    return deviceId;
}