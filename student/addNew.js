// addNew.js

import { getMathClasses, saveStudent } from "./addNewFirebase.js";
import {
    formatMobile,
    formatDateInput,
    setToday
} from "./addNewFormat.js";
import {
    validateName,
    validateMobile,
    verifyStudentName,
    verifyStudentMobile,
    validateStudentInput
} from "./addNewVerify.js";

// HTML 로딩 상태
let loaded = false;

// 중복확인 상태
let nameChecked = false;
let mobileChecked = false;

// 학생 등록 화면 불러오기
export async function loadAddNew() {
    const content = document.getElementById("studentAddContent");

    if (!content || loaded) {
        return;
    }

    try {
        await loadAddNewCss();

        const response = await fetch("../student/addNew.html");

        if (!response.ok) {
            throw new Error("학생 등록 화면을 불러오지 못했습니다.");
        }

        content.innerHTML = await response.text();

        bindAddNew();

        loaded = true;
    } catch (error) {
        content.innerHTML = `
            <p>
                학생 등록 화면을 불러오지 못했습니다.
            </p>
        `;
    }
}

// 학생 등록 CSS
function loadAddNewCss() {
    const existingLink = document.querySelector('link[data-add-new-css]');

    if (existingLink) {
        if (existingLink.sheet) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            existingLink.addEventListener("load", resolve, { once:true });
            existingLink.addEventListener("error", reject, { once:true });
        });
    }

    return new Promise((resolve, reject) => {
        const link = document.createElement("link");

        link.rel = "stylesheet";
        link.href = "../student/addNew.css";
        link.dataset.addNewCss = "true";

        link.addEventListener("load", resolve, { once:true });
        link.addEventListener("error", reject, { once:true });

        document.head.appendChild(link);
    });
}

// 안내 팝업 표시
function showMessagePopup(popup, messageElement, message) {
    messageElement.textContent = message;
    popup.classList.add("show");
}

// 안내 팝업 닫기
function closeMessagePopup(popup) {
    popup.classList.remove("show");
}

