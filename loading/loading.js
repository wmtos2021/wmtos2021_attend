// loading.js

import {
    loadTeacherData
} from "./loadingFirebase.js";

import { VERSION } from "../utils.js";

const dots = document.querySelectorAll(".loadingDots i");
const version = document.getElementById("version");

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

dotAnimation();

// 선생님 기본 정보 준비
async function startLoading() {
    try {
        const loaded = await loadTeacherData();

        if (!loaded) {
            return;
        }

        location.href = "../admin/admin.html"; // "../teacher/teacher.html";
    } catch (error) {
        return;
    }
}

startLoading();