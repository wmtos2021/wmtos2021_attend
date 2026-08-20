// utils.js

// 날짜 시간 요일 id stemp
const TIME_ZONE = "Asia/Seoul";


export function getSeoulDate() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const year = parts.find(p => p.type === "year").value;
    const month = parts.find(p => p.type === "month").value;
    const day = parts.find(p => p.type === "day").value;

    return `${year}${month}${day}`;
}


export function getSeoulTime() {
    return new Intl.DateTimeFormat("ko-KR", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(new Date());
}


export function getSeoulDay() {
    const day = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        weekday: "short"
    }).format(new Date());

    const dayMap = {
        Sun: "sun",
        Mon: "mon",
        Tue: "tue",
        Wed: "wed",
        Thu: "thu",
        Fri: "fri",
        Sat: "sat"
    };

    return dayMap[day];
}


export function getTimestamp() {
    return Date.now();
}


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