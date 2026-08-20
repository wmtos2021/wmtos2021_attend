// attendPop.js


const attendModal = document.getElementById("attendModal");
const resultAttendImage = document.getElementById("resultAttendImage");
const wisdomTitle = document.getElementById("wisdomTitle");
const wisdomMessage = document.getElementById("wisdomMessage");
const attendPoint = document.getElementById("attendPoint");
const attendConfirmBtn = document.getElementById("attendConfirmBtn");
const alertModal = document.getElementById("alertModal");
const alertMessageText = document.getElementById("alertMessage");
const alertConfirmBtn = document.getElementById("alertConfirmBtn");

let confirmCallback = null;


// 알림 팝업
export function alertMessage(message) {
    alertMessageText.textContent = message;
    alertModal.classList.remove("hidden");
}


// 알림 팝업 닫기
alertConfirmBtn.addEventListener(
    "click",
    () => {alertModal.classList.add("hidden");}
);


// 출석 팝업
export function showAttendPopup(
    image,
    point,
    title,
    message,
    callback
) {
    setTimeout(() => {
        resultAttendImage.src = image;
        attendPoint.textContent = point;
        wisdomTitle.textContent = title;
        wisdomMessage.textContent = message;
        resultAttendImage.style.display = "block";
        attendPoint.parentElement.style.display = "block";
        attendConfirmBtn.style.display = "block";
        wisdomTitle.style.display = "block";
        wisdomMessage.style.marginBottom = "0px";
        wisdomMessage.style.removeProperty("font-size");
        confirmCallback = callback;
        attendModal.classList.remove("hidden");
    }, 500);
}


// 출석 팝업 확인
attendConfirmBtn.addEventListener(
    "click",
    async () => {
        attendModal.classList.add("hidden");

        if (confirmCallback) {
            const callback = confirmCallback;
            confirmCallback = null;
            await callback();
        }
    }
);


// 안내 팝업
export function showAttendMessage(message) {
    setTimeout(() => {
        resultAttendImage.style.display = "none";
        attendPoint.parentElement.style.display = "none";
        attendConfirmBtn.style.display = "none";
        wisdomTitle.style.display = "none";

        wisdomMessage.textContent = message;
        wisdomMessage.style.marginBottom = "10px";
        wisdomMessage.style.fontSize = "16px";

        attendModal.classList.remove("hidden");

        setTimeout(() => {
            attendModal.classList.add("hidden");
            resultAttendImage.style.display = "block";
            attendPoint.parentElement.style.display = "block";
            attendConfirmBtn.style.display = "block";
            wisdomTitle.style.display = "block";
            wisdomMessage.style.marginBottom = "0px";
            wisdomMessage.style.removeProperty("font-size");
        }, 3000);
    }, 500);
}