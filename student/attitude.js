// attitude.js

import {
    getManageStudents,
    getDiligence
} from "./manageFirebase.js";

import {
    getAttitude,
    saveAttitudeBatch
} from "./attitudeFirebase.js";

// 현재 선택 상태
let pendingAttitude = {};

// 최초 조회 상태
let originalAttitude = {};

// 현재 선택된 수업 / 날짜
let currentClassName = "";
let currentDateKey = "";

// 저장 여부
let hasChanges = false;

// 수업태도 화면 불러오기
export async function loadAttitude(className, dateKey) {
    const studentRows = document.getElementById("manageStudentRows");

    if (!studentRows || !className || !dateKey) {
        return;
    }

    currentClassName = className;
    currentDateKey = dateKey;
    pendingAttitude = {};
    originalAttitude = {};
    hasChanges = false;

    hideManageHeader();
    loadAttitudeCss();

    try {
        const response = await fetch("../student/attitude.html");

        if (!response.ok) {
            throw new Error("수업태도 화면을 불러오지 못했습니다.");
        }

        studentRows.innerHTML = await response.text();

        await loadAttitudeStudents();

        bindSaveButton();
        updateSaveButton();

    } catch (error) {
        studentRows.innerHTML = `
            <p>
                수업태도 화면을 불러오지 못했습니다.
            </p>
        `;

        console.error("수업태도 화면 오류:", error);
    }
}

// 수업태도 CSS 불러오기
function loadAttitudeCss() {
    const existingLink = document.querySelector('link[data-attitude-css]');

    if (existingLink) {
        return;
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "../student/attitude.css";
    link.dataset.attitudeCss = "true";

    document.head.appendChild(link);
}

// 기존 manage 헤더 숨기기
function hideManageHeader() {
    const header = document.querySelector(".manageStudentHeader");

    if (header) {
        header.style.display = "none";
    }
}

// 학생 목록
async function loadAttitudeStudents() {
    const studentRows = document.getElementById("attitudeStudentRows");
    const template = document.getElementById("attitudeStudentTemplate");

    if (!studentRows || !template) {
        return;
    }

    const { students } = getManageStudents(currentClassName, currentDateKey);

    studentRows.innerHTML = "";

    const studentEntries = Object.entries(students).sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, "ko"));

    const studentData = await Promise.all(
        studentEntries.map(async ([mobile, name]) => {
            const [diligence, attitude] = await Promise.all([
                getDiligence(mobile, currentDateKey),
                getAttitude(mobile, currentDateKey)
            ]);

            return {
                mobile,
                name,
                diligence,
                attitude
            };
        })
    );

    studentData.forEach(({ mobile, name, diligence, attitude }) => {
        const row = template.content.firstElementChild.cloneNode(true);

        const studentNameText = row.querySelector(".attitudeStudentNameText");
        const studentDiligence = row.querySelector(".attitudeStudentDiligence");

        if (!studentNameText || !studentDiligence) {
            return;
        }

        studentNameText.textContent = name;
        studentDiligence.textContent = `(${diligence})`;

        row.dataset.mobile = mobile;
        row.dataset.name = name;

        const attitudeValue = attitude === null ? "" : String(attitude);

        pendingAttitude[mobile] = attitudeValue;
        originalAttitude[mobile] = attitudeValue;

        applyAttitudeSelection(row, attitudeValue);
        bindAttitudeButtons(row, mobile);

        studentRows.appendChild(row);
    });
}

// 태도 버튼 연결
function bindAttitudeButtons(row, mobile) {
    const buttons = row.querySelectorAll(".attitudeBtn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const value = button.dataset.value;

            if (value === undefined) {
                return;
            }

            pendingAttitude[mobile] = value;

            buttons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            updateChangeState();
        });
    });
}

// 저장된 태도 선택 표시
function applyAttitudeSelection(row, value) {
    const buttons = row.querySelectorAll(".attitudeBtn");

    buttons.forEach(button => {
        button.classList.remove("selected");

        if (button.dataset.value === String(value)) {
            button.classList.add("selected");
        }
    });
}

// 변경 여부 확인
function updateChangeState() {
    hasChanges = false;

    const mobiles = new Set([
        ...Object.keys(originalAttitude),
        ...Object.keys(pendingAttitude)
    ]);

    for (const mobile of mobiles) {
        if (pendingAttitude[mobile] !== originalAttitude[mobile]) {
            hasChanges = true;
            break;
        }
    }

    updateSaveButton();
}

// 저장 버튼 연결
function bindSaveButton() {
    const saveButton = document.getElementById("manageSave");

    if (!saveButton) {
        return;
    }

    saveButton.onclick = saveAll;
}

// 저장 버튼 상태
function updateSaveButton() {
    const saveButton = document.getElementById("manageSave");

    if (!saveButton) {
        return;
    }

    saveButton.disabled = !hasChanges;
}

// 일괄 저장
async function saveAll() {
    const saveButton = document.getElementById("manageSave");

    if (!saveButton || !currentClassName || !currentDateKey || !hasChanges) {
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "입력 중...";

    const students = {};

    document.querySelectorAll(".attitudeStudentRow").forEach(row => {
        const mobile = row.dataset.mobile;
        const name = row.dataset.name;

        if (!mobile || !name) {
            return;
        }

        students[mobile] = {
            name,
            attitude: pendingAttitude[mobile] || ""
        };
    });

    try {
        await saveAttitudeBatch(currentClassName, currentDateKey, students);

        originalAttitude = {
            ...pendingAttitude
        };

        hasChanges = false;
        updateSaveButton();

        saveButton.textContent = "입력 완료";

        setTimeout(() => {
            saveButton.textContent = "입력하기";
        }, 1200);

    } catch (error) {
        console.error("수업태도 저장 오류:", error);

        saveButton.disabled = false;
        saveButton.textContent = "입력하기";
    }
}

// 미저장 변경사항 여부
export function hasAttitudeChanges() {
    return hasChanges;
}

// 현재 선택 상태 초기화
export function resetAttitude() {
    pendingAttitude = {};
    originalAttitude = {};
    currentClassName = "";
    currentDateKey = "";
    hasChanges = false;

    updateSaveButton();
}