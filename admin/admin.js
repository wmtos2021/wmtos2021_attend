// admin.js

import { initNews } from "./news.js";
import { initInbox } from "./inbox.js";
import { loadAddNew } from "../student/addNew.js";
import { loadManage } from "../student/manage.js";
import {
    VERSION,
    ACADEMY_NAME,
    ACADEMY_ADDRESS
} from "../utils.js";

// 하단 정보
const footerLine1 = document.querySelector(".footerLine1");
const footerLine2 = document.querySelector(".footerLine2");
const version = document.getElementById("version");

// 상단 메뉴
const studentMenuBtn = document.getElementById("studentMenuBtn");
// const academyMenuBtn = document.getElementById("academyMenuBtn");
const etcMenuBtn = document.getElementById("etcMenuBtn");

// 선생님 정보
const teacherInfo = sessionStorage.getItem("teacherInfo");
const teacherName = document.querySelector(".title");

if (teacherInfo && teacherName) {
    try {
        const teacherData = JSON.parse(teacherInfo);

        teacherName.textContent =
            `${teacherData.name || "선생님"}님`;
    } catch (error) {
        teacherName.textContent = "선생님님";
    }
}

// 드롭다운
const menuPanel = document.getElementById("menuPanel");
const studentPanel = document.getElementById("studentPanel");
// const academyPanel = document.getElementById("academyPanel");
const etcPanel = document.getElementById("etcPanel");

// 메뉴 항목
const attendanceBtn = document.getElementById("attendanceBtn");
const studentListBtn = document.getElementById("studentListBtn");
const studentAddBtn = document.getElementById("studentAddBtn");
// const scheduleBtn = document.getElementById("scheduleBtn");
// const teacherBtn = document.getElementById("teacherBtn");
// const goldShopBtn = document.getElementById("goldShopBtn");
const newsHistoryBtn = document.getElementById("newsHistoryBtn");

// 콘텐츠
const defaultContent = document.getElementById("defaultContent");
const attendanceContent = document.getElementById("attendanceContent");
const studentListContent = document.getElementById("studentListContent");
const studentAddContent = document.getElementById("studentAddContent");
// const scheduleContent = document.getElementById("scheduleContent");
// const teacherContent = document.getElementById("teacherContent");
const goldShopContent = document.getElementById("goldShopContent");
const newsHistoryContent = document.getElementById("newsHistoryContent");

// 하단 정보 표시
footerLine1.textContent = ACADEMY_NAME;
footerLine2.textContent = ACADEMY_ADDRESS;
version.textContent = VERSION;

// 드롭다운 닫기
function closeMenu() {
    studentMenuBtn.classList.remove("active");
    // academyMenuBtn.classList.remove("active");
    etcMenuBtn.classList.remove("active");

    studentMenuBtn.setAttribute(
        "aria-expanded",
        "false"
    );

    // academyMenuBtn.setAttribute(
    //     "aria-expanded",
    //     "false"
    // );

    etcMenuBtn.setAttribute(
        "aria-expanded",
        "false"
    );

    menuPanel.classList.add("hidden");
    studentPanel.classList.add("hidden");
    // academyPanel.classList.add("hidden");
    etcPanel.classList.add("hidden");
}

// 학생관리 열기
function openStudentMenu() {
    const isOpen =
        studentMenuBtn.classList.contains("active");

    closeMenu();

    if (isOpen) {
        return;
    }

    studentMenuBtn.classList.add("active");

    studentMenuBtn.setAttribute(
        "aria-expanded",
        "true"
    );

    menuPanel.classList.remove("hidden");
    studentPanel.classList.remove("hidden");
}

// 학원관리 열기
/*
function openAcademyMenu() {
    const isOpen =
        academyMenuBtn.classList.contains("active");

    closeMenu();

    if (isOpen) {
        return;
    }

    academyMenuBtn.classList.add("active");

    academyMenuBtn.setAttribute(
        "aria-expanded",
        "true"
    );

    menuPanel.classList.remove("hidden");
    academyPanel.classList.remove("hidden");
}
*/

// 기타관리 열기
function openEtcMenu() {
    const isOpen =
        etcMenuBtn.classList.contains("active");

    closeMenu();

    if (isOpen) {
        return;
    }

    etcMenuBtn.classList.add("active");

    etcMenuBtn.setAttribute(
        "aria-expanded",
        "true"
    );

    menuPanel.classList.remove("hidden");
    etcPanel.classList.remove("hidden");
}

// 콘텐츠 숨기기
function hideContent() {
    defaultContent.classList.add("hidden");
    attendanceContent.classList.add("hidden");
    studentListContent.classList.add("hidden");
    studentAddContent.classList.add("hidden");
    // scheduleContent.classList.add("hidden");
    // teacherContent.classList.add("hidden");
    goldShopContent.classList.add("hidden");
    newsHistoryContent.classList.add("hidden");
}

// 콘텐츠 표시
function showContent(content) {
    hideContent();

    content.classList.remove("hidden");

    closeMenu();
}

// 상단 메뉴
studentMenuBtn.addEventListener(
    "click",
    openStudentMenu
);

/*
academyMenuBtn.addEventListener(
    "click",
    openAcademyMenu
);
*/

etcMenuBtn.addEventListener(
    "click",
    openEtcMenu
);

// 출석부
attendanceBtn.addEventListener(
    "click",
    async () => {
        showContent(attendanceContent);

        await loadManage();
    }
);

// 학생 조회
studentListBtn.addEventListener(
    "click",
    () => {
        showContent(studentListContent);
    }
);

// 학생 등록
studentAddBtn.addEventListener(
    "click",
    async () => {
        showContent(studentAddContent);

        await loadAddNew();
    }
);

// 시간표
/*
scheduleBtn.addEventListener(
    "click",
    () => {
        showContent(scheduleContent);
    }
);
*/

// 선생님
/*
teacherBtn.addEventListener(
    "click",
    () => {
        showContent(teacherContent);
    }
);
*/

// 골드상점
/*
goldShopBtn.addEventListener(
    "click",
    () => {
        showContent(goldShopContent);
    }
);
*/

// NEWS 조회
newsHistoryBtn.addEventListener(
    "click",
    () => {
        showContent(newsHistoryContent);
    }
);

// 메뉴 바깥 클릭 시 닫기
document.addEventListener(
    "click",
    event => {
        if (
            !event.target.closest(".mainMenu") &&
            !event.target.closest(".menuPanel")
        ) {
            closeMenu();
        }
    }
);

// NEWS 초기화
initNews();

// Inbox 초기화
initInbox();