// 학생 등록 이벤트 연결
function bindAddNew() {
    const studentName = document.getElementById("studentName");
    const studentMobile = document.getElementById("studentMobile");
    const studentBirthday = document.getElementById("studentBirthday");
    const studentEnrollment = document.getElementById("studentEnrollment");
    const studentNameCheck = document.getElementById("studentNameCheck");
    const studentMobileCheck = document.getElementById("studentMobileCheck");
    const studentNameEdit = document.getElementById("studentNameEdit");
    const studentMobileEdit = document.getElementById("studentMobileEdit");
    const studentNameMessage = document.getElementById("studentNameMessage");
    const studentMobileMessage = document.getElementById("studentMobileMessage");
    const studentClass = document.getElementById("studentClass");
    const studentAddSubmit = document.getElementById("studentAddSubmit");
    const studentCheckPopup = document.getElementById("studentCheckPopup");
    const studentCheckPopupMessage = document.getElementById("studentCheckPopupMessage");
    const studentCheckPopupClose = document.getElementById("studentCheckPopupClose");
    const studentAddPopup = document.getElementById("studentAddPopup");
    const studentAddPopupClose = document.getElementById("studentAddPopupClose");

    if (!studentName || !studentMobile || !studentBirthday || !studentEnrollment || !studentNameCheck || !studentMobileCheck || !studentNameEdit || !studentMobileEdit || !studentNameMessage || !studentMobileMessage || !studentClass || !studentAddSubmit || !studentCheckPopup || !studentCheckPopupMessage || !studentCheckPopupClose || !studentAddPopup || !studentAddPopupClose) {
        return;
    }

    // 안내 팝업 닫기
    studentCheckPopupClose.addEventListener("click", () => {
        closeMessagePopup(studentCheckPopup);
    });

    // 학생 등록 완료 팝업 닫기
    studentAddPopupClose.addEventListener("click", () => {
        studentAddPopup.classList.remove("show");
    });

    nameChecked = false;
    mobileChecked = false;

    studentNameEdit.disabled = true;
    studentMobileEdit.disabled = true;

    setToday(studentEnrollment);

    loadMathClasses(studentClass);

    // 이름 입력
    studentName.addEventListener("input", () => {
        if (studentName.disabled) {
            return;
        }

        nameChecked = false;

        studentNameMessage.textContent = "";
        studentNameMessage.className = "";
    });

    // 전화번호 입력
    studentMobile.addEventListener("input", () => {
        if (studentMobile.disabled) {
            return;
        }

        studentMobile.value = formatMobile(studentMobile.value);

        mobileChecked = false;

        studentMobileMessage.textContent = "";
        studentMobileMessage.className = "";
    });

    // 생년월일 입력
    studentBirthday.addEventListener("input", () => {
        studentBirthday.value = formatDateInput(studentBirthday.value);
    });

    // 등록일 입력
    studentEnrollment.addEventListener("input", () => {
        studentEnrollment.value = formatDateInput(studentEnrollment.value);
    });

    // 이름 중복확인
    studentNameCheck.addEventListener("click", async () => {
        await checkName(
            studentName,
            studentNameCheck,
            studentNameEdit,
            studentNameMessage,
            studentCheckPopup,
            studentCheckPopupMessage
        );
    });

    // 전화번호 중복확인
    studentMobileCheck.addEventListener("click", async () => {
        await checkMobile(
            studentMobile,
            studentMobileCheck,
            studentMobileEdit,
            studentMobileMessage,
            studentCheckPopup,
            studentCheckPopupMessage
        );
    });

    // 이름 수정
    studentNameEdit.addEventListener("click", () => {
        studentName.disabled = false;
        studentNameCheck.disabled = false;
        studentNameEdit.disabled = true;

        nameChecked = false;

        studentNameMessage.textContent = "";
        studentNameMessage.className = "";

        studentName.focus();
    });

    // 전화번호 수정
    studentMobileEdit.addEventListener("click", () => {
        studentMobile.disabled = false;
        studentMobileCheck.disabled = false;
        studentMobileEdit.disabled = true;

        mobileChecked = false;

        studentMobileMessage.textContent = "";
        studentMobileMessage.className = "";

        studentMobile.focus();
    });

    // 학생 등록
    studentAddSubmit.addEventListener("click", async () => {
        await addStudent(
            studentName,
            studentMobile,
            studentBirthday,
            studentEnrollment,
            studentClass,
            studentAddSubmit,
            studentNameCheck,
            studentMobileCheck,
            studentNameMessage,
            studentMobileMessage,
            studentNameEdit,
            studentMobileEdit,
            studentAddPopup,
            studentCheckPopup,
            studentCheckPopupMessage
        );
    });
}

// 수학 수업 불러오기
async function loadMathClasses(select) {
    try {
        const classData = await getMathClasses();

        select.innerHTML = "";

        const defaultOption = document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent = "수업을 선택해주세요.";
        defaultOption.disabled = true;
        defaultOption.selected = true;

        select.appendChild(defaultOption);

        Object.keys(classData || {}).forEach(className => {
            const option = document.createElement("option");

            option.value = className;
            option.textContent = className;

            select.appendChild(option);
        });
    } catch (error) {
        select.innerHTML = `
            <option value="">
                수업을 불러오지 못했습니다.
            </option>
        `;
    }
}

// 이름 중복확인
async function checkName(input, button, editButton, message, popup, popupMessage) {
    if (input.disabled || button.disabled) {
        return;
    }

    const inputName = input.value.trim();

    message.textContent = "";
    message.className = "";

    if (!validateName(inputName)) {
        showMessagePopup(popup, popupMessage, "이름을 입력해주세요.");
        return;
    }

    button.disabled = true;

    try {
        const result = await verifyStudentName(inputName);
        const baseName = inputName.replace(/\d/g, "");

        if (result.duplicate) {
            showMessagePopup(
                popup,
                popupMessage,
                `${baseName} ${result.count}명 있습니다. ${result.name}로 저장합니다.`
            );
        } else {
            message.textContent = "중복확인 완료";
            message.className = "success";
        }

        input.value = result.name;
        input.disabled = true;

        nameChecked = true;

        editButton.disabled = false;
    } catch (error) {
        nameChecked = false;

        showMessagePopup(popup, popupMessage, "중복확인에 실패했습니다.");

        button.disabled = false;
    }
}

