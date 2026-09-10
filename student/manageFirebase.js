// manageFirebase.js

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "../firebase.js";

// 선택한 수업 + 날짜의 학생 데이터 조회
export function getManageStudents(className, dateKey) {
    const classStudent = JSON.parse(sessionStorage.getItem("classStudent") || "{}");
    const classManagement = JSON.parse(sessionStorage.getItem("classManagement") || "{}");

    const students = classStudent[className] || {};
    const management = classManagement[className]?.[dateKey] || {};

    return {
        students,
        management
    };
}

// 학생 성실도 조회
export async function getDiligence(mobile, dateKey) {
    const monthKey = dateKey.slice(0, 7);

    const snapshot = await get(
        ref(
            db,
            `diligence/${mobile}/${monthKey}`
        )
    );

    return snapshot.exists()
        ? Number(snapshot.val())
        : 100;
}

// 출석 상태 저장
export async function saveAttendance(className, dateKey, mobile, name, status) {
    const attendanceData = {
        ontime: {
            P: 100,
            Sc: 0
        },
        late: {
            P: 50,
            Sc: 1
        },
        absent: {
            P: 0,
            Sc: 3
        }
    };

    const selected = attendanceData[status];

    if (!selected) {
        throw new Error("잘못된 출석 상태입니다.");
    }

    const monthKey = dateKey.slice(0, 7);
    const diligenceRef = ref(db, `diligence/${mobile}/${monthKey}`);
    const diligenceSnapshot = await get(diligenceRef);

    const currentDiligence = diligenceSnapshot.exists()
        ? Number(diligenceSnapshot.val())
        : 100;

    const nextDiligence = Math.max(0, currentDiligence - selected.Sc);

    const updateData = {
        [`class/math/${className}/management/${dateKey}/attend/ontime/${mobile}`]: status === "ontime" ? name : null,
        [`class/math/${className}/management/${dateKey}/attend/late/${mobile}`]: status === "late" ? name : null,
        [`class/math/${className}/management/${dateKey}/attend/absent/${mobile}`]: status === "absent" ? name : null,
        [`history/${mobile}/attendance/${dateKey}/math/attend`]: status,
        [`history/${mobile}/attendance/${dateKey}/math/attendP`]: selected.P,
        [`history/${mobile}/attendance/${dateKey}/math/attendSc`]: selected.Sc,
        [`diligence/${mobile}/${monthKey}`]: nextDiligence
    };

    if (status === "absent") {
        updateData[`class/math/${className}/management/${dateKey}/homework/done/${mobile}`] = null;
        updateData[`class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`] = null;
        updateData[`class/math/${className}/management/${dateKey}/homework/absent/${mobile}`] = name;
        updateData[`history/${mobile}/attendance/${dateKey}/math/homework`] = "absent";
        updateData[`history/${mobile}/attendance/${dateKey}/math/homeworkP`] = 0;
        updateData[`history/${mobile}/attendance/${dateKey}/math/homeworkSc`] = 0;
    }

    await update(ref(db), updateData);

    const classManagement = JSON.parse(sessionStorage.getItem("classManagement") || "{}");

    if (!classManagement[className]) {
        classManagement[className] = {};
    }

    if (!classManagement[className][dateKey]) {
        classManagement[className][dateKey] = {};
    }

    if (!classManagement[className][dateKey].attend) {
        classManagement[className][dateKey].attend = {};
    }

    const attend = classManagement[className][dateKey].attend;

    if (!attend.ontime) {
        attend.ontime = {};
    }

    if (!attend.late) {
        attend.late = {};
    }

    if (!attend.absent) {
        attend.absent = {};
    }

    delete attend.ontime[mobile];
    delete attend.late[mobile];
    delete attend.absent[mobile];

    if (status === "ontime") {
        attend.ontime[mobile] = name;
    }

    if (status === "late") {
        attend.late[mobile] = name;
    }

    if (status === "absent") {
        attend.absent[mobile] = name;

        if (!classManagement[className][dateKey].homework) {
            classManagement[className][dateKey].homework = {};
        }

        if (!classManagement[className][dateKey].homework.done) {
            classManagement[className][dateKey].homework.done = {};
        }

        if (!classManagement[className][dateKey].homework.notdone) {
            classManagement[className][dateKey].homework.notdone = {};
        }

        if (!classManagement[className][dateKey].homework.absent) {
            classManagement[className][dateKey].homework.absent = {};
        }

        delete classManagement[className][dateKey].homework.done[mobile];
        delete classManagement[className][dateKey].homework.notdone[mobile];

        classManagement[className][dateKey].homework.absent[mobile] = name;
    }

    sessionStorage.setItem(
        "classManagement",
        JSON.stringify(classManagement)
    );

    return {
        status,
        attendP: selected.P,
        attendSc: selected.Sc,
        diligence: nextDiligence
    };
}

// 숙제 상태 저장
export async function saveHomework(className, dateKey, mobile, name, status) {
    const homeworkData = {
        done: {
            P: 100,
            Sc: 0
        },
        notdone: {
            P: 0,
            Sc: 1
        }
    };

    const selected = homeworkData[status];

    if (!selected) {
        throw new Error("잘못된 숙제 상태입니다.");
    }

    const monthKey = dateKey.slice(0, 7);
    const diligenceRef = ref(db, `diligence/${mobile}/${monthKey}`);
    const diligenceSnapshot = await get(diligenceRef);

    const currentDiligence = diligenceSnapshot.exists()
        ? Number(diligenceSnapshot.val())
        : 100;

    const nextDiligence = Math.max(0, currentDiligence - selected.Sc);

    await update(ref(db), {
        [`history/${mobile}/attendance/${dateKey}/math/homework`]: status,
        [`history/${mobile}/attendance/${dateKey}/math/homeworkP`]: selected.P,
        [`history/${mobile}/attendance/${dateKey}/math/homeworkSc`]: selected.Sc,
        [`diligence/${mobile}/${monthKey}`]: nextDiligence,
        [`class/math/${className}/management/${dateKey}/homework/done/${mobile}`]: status === "done" ? name : null,
        [`class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`]: status === "notdone" ? name : null,
        [`class/math/${className}/management/${dateKey}/homework/absent/${mobile}`]: null
    });

    const classManagement = JSON.parse(sessionStorage.getItem("classManagement") || "{}");

    if (!classManagement[className]) {
        classManagement[className] = {};
    }

    if (!classManagement[className][dateKey]) {
        classManagement[className][dateKey] = {};
    }

    if (!classManagement[className][dateKey].homework) {
        classManagement[className][dateKey].homework = {};
    }

    const homework = classManagement[className][dateKey].homework;

    if (!homework.done) {
        homework.done = {};
    }

    if (!homework.notdone) {
        homework.notdone = {};
    }

    if (!homework.absent) {
        homework.absent = {};
    }

    delete homework.done[mobile];
    delete homework.notdone[mobile];
    delete homework.absent[mobile];

    if (status === "done") {
        homework.done[mobile] = name;
    }

    if (status === "notdone") {
        homework.notdone[mobile] = name;
    }

    sessionStorage.setItem(
        "classManagement",
        JSON.stringify(classManagement)
    );

    return {
        status,
        homeworkP: selected.P,
        homeworkSc: selected.Sc,
        diligence: nextDiligence
    };
}