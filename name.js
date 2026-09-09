import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "./firebase.js";

async function createteacherNameIndex() {
    const snapshot = await get(
        ref(db, "teacher")
    );

    if (!snapshot.exists()) {
        console.log("teacher 데이터가 없습니다.");
        return;
    }

    const teachers = snapshot.val();
    const updates = {};

    for (const [mobile, teacher] of Object.entries(teachers)) {
        if (!teacher || typeof teacher !== "object") {
            continue;
        }

        if (!teacher.name) {
            continue;
        }

        if (mobile === "name") {
            continue;
        }

        updates[`teacher/name/${teacher.name}`] = mobile;
    }

    if (Object.keys(updates).length === 0) {
        console.log("추가할 이름 데이터가 없습니다.");
        return;
    }

    await update(
        ref(db),
        updates
    );

    console.log(
        `${Object.keys(updates).length}개의 이름 데이터를 저장했습니다.`
    );
}

createteacherNameIndex();