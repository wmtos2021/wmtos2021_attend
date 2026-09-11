// manage.js

import {
    getManageStudents,
    getDiligence
} from "./manageFirebase.js";

import {
    initManageSave
} from "./manageSave.js";

// HTML 로딩 상태
let loaded = false;

// 출석부 화면 불러오기
export async function loadManage() {
    const content = document.getElementById("attendanceContent");

    if (!content || loaded) {
        return;
    }

    try {
        await loadManageCss();

        const response = await fetch("../student/manage.html");

        if (!response.ok) {
            throw new Error("화면을 불러오지 못했습니다.");
        }

        content.innerHTML = await response.text();

        loaded = true;

        bindManage();

    } catch (error) {
        content.innerHTML = `
            <p>
                화면을 불러오지 못했습니다.
            </p>
        `;
    }
}

// 출석부 CSS 불러오기
function loadManageCss() {
    const existingLink = document.querySelector('link[data-manage-css]');

    if (existingLink) {
        if (existingLink.sheet) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            existingLink.addEventListener("load", resolve, {
                once:true
            });

            existingLink.addEventListener("error", reject, {
                once:true
            });
        });
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = "../student/manage.css";
        link.dataset.manageCss = "true";

        link.addEventListener("load", resolve, {
            once:true
        });

        link.addEventListener("error", reject, {
            once:true
        });

        document.head.appendChild(link);
    });
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

    manageClass.addEventListener("change", async () => {
        await loadStudents();
    });

    manageDate.addEventListener("change", async () => {
        await loadStudents();
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

        const studentNameText = row.querySelector(".manageStudentNameText");
        const studentDiligence = row.querySelector(".manageStudentDiligence");

        studentNameText.textContent = name;
        studentDiligence.textContent = `(${diligenceMap[mobile]})`;

        row.dataset.mobile = mobile;
        row.dataset.name = name;

        studentRows.appendChild(row);
    });

    initManageSave(
        manageClass.value,
        manageDate.value,
        management
    );
}