// login.js


import {
    getStudent,
    createStudentAccount,
    loginStudent
} from "./loginFirebase.js";


// HTML 요소
const phoneInput = document.getElementById("phoneInput");
const loginBtn = document.getElementById("loginBtn");

// 연락처 오류
const phoneErrorModal = document.getElementById("phoneErrorModal");
const phoneErrorMessage = document.getElementById("phoneErrorMessage");
const phoneErrorOk = document.getElementById("phoneErrorOk");

// 비밀번호 설정
const joinModal = document.getElementById("joinModal");
const newPw = document.getElementById("newPw");
const newPwCheck = document.getElementById("newPwCheck");
const pwError = document.getElementById("pwError");
const pwOk = document.getElementById("pwOk");
const pwCancel = document.getElementById("pwCancel");

// 비밀번호 확인
const loginModal = document.getElementById("loginModal");
const passwordInput = document.getElementById("passwordInput");
const passwordError = document.getElementById("passwordError");
const passwordOk = document.getElementById("passwordOk");
const passwordCancel = document.getElementById("passwordCancel");


// 현재 전화번호
let currentPhone = "";

// 키보드 위치 조정
function updateKeyboardPosition() {
    if (!window.visualViewport) {
        return;
    }
    const viewportHeight = window.visualViewport.height;
    const keyboardHeight =
        window.innerHeight
        - viewportHeight;

    if (keyboardHeight > 100) {

        joinModal.classList.add("keyboardOpen");
        loginModal.classList.add("keyboardOpen");
        const modal =
            joinModal.classList.contains("hidden")
                ? loginModal
                : joinModal;
        const pwBox = modal.querySelector(".pwBox");
        const boxHeight = pwBox.getBoundingClientRect().height;
        const top =
            Math.max(
                20,
                (viewportHeight - boxHeight) / 2
            );
        pwBox.style.marginTop =
            `${top}px`;
    } else {
        joinModal.classList.remove("keyboardOpen");
        loginModal.classList.remove("keyboardOpen");
        joinModal.querySelector(".pwBox").style.marginTop = "";
        loginModal.querySelector(".pwBox").style.marginTop = "";
    }
}


// 키보드 상태 감지
if (window.visualViewport) {
    window.visualViewport.addEventListener(
        "resize",
        updateKeyboardPosition
    );
    window.visualViewport.addEventListener(
        "scroll",
        updateKeyboardPosition
    );
}

// 전화번호 표시
phoneInput.addEventListener(
    "input",
    () => {

        let phone = phoneInput.value.replace(/[^0-9]/g, "");

        phone = phone.slice(0, 11);
        if (phone.length <= 3) {
            phoneInput.value = phone;
        } else if (phone.length <= 7) {
            phoneInput.value =
                phone.slice(0, 3)
                + "-"
                + phone.slice(3);
        } else {
            phoneInput.value =
                phone.slice(0, 3)
                + "-"
                + phone.slice(3, 7)
                + "-"
                + phone.slice(7);
        }
    }
);


// 연락처 오류 표시
function showPhoneError(message) {
    phoneErrorMessage.textContent = message;
    phoneErrorModal.classList.remove("hidden");
}


// 연락처 오류 닫기
phoneErrorOk.addEventListener(
    "click",
    () => {phoneErrorModal.classList.add("hidden");}
);

// 비밀번호 오류
function showPwError(message) {pwError.textContent = message;}

// 비밀번호 오류 초기화
function clearPwError() {pwError.textContent = "";}

// 기존 비밀번호 오류
function showPasswordError(message) {passwordError.textContent = message;}

// 기존 비밀번호 오류 초기화
function clearPasswordError() {passwordError.textContent = "";}


// 비밀번호 설정 모달
function showJoinModal() {
    clearPwError();
    newPw.value = "";
    newPwCheck.value = "";
    joinModal.classList.remove("hidden");
    newPw.focus();
}

// 비밀번호 확인 모달
function showLoginModal() {
    clearPasswordError();
    passwordInput.value = "";
    loginModal.classList.remove("hidden");
    passwordInput.focus();
}

// 로그인 버튼
loginBtn.addEventListener(
    "click",
    async () => {

        let phone = phoneInput.value.replace(/[^0-9]/g, "");

        // 전화번호 확인
        if (
            phone.length !== 11
            || !phone.startsWith("010")
        ) {
            showPhoneError("휴대전화 번호를 확인해주세요.");
            return;
        }

        // Firebase 저장 형식
        phone =
            phone.slice(0, 3)
            + "-"
            + phone.slice(3, 7)
            + "-"
            + phone.slice(7);

        try {

            // 학생 정보 확인
            const student =
                await getStudent(phone);

            // 등록된 학생이 아닌 경우
            if (!student) {
                showPhoneError("정보를 찾을 수 없습니다.");
                return;
            }

            // 현재 전화번호 저장
            currentPhone = phone;

            // uid가 없는 경우
            if (!student.uid) {
                showJoinModal();
                return;
            }

            // uid가 있는 경우
            showLoginModal();
        } catch (error) {
            showPhoneError("로그인 중 오류가 발생했습니다.");
        }
    }
);


// 비밀번호 설정
pwOk.addEventListener(
    "click",
    async () => {
        clearPwError();

        const password = newPw.value;
        const passwordCheck = newPwCheck.value;

        // 비밀번호 입력 확인
        if (!password) {
            showPwError("비밀번호를 입력해주세요.");
            return;
        }

        // 비밀번호 길이 확인
        if (password.length < 6) {
            showPwError("비밀번호는 6자 이상 입력해주세요.");
            return;
        }

        // 비밀번호 확인
        if (password !== passwordCheck) {
            showPwError("비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            pwOk.disabled = true;
            const success =
                await createStudentAccount(
                    currentPhone,
                    password
                );

            if (!success) {
                showPwError("비밀번호 설정에 실패했습니다.");
                return;
            }

            joinModal.classList.add("hidden");
            location.href = "../attend/attend.html";

        } catch (error) {
            showPwError("비밀번호 설정 중 오류가 발생했습니다.");
        } finally {
            pwOk.disabled = false;
        }
    }
);


// 비밀번호 설정 취소
pwCancel.addEventListener(
    "click",
    () => {joinModal.classList.add("hidden");}
);


// 기존회원 비밀번호 확인
passwordOk.addEventListener(
    "click",
    async () => {

        clearPasswordError();
        const password = passwordInput.value;


        // 비밀번호 입력 확인
        if (!password) {
            showPasswordError("비밀번호를 입력해주세요.");
            return;
        }

        try {
            passwordOk.disabled = true;
            const success =
                await loginStudent(
                    currentPhone,
                    password
                );

            if (!success) {
                showPasswordError("비밀번호가 일치하지 않습니다.");
                return;
            }

            loginModal.classList.add("hidden");
            location.href ="../attend/attend.html";

        } catch (error) {
            showPasswordError("비밀번호 확인 중 오류가 발생했습니다.");
        } finally {
            passwordOk.disabled = false;
        }
    }
);


// 기존회원 비밀번호 취소
passwordCancel.addEventListener(
    "click",
    () => {loginModal.classList.add("hidden");}
);