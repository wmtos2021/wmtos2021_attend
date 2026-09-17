// slist.js

import {
    getAllStudents,
    getMathClasses,
    updateStudent
} from "./slistFirebase.js";
import {
    getDiligence
} from "./manageFirebase.js";

// HTML 로딩 상태
let loaded = false;
// 현재 수정 중인 학생
let currentStudent = null;

// 학생 조회 화면 불러오기
export async function loadSlist() {
    const content = document.getElementById("studentListContent");
    if (!content || loaded) {
        return;
    }
    try {
        const response = await fetch("../student/slist.html");
        if (!response.ok) {
            throw new Error("학생 조회 화면을 불러오지 못했습니다.");
        }
        content.innerHTML = await response.text();
        await loadSlistCss();
        loaded = true;
        bindSlist();
        await loadStudents();
    } catch (error) {
        console.error("학생 조회 화면 로딩 실패:", error);
        content.innerHTML = `
            <p>학생 조회 화면을 불러오지 못했습니다.</p>
        `;
    }
}

// CSS 불러오기
function loadSlistCss() {
    const existingLink = document.querySelector('link[data-slist-css]');
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
        link.href = "../student/slist.css";
        link.dataset.slistCss = "true";
        link.addEventListener("load", resolve, {
            once: true
        });
        link.addEventListener("error", reject, {
            once: true
        });
        document.head.appendChild(link);
    });
}

// 이벤트 연결
function bindSlist() {
    const modal = document.getElementById("slistEditModal");
    const closeButton = document.getElementById("slistEditClose");
    const cancelButton = document.getElementById("slistEditCancel");
    const form = document.getElementById("slistEditForm");
    if (!modal || !closeButton || !cancelButton || !form) {
        return;
    }
    closeButton.addEventListener("click", closeEditModal);
    cancelButton.addEventListener("click", closeEditModal);
    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeEditModal();
        }
    });
    form.addEventListener("submit", saveStudent);
    formatDateInput("slistEditBirthday");
    formatDateInput("slistEditEnrollment");
    formatDateInput("slistEditWithdrawal");
}

// 학생 목록 불러오기
async function loadStudents() {
    const rows = document.getElementById("slistStudentRows");
    const count = document.getElementById("slistCount");
    const template = document.getElementById("slistStudentTemplate");
    if (!rows || !count || !template) {
        return;
    }
    rows.innerHTML = "";
    try {
        const students = await getLoadedStudents();
        const studentList = normalizeStudents(students);
        const dateKey = getTodayDateKey();
        const diligenceData = await Promise.all(
            studentList.map(async student => {
                return [
                    student.mobile,
                    await getDiligence(student.mobile, dateKey)
                ];
            })
        );
        const diligenceMap = Object.fromEntries(diligenceData);
        studentList.forEach(student => {
            student.diligence = diligenceMap[student.mobile] ?? 100;
        });
        count.textContent = studentList.length;
        studentList.sort((a, b) => {
            return String(a.name || "").localeCompare(
                String(b.name || ""),
                "ko"
            );
        });
        studentList.forEach(student => {
            const fragment = template.content.cloneNode(true);
            const row = fragment.querySelector(".slistStudentRow");
            const name = fragment.querySelector(".slistStudentNameText");
            const diligence = fragment.querySelector(".slistStudentDiligence");
            const mobile = fragment.querySelector(".slistStudentMobile");
            const point = fragment.querySelector(".slistStudentPoint");
            const gold = fragment.querySelector(".slistStudentGold");
            const login = fragment.querySelector(".slistStudentLogin");
            const editButton = fragment.querySelector(".slistEditBtn");
            name.textContent = student.name || "-";
            diligence.textContent = formatDiligence(student.diligence);
            mobile.textContent = student.mobile || "-";
            point.textContent = formatNumber(student.point);
            gold.textContent = formatNumber(student.gold);
            login.textContent = formatNumber(student.loginCount);
            editButton.addEventListener("click", () => {
                openEditModal(student);
            });
            row.dataset.mobile = student.mobile || "";
            rows.appendChild(fragment);
        });
    } catch (error) {
        console.error("학생 목록 불러오기 실패:", error);
        count.textContent = "0";
        rows.innerHTML = `
            <p class="slistErrorMessage">
                학생 목록을 불러오지 못했습니다.
            </p>
        `;
    }
}

