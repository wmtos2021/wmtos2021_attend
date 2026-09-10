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
        ref(db, `diligence/${mobile}/${monthKey}`)
    );

    return snapshot.exists()
        ? Number(snapshot.val())
        : 100;
}

// 일괄 저장
export async function saveManageBatch(className, dateKey, students) {
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

    const homeworkData = {
        done: {
            P: 100,
            Sc: 0
        },
        notdone: {
            P: 0,
            Sc: 1
        },
        absent: {
            P: 0,
            Sc: 0
        }
    };

    const monthKey = dateKey.slice(0, 7);
    const updateData = {};
    const diligence = {};

    const classManagement = JSON.parse(
        sessionStorage.getItem("classManagement") || "{}"
    );

    if (!classManagement[className]) {
        classManagement[className] = {};
    }

    if (!classManagement[className][dateKey]) {
        classManagement[className][dateKey] = {};
    }

    if (!classManagement[className][dateKey].attend) {
        classManagement[className][dateKey].attend = {};
    }

    if (!classManagement[className][dateKey].attend.ontime) {
        classManagement[className][dateKey].attend.ontime = {};
    }

    if (!classManagement[className][dateKey].attend.late) {
        classManagement[className][dateKey].attend.late = {};
    }

    if (!classManagement[className][dateKey].attend.absent) {
        classManagement[className][dateKey].attend.absent = {};
    }

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

    const attend = classManagement[className][dateKey].attend;
    const homework = classManagement[className][dateKey].homework;

    const studentEntries = Object.entries(students);

    const studentData = await Promise.all(
        studentEntries.map(async ([mobile, student]) => {
            const historyRef = ref(
                db,
                `history/${mobile}/attendance/${dateKey}/math`
            );

            const diligenceRef = ref(
                db,
                `diligence/${mobile}/${monthKey}`
            );

            const totalPRef = ref(
                db,
                `student/${mobile}/totalP`
            );

            const [
                historySnapshot,
                diligenceSnapshot,
                totalPSnapshot
            ] = await Promise.all([
                get(historyRef),
                get(diligenceRef),
                get(totalPRef)
            ]);

            const history = historySnapshot.exists()
                ? historySnapshot.val()
                : {};

            const currentDiligence = diligenceSnapshot.exists()
                ? Number(diligenceSnapshot.val())
                : 100;

            const currentTotalP = totalPSnapshot.exists()
                ? Number(totalPSnapshot.val())
                : 0;

            return {
                mobile,
                name: student.name,
                attendance: student.attendance || "",
                homework: student.homework || "",
                history,
                currentDiligence,
                currentTotalP
            };
        })
    );

    for (const student of studentData) {
        const {
            mobile,
            name,
            attendance,
            homework: selectedHomework,
            history,
            currentDiligence,
            currentTotalP
        } = student;

        let nextAttendance = attendance;
        let nextHomework = selectedHomework;

        const oldAttendanceP = Number(history.attendP) || 0;
        const oldAttendanceSc = Number(history.attendSc) || 0;
        const oldHomeworkP = Number(history.homeworkP) || 0;
        const oldHomeworkSc = Number(history.homeworkSc) || 0;

        if (nextAttendance && !attendanceData[nextAttendance]) {
            throw new Error("잘못된 출석 상태입니다.");
        }

        if (nextHomework && !homeworkData[nextHomework]) {
            throw new Error("잘못된 숙제 상태입니다.");
        }

        if (nextAttendance === "absent") {
            nextHomework = "absent";
        }

        const currentAttendanceP = nextAttendance
            ? attendanceData[nextAttendance].P
            : 0;

        const currentAttendanceSc = nextAttendance
            ? attendanceData[nextAttendance].Sc
            : 0;

        const currentHomeworkP = nextHomework
            ? homeworkData[nextHomework].P
            : 0;

        const currentHomeworkSc = nextHomework
            ? homeworkData[nextHomework].Sc
            : 0;

        const previousTotalSc =
            oldAttendanceSc + oldHomeworkSc;

        const nextTotalSc =
            currentAttendanceSc + currentHomeworkSc;

        const diligenceChange =
            nextTotalSc - previousTotalSc;

        const nextDiligence =
            Math.max(
                0,
                currentDiligence - diligenceChange
            );

        const previousTotalP =
            oldAttendanceP + oldHomeworkP;

        const nextTotalP =
            currentAttendanceP + currentHomeworkP;

        const totalPChange =
            nextTotalP - previousTotalP;

        const nextTotalPValue =
            Math.max(
                0,
                currentTotalP + totalPChange
            );

        if (nextAttendance) {
            updateData[
                `class/math/${className}/management/${dateKey}/attend/ontime/${mobile}`
            ] = nextAttendance === "ontime"
                ? name
                : null;

            updateData[
                `class/math/${className}/management/${dateKey}/attend/late/${mobile}`
            ] = nextAttendance === "late"
                ? name
                : null;

            updateData[
                `class/math/${className}/management/${dateKey}/attend/absent/${mobile}`
            ] = nextAttendance === "absent"
                ? name
                : null;

            updateData[
                `class/math/${className}/management/${dateKey}/attend/late10/${mobile}`
            ] = null;

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/attend`
            ] = nextAttendance;

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/attendP`
            ] = currentAttendanceP;

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/attendSc`
            ] = currentAttendanceSc;

            delete attend.ontime[mobile];
            delete attend.late[mobile];
            delete attend.absent[mobile];

            if (nextAttendance === "ontime") {
                attend.ontime[mobile] = name;
            }

            if (nextAttendance === "late") {
                attend.late[mobile] = name;
            }

            if (nextAttendance === "absent") {
                attend.absent[mobile] = name;
            }
        }

        if (nextAttendance === "absent") {
            updateData[
                `class/math/${className}/management/${dateKey}/homework/done/${mobile}`
            ] = null;

            updateData[
                `class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`
            ] = null;

            updateData[
                `class/math/${className}/management/${dateKey}/homework/absent/${mobile}`
            ] = name;

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/homework`
            ] = "absent";

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/homeworkP`
            ] = 0;

            updateData[
                `history/${mobile}/attendance/${dateKey}/math/homeworkSc`
            ] = 0;

            delete homework.done[mobile];
            delete homework.notdone[mobile];

            homework.absent[mobile] = name;

        } else {
            updateData[
                `class/math/${className}/management/${dateKey}/homework/absent/${mobile}`
            ] = null;

            delete homework.absent[mobile];

            if (nextHomework === "done") {
                updateData[
                    `class/math/${className}/management/${dateKey}/homework/done/${mobile}`
                ] = name;

                updateData[
                    `class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`
                ] = null;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homework`
                ] = "done";

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkP`
                ] = currentHomeworkP;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkSc`
                ] = currentHomeworkSc;

                delete homework.done[mobile];
                delete homework.notdone[mobile];

                homework.done[mobile] = name;

            } else if (nextHomework === "notdone") {
                updateData[
                    `class/math/${className}/management/${dateKey}/homework/done/${mobile}`
                ] = null;

                updateData[
                    `class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`
                ] = name;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homework`
                ] = "notdone";

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkP`
                ] = currentHomeworkP;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkSc`
                ] = currentHomeworkSc;

                delete homework.done[mobile];
                delete homework.notdone[mobile];

                homework.notdone[mobile] = name;

            } else if (!nextHomework) {
                updateData[
                    `class/math/${className}/management/${dateKey}/homework/done/${mobile}`
                ] = null;

                updateData[
                    `class/math/${className}/management/${dateKey}/homework/notdone/${mobile}`
                ] = null;

                updateData[
                    `class/math/${className}/management/${dateKey}/homework/absent/${mobile}`
                ] = null;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homework`
                ] = null;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkP`
                ] = null;

                updateData[
                    `history/${mobile}/attendance/${dateKey}/math/homeworkSc`
                ] = null;

                delete homework.done[mobile];
                delete homework.notdone[mobile];
                delete homework.absent[mobile];
            }
        }

        updateData[
            `diligence/${mobile}/${monthKey}`
        ] = nextDiligence;

        updateData[
            `student/${mobile}/totalP`
        ] = nextTotalPValue;

        diligence[mobile] = nextDiligence;
    }

    await update(ref(db), updateData);

    sessionStorage.setItem(
        "classManagement",
        JSON.stringify(classManagement)
    );

    return {
        diligence
    };
}