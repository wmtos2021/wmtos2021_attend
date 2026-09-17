// attitudeFirebase.js

import {
    ref,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "../firebase.js";

// 학생의 수업태도 조회
export async function getAttitude(mobile, dateKey) {
    const snapshot = await get(
        ref(db, `history/${mobile}/attendance/${dateKey}/math`)
    );

    if (!snapshot.exists()) {
        return null;
    }

    const data = snapshot.val();

    if (data.attitude !== undefined) {
        return Number(data.attitude);
    }

    if (data.attitudeM !== undefined) {
        return -Math.abs(Number(data.attitudeM));
    }

    if (data.attitudeP !== undefined) {
        return Math.abs(Number(data.attitudeP));
    }

    return null;
}

// 수업태도 일괄 저장
export async function saveAttitudeBatch(className, dateKey, students) {
    const studentEntries = Object.entries(students);

    for (const [mobile, student] of studentEntries) {
        if (
            student.attitude === "" ||
            student.attitude === null ||
            student.attitude === undefined
        ) {
            continue;
        }

        const attitude = Number(student.attitude);

        if (![ -100, -50, 0, 50, 100 ].includes(attitude)) {
            throw new Error("잘못된 수업태도 점수입니다.");
        }

        const path = `history/${mobile}/attendance/${dateKey}/math`;
        const historyRef = ref(db, path);

        let oldAttitude = 0;

        const historySnapshot = await get(historyRef);

        if (historySnapshot.exists()) {
            const history = historySnapshot.val();

            if (history.attitude !== undefined) {
                oldAttitude = Number(history.attitude) || 0;
            } else if (history.attitudeM !== undefined) {
                oldAttitude = -Math.abs(Number(history.attitudeM));
            } else if (history.attitudeP !== undefined) {
                oldAttitude = Math.abs(Number(history.attitudeP));
            }
        }

        const attitudeChange = attitude - oldAttitude;

        if (attitudeChange !== 0) {
            await runTransaction(
                ref(db, `student/${mobile}/totalP`),
                currentValue => {
                    const currentP = Number(currentValue) || 0;
                    return currentP + attitudeChange;
                }
            );
        }

        await update(historyRef, {
            attitude: attitude,
            attitudeM: null,
            attitudeP: null
        });
    }
}