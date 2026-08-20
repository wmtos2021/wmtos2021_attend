// check.js


import {
    getDeviceInfo,
    updateAttendTimestamp,
    getAuthUser
} from "./checkFirebase.js";

const checkMessage = document.getElementById("checkMessage");

// 애니메이션
function dotAnimation() {
    const dot1 = document.querySelector(".dot1");
    const dot2 = document.querySelector(".dot2");
    const dot3 = document.querySelector(".dot3");

    dot1.classList.remove("show");
    dot2.classList.remove("show");
    dot3.classList.remove("show");

    setTimeout(() => {
        dot1.classList.add("show");

        setTimeout(() => {
            dot2.classList.add("show");

            setTimeout(() => {
                dot3.classList.add("show");

                // 다시 처음
                setTimeout(() => {
                    dotAnimation();
                }, 700);
            }, 700);
        }, 700);
    }, 500);
}

dotAnimation();


// Device ID 확인
let deviceId =
    localStorage.getItem("deviceId");


// Device ID가 없는 경우
if (!deviceId) {
    deviceId = crypto.randomUUID();

    localStorage.setItem(
        "deviceId",
        deviceId
    );

}


// 위치정보 확인
function getLocation() {
    return new Promise((resolve, reject) => {

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve(position);
            },

            (error) => {
                reject(error);
            },

            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}


// 위치정보를 얻을 때까지 확인
async function checkLocation() {
    while (true) {
        try {
            const position =
                await getLocation();

            return position;

        } catch (error) {

        }
    }
}


// 화면 전환
async function movePage(url) {

    // 자동 로그인 화면 최소 2초 유지
    await new Promise(resolve =>
        setTimeout(resolve, 2000)
    );

    location.href = url;
}


// 로그인 확인
async function checkLogin() {
    try {

        // 위치정보 확인
        const position = await checkLocation();

        // 위치정보 및 QR 인식 시간 갱신
        await updateAttendTimestamp(
            deviceId,
            position.coords.latitude,
            position.coords.longitude
        );

        // Firebase에서 Device ID 확인
        const snapshot = await getDeviceInfo(deviceId);

        // Firebase Authentication 확인
        const user = getAuthUser();
        let isLogin = false;

        // Auth 사용자가 있는 경우
        if (
            user
            && snapshot.exists()
            && snapshot.val().uid === user.uid
        ) {
            isLogin = true;
        }

        // 정상 로그인
        if (isLogin) {
            await movePage( "../attend/attend.html");

            return;
        }

        // 로그인 필요
        await movePage( "../login/login.html");

    } catch (error) {

        // 오류 발생 시 로그인
        await movePage( "../login/login.html");

    }
}

checkLogin();