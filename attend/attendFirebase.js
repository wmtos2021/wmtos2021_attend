// attendFirebase.js


import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import { db } from "../firebase.js";


// Device ID로 학생 정보 가져오기
export async function getDeviceInfo(deviceId) {
    const snapshot =
        await get(
            ref(
                db,
                `deviceId/${deviceId}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// 반의 오늘 수업시간 가져오기
export async function getClassTime(
    className,
    day
) {
    const snapshot =
        await get(
            ref(
                db,
                `class/${className}/${day}`
            )
        );

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.val();
}


// 출석 날짜 저장
export async function updateLastAttend(
    deviceId,
    mobile,
    date
) {
    await update(
        ref(
            db,
            `deviceId/${deviceId}`
        ),
        {
            lastAttend: date
        }
    );

    await update(
        ref(
            db,
            `student/${mobile}`
        ),
        {
            lastAttend: date
        }
    );
}


// 다음 Wisdom 번호 저장
export async function updateWisdom(
    deviceId,
    wisdom
) {
    let nextWisdom =  Number(wisdom) + 1;
    if (nextWisdom > 24) {
        nextWisdom = 1;
    }

    await update(
        ref(
            db,
            `deviceId/${deviceId}`
        ),
        {
            wisdom: nextWisdom
        }
    );

    return nextWisdom;
}


// 출석 기록 저장
export async function saveAttendHistory(
    mobile,
    date,
    time,
    point
) {
    const historyRef =
        ref(
            db,
            `history/${mobile}/${date}`
        );

    const snapshot =
        await get(historyRef);

    if (snapshot.exists()) {
        return false;
    }

    await update(
        historyRef,
        {
            boardE: "",
            boardS: "",
            dice: "",
            getG: "",
            getP: String(point),
            time: time,
            type: "출석",
            useG: "",
            useP: ""
        }
    );

    return true;
}


// 학생 Total Point 누적
export async function updateTotalP(
    mobile,
    point
) {
    const totalPRef =
        ref(
            db,
            `student/${mobile}/totalP`
        );

    await runTransaction(
        totalPRef,
        (currentValue) => {

            const currentP =
                Number(currentValue) || 0;

            return currentP + Number(point);
        }
    );
}