// 오늘 날짜 키
function getTodayDateKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

// Firebase 학생 데이터와 반별 학생 데이터 통합
async function getLoadedStudents() {
    const studentsData = await getAllStudents();
    const classStudent = JSON.parse(
        sessionStorage.getItem("classStudent") || "{}"
    );
    const students = {};
    Object.entries(classStudent).forEach(([className, classStudents]) => {
        Object.keys(classStudents || {}).forEach(mobile => {
            const student = studentsData[mobile] || {};
            if (!students[mobile]) {
                students[mobile] = {
                    ...student,
                    mobile,
                    className
                };
            } else {
                students[mobile] = {
                    ...students[mobile],
                    ...student,
                    mobile,
                    className: students[mobile].className || className
                };
            }
        });
    });
    return students;
}

// 학생 데이터 배열 변환
function normalizeStudents(data) {
    if (Array.isArray(data)) {
        return data.map(student => normalizeStudent(student));
    }
    if (!data || typeof data !== "object") {
        return [];
    }
    return Object.entries(data).map(([key, student]) => {
        return normalizeStudent({
            ...(student || {}),
            mobile: student?.mobile || key
        });
    });
}

// 학생 데이터 정규화
function normalizeStudent(student) {
    return {
        ...student,
        name: student.name || "",
        mobile: student.mobile || student.phone || "",
        birthday: student.birthday || "",
        enrollment: student.enrollment || "",
        withdrawal: student.withdrawal || "",
        className: student.className || student.class || "",
        point: Number(student.totalP ?? 0),
        gold: Number(student.totalG ?? 0),
        loginCount: Number(student.loginCount ?? 0),
        diligence: student.diligence ?? 100
    };
}

// 성실도 표시
function formatDiligence(value) {
    if (value === undefined || value === null || value === "") {
        return "";
    }
    return `(${formatNumber(value)})`;
}

// 숫자 표시
function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return "0";
    }
    return number.toLocaleString("ko-KR");
}

// 수정 팝업 열기
function openEditModal(student) {
    const modal = document.getElementById("slistEditModal");
    const message = document.getElementById("slistEditMessage");
    if (!modal) {
        return;
    }
    currentStudent = student;
    setInputValue("slistEditName", student.name);
    setInputValue("slistEditMobile", student.mobile);
    setInputValue(
        "slistEditBirthday",
        formatDateInputValue(student.birthday)
    );
    setInputValue(
        "slistEditEnrollment",
        formatDateInputValue(student.enrollment)
    );
    setInputValue(
        "slistEditWithdrawal",
        formatDateInputValue(student.withdrawal)
    );
    setSelectValue("slistEditSubject", "math");
    setClassOptions(student.className);
    if (message) {
        message.textContent = "";
        message.className = "slistEditMessage";
    }
    modal.classList.remove("hidden");
    modal.classList.add("show");
}
// 수업 목록 설정
function setClassOptions(currentClass) {
    const select = document.getElementById("slistEditClass");
    if (!select) {
        return;
    }
    const classStudent = JSON.parse(
        sessionStorage.getItem("classStudent") || "{}"
    );
    const classNames = Object.keys(classStudent)
        .filter(className => className !== "tchr")
        .filter(className => className !== "")
        .sort((a, b) => a.localeCompare(b, "ko"));
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.textContent = "수업을 선택하세요.";
    select.appendChild(placeholder);
    classNames.forEach(className => {
        const option = document.createElement("option");
        option.value = className;
        option.textContent = className;
        select.appendChild(option);
    });
    if (currentClass && classNames.includes(currentClass)) {
        select.value = currentClass;
    } else {
        select.value = "";
    }
}

// 입력값 설정
function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input) {
        input.value = value ?? "";
    }
}

// 선택값 설정
function setSelectValue(id, value) {
    const select = document.getElementById(id);
    if (select) {
        select.value = value ?? "";
    }
}

