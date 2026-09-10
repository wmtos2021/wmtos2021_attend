// manage.js

import {
    getManageStudents,
    getDiligence,
    saveAttendance,
    saveHomework
} from "./manageFirebase.js";

// HTML 로딩 상태
let loaded = false;

// 출석부 화면 불러오기
export async function loadManage() {
    const content = document.getElementById("attendanceContent");

    if (!content || loaded) {
        return;
    }

    try {
        const response = await fetch("../student/manage.html");

        if (!response.ok) {
            throw new Error("출석부 화면을 불러오지 못했습니다.");
        }

        content.innerHTML = await response.text();

        loadManageCss();

        loaded = true;
        bindManage();

    } catch (error) {
        content.innerHTML = `
            <p>
                출석부 화면을 불러오지 못했습니다.
            </p>
        `;
    }
}

// 출석부 CSS 불러오기
function loadManageCss() {
    if (document.querySelector('link[data-manage-css]')) {
        return;
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "../student/manage.css";
    link.dataset.manageCss = "true";

    document.head.appendChild(link);
}

// 출석부 이벤트 연결
function bindManage() {
    const manageClass = document.getElementById("manageClass");
    const manageDate = document.getElementById("manageDate");

    if (!manageClass || !manageDate) {
        return;
    }

    loadClasses(manageClass);
    loadDates(manageDate);

    manageClass.addEventListener("change", () => {
        loadStudents();
    });

    manageDate.addEventListener("change", () => {
        loadStudents();
    });
}

// 수업 목록 불러오기
function loadClasses(select) {
    const classData = JSON.parse(sessionStorage.getItem("teacherClass") || "[]");

    select.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "수업을 선택해주세요.";
    defaultOption.disabled = true;
    defaultOption.selected = true;

    select.appendChild(defaultOption);

    classData.forEach(className => {
        const option = document.createElement("option");

        option.value = className;
        option.textContent = className;

        select.appendChild(option);
    });
}

// 최근 5일 날짜 목록
function loadDates(select) {
    const today = new Date();

    select.innerHTML = "";

    for (let i = 0; i < 5; i++) {
        const date = new Date(today);

        date.setDate(date.getDate() - i);

        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

        const option = document.createElement("option");

        option.value = dateKey;
        option.textContent = dateKey;

        if (i === 0) {
            option.selected = true;
        }

        select.appendChild(option);
    }
}

// 학생 목록
async function loadStudents() {
    const manageClass = document.getElementById("manageClass");
    const manageDate = document.getElementById("manageDate");
    const studentRows = document.getElementById("manageStudentRows");
    const template = document.getElementById("manageStudentTemplate");

    if (!manageClass || !manageDate || !studentRows || !template || !manageClass.value || !manageDate.value) {
        return;
    }

    const { students, management } = getManageStudents(
        manageClass.value,
        manageDate.value
    );

    studentRows.innerHTML = "";

    const studentEntries = Object.entries(students).sort(
        ([, nameA], [, nameB]) => nameA.localeCompare(nameB, "ko")
    );

    const diligenceData = await Promise.all(
        studentEntries.map(async ([mobile]) => {
            return [
                mobile,
                await getDiligence(mobile, manageDate.value)
            ];
        })
    );

    const diligenceMap = Object.fromEntries(diligenceData);

    studentEntries.forEach(([mobile, name]) => {
        const row = template.content.firstElementChild.cloneNode(true);

        const studentName = row.querySelector(".manageStudentName");
        const studentNameText = row.querySelector(".manageStudentNameText");
        const studentDiligence = row.querySelector(".manageStudentDiligence");
        const attendanceStatus = row.querySelector(".manageAttendanceStatus");
        const attendanceButtons = row.querySelector(".manageAttendanceButtons");
        const homeworkStatus = row.querySelector(".manageHomeworkStatus");
        const homeworkButtons = row.querySelector(".manageHomeworkButtons");

        studentNameText.textContent = name;
        studentDiligence.textContent = `(${diligenceMap[mobile]})`;

        setAttendance(
            management,
            mobile,
            attendanceStatus,
            attendanceButtons,
            studentDiligence,
            manageClass.value,
            manageDate.value,
            name
        );

        setHomework(
            management,
            mobile,
            homeworkStatus,
            homeworkButtons,
            studentDiligence,
            manageClass.value,
            manageDate.value,
            name
        );

        studentRows.appendChild(row);
    });
}

// 출석 상태 설정
function setAttendance(management, mobile, statusElement, buttonsElement, diligenceElement, className, dateKey, name) {
    const attend = management.attend || {};

    if (attend.absent?.[mobile]) {
        statusElement.textContent = "결석";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    if (attend.late?.[mobile] || attend.late10?.[mobile]) {
        statusElement.textContent = "지각";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    if (attend.ontime?.[mobile]) {
        statusElement.textContent = "출석";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    statusElement.textContent = "";
    buttonsElement.hidden = false;
    buttonsElement.style.display = "flex";

    const buttons = buttonsElement.querySelectorAll(".manageAttendanceBtn");

    buttons.forEach(button => {
        button.addEventListener("click", async () => {
            buttons.forEach(item => {
                item.disabled = true;
            });

            let status = "";

            if (button.classList.contains("ontime")) {
                status = "ontime";
            }

            if (button.classList.contains("late")) {
                status = "late";
            }

            if (button.classList.contains("absent")) {
                status = "absent";
            }

            try {
                const result = await saveAttendance(
                    className,
                    dateKey,
                    mobile,
                    name,
                    status
                );

                if (status === "ontime") {
                    statusElement.textContent = "출석";
                }

                if (status === "late") {
                    statusElement.textContent = "지각";
                }

                if (status === "absent") {
                    statusElement.textContent = "결석";
                }

                diligenceElement.textContent = `(${result.diligence})`;

                buttonsElement.hidden = true;
                buttonsElement.style.display = "none";

                if (status === "absent") {
                    const row = buttonsElement.closest(".manageStudentRow");
                    const homeworkStatus = row.querySelector(".manageHomeworkStatus");
                    const homeworkButtons = row.querySelector(".manageHomeworkButtons");

                    homeworkStatus.textContent = "결석";
                    homeworkButtons.hidden = true;
                    homeworkButtons.style.display = "none";
                }

            } catch (error) {
                buttons.forEach(item => {
                    item.disabled = false;
                });
            }
        });
    });
}

// 숙제 상태 설정
function setHomework(management, mobile, statusElement, buttonsElement, diligenceElement, className, dateKey, name) {
    const homework = management.homework || {};

    if (homework.done?.[mobile]) {
        statusElement.textContent = "완료";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    if (homework.notdone?.[mobile]) {
        statusElement.textContent = "미완료";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    if (homework.absent?.[mobile]) {
        statusElement.textContent = "결석";
        buttonsElement.hidden = true;
        buttonsElement.style.display = "none";
        return;
    }

    statusElement.textContent = "";
    buttonsElement.hidden = false;
    buttonsElement.style.display = "flex";

    const buttons = buttonsElement.querySelectorAll(".manageHomeworkBtn");

    buttons.forEach(button => {
        button.addEventListener("click", async () => {
            buttons.forEach(item => {
                item.disabled = true;
            });

            let status = "";

            if (button.classList.contains("done")) {
                status = "done";
            }

            if (button.classList.contains("notDone")) {
                status = "notdone";
            }

            try {
                const result = await saveHomework(
                    className,
                    dateKey,
                    mobile,
                    name,
                    status
                );

                if (status === "done") {
                    statusElement.textContent = "완료";
                }

                if (status === "notdone") {
                    statusElement.textContent = "미완료";
                }

                diligenceElement.textContent = `(${result.diligence})`;

                buttonsElement.hidden = true;
                buttonsElement.style.display = "none";

            } catch (error) {
                buttons.forEach(item => {
                    item.disabled = false;
                });
            }
        });
    });
}