// check.js

import {
    getTeacherDeviceInfo,
    getAuthUser
} from "./checkFirebase.js";

import {
    VERSION,
    ACADEMY_NAME,
    ACADEMY_ADDRESS,
    getDeviceId
} from "../utils.js";

// HTML 요소
const dots = document.querySelectorAll("#checkDots i");

const PAGE_DELAY = 2000;
const deviceId = getDeviceId();

const academyName = document.querySelector(".footerLine1");
const academyAddress = document.querySelector(".footerLine2");
const version = document.getElementById("version");

academyName.textContent = ACADEMY_NAME;
academyAddress.textContent = ACADEMY_ADDRESS;
version.textContent = `Ver ${VERSION}`;

// 애니메이션
function dotAnimation() {
    if (dots.length !== 3) {
        return;
    }

    dots.forEach(dot => {
        dot.classList.remove("show");
    });

    setTimeout(() => {
        dots[0].classList.add("show");

        setTimeout(() => {
            dots[1].classList.add("show");

            setTimeout(() => {
                dots[2].classList.add("show");

                setTimeout(dotAnimation, 700);
            }, 500);
        }, 500);
    }, 500);
}

// 화면 전환
async function movePage(url) {
    await new Promise(resolve => {
        setTimeout(resolve, PAGE_DELAY);
    });

    location.href = url;
}

// 로그인 확인
async function checkLogin() {
    try {
        const snapshot =
            await getTeacherDeviceInfo(deviceId);

        const user = getAuthUser();

        const deviceData = snapshot.exists()
            ? snapshot.val()
            : null;

        const isLogin =
            user &&
            deviceData &&
            deviceData.uid === user.uid;

        if (isLogin) {
            await movePage("../loading/loading.html");
            return;
        }

        await movePage("../login/login.html");
    } catch (error) {
        await movePage("../login/login.html");
    }
}

dotAnimation();
checkLogin();