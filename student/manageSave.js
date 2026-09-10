// manageSave.js

import {
    saveManageBatch
} from "./manageFirebase.js";

// 현재 선택 상태
let pendingAttendance = {};
let pendingHomework = {};

// 최초 조회 상태
let originalAttendance = {};
let originalHomework = {};

// 현재 선택된 수업 / 날짜
let currentClassName = "";
let currentDateKey = "";

// 저장 여부
let hasChanges = false;

// 저장 모듈 초기화
export function initManageSave(className, dateKey, management) {
    currentClassName = className;
    currentDateKey = dateKey;
    pendingAttendance = {};
    pendingHomework = {};
    originalAttendance = {};
    originalHomework = {};
    hasChanges = false;

    const studentRows = document.querySelectorAll(".manageStudentRow");

    studentRows.forEach(row => {
        const mobile = row.dataset.mobile;

        if (!mobile) {
            return;
        }

        const attendanceStatus = getAttendanceStatus(management, mobile);
        const homeworkStatus = getHomeworkStatus(management, mobile);

        pendingAttendance[mobile] = attendanceStatus;
        pendingHomework[mobile] = homeworkStatus;
        originalAttendance[mobile] = attendanceStatus;
        originalHomework[mobile] = homeworkStatus;

        bindAttendance(row, mobile);
        bindHomework(row, mobile);

        applyAttendanceSelection(row, attendanceStatus);
        applyHomeworkSelection(row, homeworkStatus);
        updateHomeworkDisabled(row, attendanceStatus);
    });

    bindSaveButton();
    updateSaveButton();
}

// 출석 상태 조회
function getAttendanceStatus(management, mobile) {
    const attend = management.attend || {};

    if (attend.absent?.[mobile]) {
        return "absent";
    }

    if (attend.late?.[mobile] || attend.late10?.[mobile]) {
        return "late";
    }

    if (attend.ontime?.[mobile]) {
        return "ontime";
    }

    return "";
}

// 숙제 상태 조회
function getHomeworkStatus(management, mobile) {
    const homework = management.homework || {};

    if (homework.absent?.[mobile]) {
        return "absent";
    }

    if (homework.done?.[mobile]) {
        return "done";
    }

    if (homework.notdone?.[mobile]) {
        return "notdone";
    }

    return "";
}

// 출석 버튼 연결
function bindAttendance(row, mobile) {
    const buttons = row.querySelectorAll(".manageAttendanceBtn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const status = getAttendanceButtonStatus(button);

            if (!status) {
                return;
            }

            pendingAttendance[mobile] = status;

            buttons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            if (status === "absent") {
                pendingHomework[mobile] = "absent";

                const homeworkButtons = row.querySelectorAll(".manageHomeworkBtn");

                homeworkButtons.forEach(item => {
                    item.classList.remove("selected");
                });
            } else if (pendingHomework[mobile] === "absent") {
                pendingHomework[mobile] = "";

                const homeworkButtons = row.querySelectorAll(".manageHomeworkBtn");

                homeworkButtons.forEach(item => {
                    item.classList.remove("selected");
                });
            }

            updateHomeworkDisabled(row, status);
            updateChangeState();
        });
    });
}

// 숙제 버튼 연결
function bindHomework(row, mobile) {
    const buttons = row.querySelectorAll(".manageHomeworkBtn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            if (pendingAttendance[mobile] === "absent") {
                return;
            }

            const status = getHomeworkButtonStatus(button);

            if (!status) {
                return;
            }

            pendingHomework[mobile] = status;

            buttons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            updateChangeState();
        });
    });
}

// 출석 버튼 상태
function getAttendanceButtonStatus(button) {
    if (button.classList.contains("ontime")) {
        return "ontime";
    }

    if (button.classList.contains("late")) {
        return "late";
    }

    if (button.classList.contains("absent")) {
        return "absent";
    }

    return "";
}

