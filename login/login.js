// login.js

import {
    getTeacher,
    createTeacherAccount,
    loginTeacher
} from "./loginFirebase.js";

import {
    VERSION,
    ACADEMY_NAME,
    ACADEMY_ADDRESS
} from "../utils.js";

// HTML 요소
const phoneInput = document.getElementById("phoneInput");
const loginBtn = document.getElementById("loginBtn");
const academyName = document.querySelector(".footerLine1");
const academyAddress = document.querySelector(".footerLine2");
const version = document.getElementById("version");

academyName.textContent = ACADEMY_NAME;
academyAddress.textContent = ACADEMY_ADDRESS;
version.textContent = `Ver ${VERSION}`;

// 연락처 오류
const phoneErrorModal = document.getElementById("phoneErrorModal");
const phoneErrorMessage = document.getElementById("phoneErrorMessage");
const phoneErrorOk = document.getElementById("phoneErrorOk");

// 신규회원 비밀번호
const joinModal = document.getElementById("joinModal");
const newPw = document.getElementById("newPw");
const newPwCheck = document.getElementById("newPwCheck");
const joinPwMessage = document.getElementById("joinPwMessage");
const joinPwOk = document.getElementById("joinPwOk");
const joinPwCancel = document.getElementById("joinPwCancel");

// 기존회원 비밀번호
const loginModal = document.getElementById("loginModal");
const loginPwInput = document.getElementById("loginPwInput");
const loginPwMessage = document.getElementById("loginPwMessage");
const loginPwOk = document.getElementById("loginPwOk");
const loginPwCancel = document.getElementById("loginPwCancel");

// 현재 전화번호
let currentPhone = "";

// 전화번호 숫자만 추출
function getPhoneNumber() {
    return phoneInput.value.replace(/[^0-9]/g, "").slice(0, 11);
}

