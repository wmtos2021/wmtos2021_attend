// manage.js

import {
    getManageStudents,
    getDiligence
} from "./manageFirebase.js";

import {
    initManageSave
} from "./manageSave.js";

import {
    loadAttitude
} from "./attitude.js";

// HTML 로딩 상태
let loaded = false;

// 현재 탭
let currentTab = "manage";

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
        currentTab = "manage";

        bindManage();

    } catch (error) {
        content.innerHTML = `
            <p>
                화면을 불러오지 못했습니다.
            </p>
        `;

        console.error("출석부 화면 오류:", error);
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
                once: true
            });

            existingLink.addEventListener("error", reject, {
                once: true
            });
        });
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = "../student/manage.css";
        link.dataset.manageCss = "true";

        link.addEventListener("load", resolve, {
            once: true
        });

        link.addEventListener("error", reject, {
            once: true
        });

        document.head.appendChild(link);
    });
}

// 출석부 이벤트 연결
function bindManage() {
    const manageClass = document.getElementById("manageClass");
    const manageDate = document.getElementById("manageDate");
    const manageTab = document.getElementById("manageTab");
    const attitudeTab = document.getElementById("attitudeTab");

    if (!manageClass || !manageDate || !manageTab || !attitudeTab) {
        return;
    }

    loadClasses(manageClass);
    loadDates(manageDate);

    manageTab.classList.add("active");
    attitudeTab.classList.remove("active");

    manageClass.addEventListener("change", async () => {
        if (!manageClass.value || !manageDate.value) {
            return;
        }

        if (currentTab === "manage") {
            await loadStudents();
        } else {
            await loadAttitude(manageClass.value, manageDate.value);
        }
    });

    manageDate.addEventListener("change", async () => {
        if (!manageClass.value || !manageDate.value) {
            return;
        }

        if (currentTab === "manage") {
            await loadStudents();
        } else {
            await loadAttitude(manageClass.value, manageDate.value);
        }
    });

    manageTab.addEventListener("click", async () => {
        if (currentTab === "manage") {
            return;
        }

        currentTab = "manage";

        manageTab.classList.add("active");
        attitudeTab.classList.remove("active");

        await loadStudents();
    });

    attitudeTab.addEventListener("click", async () => {
        if (currentTab === "attitude") {
            return;
        }

        if (!manageClass.value || !manageDate.value) {
            return;
        }

        currentTab = "attitude";

        attitudeTab.classList.add("active");
        manageTab.classList.remove("active");

        await loadAttitude(manageClass.value, manageDate.value);
    });
}

// 수업 목록 불러오기
function loadClasses(select) {
    const classData = JSON.parse(sessionStorage.getItem("teacherClass") || "[]");

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "수업을 선택하세요.";
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

// 최근 평일 5일 날짜 목록
function loadDates(select) {
    const today = new Date();

    select.innerHTML = "";

    let count = 0;
    let i = 0;

    const weekDays = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];

    while (count < 5) {
        const date = new Date(today);

        date.setDate(date.getDate() - i);

        const day = date.getDay();

        if (day !== 0 && day !== 6) {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

            const option = document.createElement("option");

            option.value = dateKey;
            option.textContent = `${weekDays[day]} ${dateKey}`;

            if (count === 0) {
                option.selected = true;
            }

            select.appendChild(option);

            count++;
        }

        i++;
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

    const manageHeader = document.querySelector(".manageStudentHeader");

    if (manageHeader) {
        manageHeader.hidden = false;
        manageHeader.style.display = "";
    }

    const { students, management } = getManageStudents(manageClass.value, manageDate.value);

    studentRows.innerHTML = "";

    const studentEntries = Object.entries(students).sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB, "ko"));

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

    initManageSave(manageClass.value, manageDate.value, management);
}