// 전화번호 중복확인
async function checkMobile(input, button, editButton, message, popup, popupMessage) {
    if (input.disabled || button.disabled) {
        return;
    }

    const mobile = formatMobile(input.value);

    input.value = mobile;

    message.textContent = "";
    message.className = "";

    if (!validateMobile(mobile)) {
        showMessagePopup(popup, popupMessage, "전화번호를 확인해주세요.");
        return;
    }

    button.disabled = true;

    try {
        const exists = await verifyStudentMobile(mobile);

        if (exists) {
            mobileChecked = false;

            showMessagePopup(popup, popupMessage, "이미 등록된 전화번호입니다.");

            button.disabled = false;
            return;
        }

        mobileChecked = true;

        input.disabled = true;

        message.textContent = "중복확인 완료";
        message.className = "success";

        editButton.disabled = false;
    } catch (error) {
        mobileChecked = false;

        showMessagePopup(popup, popupMessage, "중복확인에 실패했습니다.");

        button.disabled = false;
    }
}

// 학생 등록
async function addStudent(studentName, studentMobile, studentBirthday, studentEnrollment, studentClass, studentAddSubmit, studentNameCheck, studentMobileCheck, studentNameMessage, studentMobileMessage, studentNameEdit, studentMobileEdit, studentAddPopup, studentCheckPopup, studentCheckPopupMessage) {
    const name = studentName.value.trim();
    const mobile = formatMobile(studentMobile.value);
    const birthday = formatDateInput(studentBirthday.value);
    const enrollment = formatDateInput(studentEnrollment.value);
    const classValue = studentClass.value;

    studentMobile.value = mobile;
    studentBirthday.value = birthday;
    studentEnrollment.value = enrollment;

    if (!nameChecked) {
        showMessagePopup(studentCheckPopup, studentCheckPopupMessage, "이름 중복확인을 해주세요.");
        studentName.focus();
        return;
    }

    if (!mobileChecked) {
        showMessagePopup(studentCheckPopup, studentCheckPopupMessage, "전화번호 중복확인을 해주세요.");
        studentMobile.focus();
        return;
    }

    const validation = validateStudentInput({
        name,
        mobile,
        birthday,
        enrollment,
        studentClass:classValue
    });

    if (!validation.valid) {
        showMessagePopup(studentCheckPopup, studentCheckPopupMessage, validation.message);

        const targetMap = {
            name:studentName,
            mobile:studentMobile,
            birthday:studentBirthday,
            enrollment:studentEnrollment,
            class:studentClass
        };

        const target = targetMap[validation.target];

        if (target) {
            target.focus();
        }

        return;
    }

    studentAddSubmit.disabled = true;

    try {
        await saveStudent(
            mobile,
            name,
            birthday,
            enrollment,
            classValue
        );

        studentAddPopup.classList.add("show");

        studentName.value = "";
        studentMobile.value = "";
        studentBirthday.value = "";

        setToday(studentEnrollment);

        nameChecked = false;
        mobileChecked = false;

        studentName.disabled = false;
        studentMobile.disabled = false;

        studentNameCheck.disabled = false;
        studentMobileCheck.disabled = false;

        studentNameEdit.disabled = true;
        studentMobileEdit.disabled = true;

        studentNameMessage.textContent = "";
        studentNameMessage.className = "";

        studentMobileMessage.textContent = "";
        studentMobileMessage.className = "";

        studentName.focus();
    } catch (error) {
        showMessagePopup(studentCheckPopup, studentCheckPopupMessage, "학생 등록에 실패했습니다.");
    } finally {
        studentAddSubmit.disabled = false;
    }
}