// 전화번호 표시
phoneInput.addEventListener("input", () => {
    const phone = getPhoneNumber();

    if (phone.length <= 3) {
        phoneInput.value = phone;
    } else if (phone.length <= 7) {
        phoneInput.value =
            `${phone.slice(0, 3)}-${phone.slice(3)}`;
    } else {
        phoneInput.value =
            `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
});

// 키보드 위치 조정
function updateKeyboardPosition() {
    if (!window.visualViewport) return;

    const modal = joinModal.classList.contains("hidden")
        ? loginModal
        : joinModal;

    if (modal.classList.contains("hidden")) return;

    const pwBox = modal.querySelector(".pwBox");

    if (!pwBox) return;

    const viewport = window.visualViewport;
    const rect = pwBox.getBoundingClientRect();
    const visibleBottom =
        viewport.offsetTop + viewport.height;
    const overlap =
        rect.bottom - visibleBottom;

    if (overlap > 0) {
        pwBox.style.transform =
            `translateY(-${overlap + 20}px)`;
    } else {
        pwBox.style.transform = "";
    }
}

// 키보드 상태 감지
if (window.visualViewport) {
    window.visualViewport.addEventListener(
        "resize",
        () => {
            requestAnimationFrame(() => {
                updateKeyboardPosition();
            });
        }
    );
}

// 팝업 위치 초기화
function resetPopupPosition(modal) {
    const pwBox = modal.querySelector(".pwBox");

    if (pwBox) {
        pwBox.style.transform = "";
    }
}

// 연락처 오류 표시
function showPhoneError(message) {
    phoneErrorMessage.textContent = message;
    phoneErrorModal.classList.remove("hidden");
}

// 연락처 오류 닫기
phoneErrorOk.addEventListener("click", () => {
    phoneErrorModal.classList.add("hidden");
});

// 신규회원 비밀번호 메시지
function showJoinPwMessage(message) {
    joinPwMessage.textContent = message;
}

function clearJoinPwMessage() {
    joinPwMessage.textContent = "";
}

// 기존회원 비밀번호 메시지
function showLoginPwMessage(message) {
    loginPwMessage.textContent = message;
}

function clearLoginPwMessage() {
    loginPwMessage.textContent = "";
}

// 비밀번호 설정 모달
function showJoinModal() {
    clearJoinPwMessage();

    newPw.value = "";
    newPwCheck.value = "";

    resetPopupPosition(joinModal);
    joinModal.classList.remove("hidden");
    newPw.focus();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateKeyboardPosition();
        });
    });
}

// 비밀번호 확인 모달
function showLoginModal() {
    clearLoginPwMessage();

    loginPwInput.value = "";

    resetPopupPosition(loginModal);
    loginModal.classList.remove("hidden");
    loginPwInput.focus();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateKeyboardPosition();
        });
    });
}

// 로그인 버튼
loginBtn.addEventListener("click", async () => {
    const phone = getPhoneNumber();

    if (
        phone.length !== 11 ||
        !phone.startsWith("010")
    ) {
        showPhoneError("휴대전화 번호를 확인해주세요.");
        return;
    }

    const formattedPhone =
        `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;

    try {
        const teacher =
            await getTeacher(formattedPhone);

        if (!teacher) {
            showPhoneError("정보를 찾을 수 없습니다.");
            return;
        }

        currentPhone = formattedPhone;

        // 신규회원
        if (
            !teacher.uid &&
            !teacher.deviceId
        ) {
            showJoinModal();
            return;
        }

        // 기존회원
        // uid가 없어도 deviceId가 있으면
        // 기존회원 연결 복구로 처리
        showLoginModal();
    } catch (error) {
        console.error("getTeacher 오류:", error);
        showPhoneError("로그인 중 오류가 발생했습니다.");
    }
});

// 신규회원 비밀번호 설정
joinPwOk.addEventListener("click", async () => {
    clearJoinPwMessage();

    const password = newPw.value;
    const passwordCheck = newPwCheck.value;

    if (!password) {
        showJoinPwMessage("비밀번호를 입력해주세요.");
        return;
    }

    if (password.length < 6) {
        showJoinPwMessage("비밀번호는 6자 이상 입력해주세요.");
        return;
    }

    if (password !== passwordCheck) {
        showJoinPwMessage("비밀번호가 일치하지 않습니다.");
        return;
    }

    try {
        joinPwOk.disabled = true;

        const result =
            await createTeacherAccount(
                currentPhone,
                password
            );

        if (!result.success) {
            showJoinPwMessage(
                "비밀번호 설정에 실패했습니다."
            );
            return;
        }

        joinModal.classList.add("hidden");
        resetPopupPosition(joinModal);

        location.href =
            "../loading/loading.html";
    } finally {
        joinPwOk.disabled = false;
    }
});

// 신규회원 비밀번호 취소
joinPwCancel.addEventListener("click", () => {
    joinModal.classList.add("hidden");
    resetPopupPosition(joinModal);
});

// 기존회원 비밀번호 확인
loginPwOk.addEventListener("click", async () => {
    clearLoginPwMessage();

    const password = loginPwInput.value;

    if (!password) {
        showLoginPwMessage("비밀번호를 입력해주세요.");
        return;
    }

    try {
        loginPwOk.disabled = true;

        const result =
            await loginTeacher(
                currentPhone,
                password
            );

        if (!result.success) {
            if (result.reason === "password") {
                showLoginPwMessage(
                    "비밀번호가 일치하지 않습니다."
                );
            } else {
                showLoginPwMessage(
                    "로그인 처리 중 오류가 발생했습니다."
                );
            }

            return;
        }

        loginModal.classList.add("hidden");
        resetPopupPosition(loginModal);

        location.href =
            "../loading/loading.html";
    } finally {
        loginPwOk.disabled = false;
    }
});

// 기존회원 비밀번호 취소
loginPwCancel.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    resetPopupPosition(loginModal);
});