// 날짜 입력 자동 형식
function formatDateInput(id) {
    const input = document.getElementById(id);
    if (!input) {
        return;
    }
    input.addEventListener("input", () => {
        const numbers = input.value.replace(/\D/g, "").slice(0, 8);
        if (!numbers) {
            input.value = "";
            return;
        }
        if (numbers.length < 8) {
            input.value = numbers;
            return;
        }
        input.value = `${numbers.slice(0, 4)}년 ${numbers.slice(4, 6)}월 ${numbers.slice(6, 8)}일`;
    });
}

// 날짜 표시값 변환
function formatDateInputValue(value) {
    if (!value) {
        return "";
    }
    const text = String(value).replace(/\D/g, "");
    if (text.length !== 8) {
        return "";
    }
    return `${text.slice(0, 4)}년 ${text.slice(4, 6)}월 ${text.slice(6, 8)}일`;
}

// 날짜 저장값 변환
function normalizeDateValue(value) {
    const text = String(value || "").replace(/\D/g, "");
    if (!text) {
        return "";
    }
    if (text.length !== 8) {
        throw new Error("날짜는 8자리로 입력해주세요.");
    }
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
}

// 수정 팝업 닫기
function closeEditModal() {
    const modal = document.getElementById("slistEditModal");
    if (!modal) {
        return;
    }
    modal.classList.remove("show");
    modal.classList.add("hidden");
    currentStudent = null;
}

// 학생 정보 저장
async function saveStudent(event) {
    event.preventDefault();
    const message = document.getElementById("slistEditMessage");
    const saveButton = document.getElementById("slistEditSave");
    if (!currentStudent) {
        return;
    }
    let birthday;
    let enrollment;
    let withdrawal;
    try {
        birthday = normalizeDateValue(
            getInputValue("slistEditBirthday")
        );
        enrollment = normalizeDateValue(
            getInputValue("slistEditEnrollment")
        );
        withdrawal = normalizeDateValue(
            getInputValue("slistEditWithdrawal")
        );
    } catch (error) {
        showMessage(message, error.message, false);
        return;
    }
    const updatedStudent = {
        ...currentStudent,
        name: getInputValue("slistEditName"),
        mobile: getInputValue("slistEditMobile"),
        birthday,
        enrollment,
        withdrawal,
        className: getInputValue("slistEditClass")
    };
    if (!updatedStudent.name || !updatedStudent.mobile) {
        showMessage(message, "이름과 연락처를 입력해주세요.", false);
        return;
    }
    try {
        if (saveButton) {
            saveButton.disabled = true;
        }
        await updateStudent(currentStudent, updatedStudent);
        updateSessionStudent(updatedStudent);
        showMessage(message, "학생 정보가 저장되었습니다.", true);
        await loadStudents();
        setTimeout(() => {
            closeEditModal();
        }, 500);
    } catch (error) {
        console.error("학생 정보 저장 실패:", error);
        showMessage(message, "학생 정보 저장에 실패했습니다.", false);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
        }
    }
}

// sessionStorage 학생 데이터 갱신
function updateSessionStudent(updatedStudent) {
    const classStudent = JSON.parse(
        sessionStorage.getItem("classStudent") || "{}"
    );
    const originalMobile = currentStudent.mobile;
    const updatedMobile = updatedStudent.mobile;
    let originalClassName = currentStudent.className;
    Object.entries(classStudent).forEach(([className, classStudents]) => {
        if (!classStudents || !classStudents[originalMobile]) {
            return;
        }
        originalClassName = className;
    });
    if (!updatedStudent.className) {
        updatedStudent.className = originalClassName || "";
    }
    if (!classStudent[updatedStudent.className]) {
        classStudent[updatedStudent.className] = {};
    }
    if (originalClassName && classStudent[originalClassName]) {
        delete classStudent[originalClassName][originalMobile];
    }
    classStudent[updatedStudent.className][updatedMobile] = updatedStudent.name;
    sessionStorage.setItem(
        "classStudent",
        JSON.stringify(classStudent)
    );
}

// 입력값 가져오기
function getInputValue(id) {
    const input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

// 메시지 표시
function showMessage(element, text, success) {
    if (!element) {
        return;
    }
    element.textContent = text;
    element.className = success
        ? "slistEditMessage success"
        : "slistEditMessage error";
}