// checkFirebase.js


import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import {
    db,
    auth
} from "../firebase.js";


// Device ID로 Firebase 확인
export async function getDeviceInfo(deviceId) {

    const snapshot =
        await get(
            ref(
                db,
                `deviceId/${deviceId}`
            )
        );

    return snapshot;
}


// Firebase Authentication 확인
export function getAuthUser() {
    return auth.currentUser;
}


// QR 인식 위치 및 시간 갱신
export async function updateAttendTimestamp(
    deviceId,
    latitude,
    longitude
) {
    await update(
        ref(
            db,
            `deviceId/${deviceId}`
        ),
        {
            latitude: latitude,
            longitude: longitude,
            attendTimestamp: Date.now()
        }
    );
}