// 숙제 버튼 상태
function getHomeworkButtonStatus(button) {
    if (button.classList.contains("done")) {
        return "done";
    }

    if (button.classList.contains("notDone")) {
        return "notdone";
    }

    return "";
}

// 출석 선택 표시
function applyAttendanceSelection(row, status) {
    const buttons = row.querySelectorAll(".manageAttendanceBtn");

    buttons.forEach(button => {
        button.classList.remove("selected");

        if (getAttendanceButtonStatus(button) === status) {
            button.classList.add("selected");
        }
    });
}

// 숙제 선택 표시
function applyHomeworkSelection(row, status) {
    const buttons = row.querySelectorAll(".manageHomeworkBtn");

    buttons.forEach(button => {
        button.classList.remove("selected");

        if (getHomeworkButtonStatus(button) === status) {
            button.classList.add("selected");
        }
    });
}

// 결석 시 숙제 버튼 비활성화
function updateHomeworkDisabled(row, attendanceStatus) {
    const buttons = row.querySelectorAll(".manageHomeworkBtn");
    const disabled = attendanceStatus === "absent";

    buttons.forEach(button => {
        button.disabled = disabled;
    });
}

// 변경 여부 확인
function updateChangeState() {
    hasChanges = false;

    const mobiles = new Set([
        ...Object.keys(originalAttendance),
        ...Object.keys(originalHomework),
        ...Object.keys(pendingAttendance),
        ...Object.keys(pendingHomework)
    ]);

    for (const mobile of mobiles) {
        if (pendingAttendance[mobile] !== originalAttendance[mobile]) {
            hasChanges = true;
            break;
        }

        if (pendingHomework[mobile] !== originalHomework[mobile]) {
            hasChanges = true;
            break;
        }
    }

    updateSaveButton();
}

// 저장 버튼 연결
function bindSaveButton() {
    const manageSave = document.getElementById("manageSave");

    if (!manageSave) {
        return;
    }

    manageSave.onclick = saveAll;
}

// 저장 버튼 상태
function updateSaveButton() {
    const manageSave = document.getElementById("manageSave");

    if (!manageSave) {
        return;
    }

    manageSave.disabled = !hasChanges;
}

// 일괄 저장
async function saveAll() {
    const manageSave = document.getElementById("manageSave");

    if (!manageSave || !currentClassName || !currentDateKey || !hasChanges) {
        return;
    }

    manageSave.disabled = true;
    manageSave.textContent = "입력 중...";

    const students = {};

    document.querySelectorAll(".manageStudentRow").forEach(row => {
        const mobile = row.dataset.mobile;
        const name = row.dataset.name;

        if (!mobile || !name) {
            return;
        }

        students[mobile] = {
            name,
            attendance: pendingAttendance[mobile] || "",
            homework: pendingHomework[mobile] || ""
        };
    });

    try {
        const result = await saveManageBatch(
            currentClassName,
            currentDateKey,
            students
        );

        Object.entries(result?.diligence || {}).forEach(([mobile, diligence]) => {
            const row = document.querySelector(`.manageStudentRow[data-mobile="${mobile}"]`);
            const diligenceElement = row?.querySelector(".manageStudentDiligence");

            if (diligenceElement) {
                diligenceElement.textContent = `(${diligence})`;
            }
        });

        originalAttendance = {
            ...pendingAttendance
        };

        originalHomework = {
            ...pendingHomework
        };

        hasChanges = false;
        updateSaveButton();

        manageSave.textContent = "입력 완료";

        setTimeout(() => {
            manageSave.textContent = "입력하기";
        }, 1200);

    } catch (error) {
        manageSave.disabled = false;
        manageSave.textContent = "입력하기";
    }
}

// 미저장 변경사항 여부
export function hasManageChanges() {
    return hasChanges;
}

// 현재 선택 상태 초기화
export function resetManageSave() {
    pendingAttendance = {};
    pendingHomework = {};
    originalAttendance = {};
    originalHomework = {};
    currentClassName = "";
    currentDateKey = "";
    hasChanges = false;

    updateSaveButton();
}