// attend.js


import {
    getDeviceId,
    getSeoulDay,
    getSeoulTime
} from "../utils.js";

import {
    getDeviceInfo,
    getClassTime,
    updateLastAttend,
    updateWisdom,
    saveAttendHistory,
    updateTotalP
} from "./attendFirebase.js";

import {
    checkAcademyDistance,
    ALLOW_DISTANCE
} from "./gps.js";

import {
    showAttendPopup,
    showAttendMessage
} from "./attendPop.js";

import {getWisdom} from "./wisdom.js";


// HTML 요소
const attendImage = document.getElementById("attendImage");


// 오늘 정보
const deviceId = getDeviceId();

let todayClassTime = null;
let todayWisdom = null;
let todayMobile = null;
let todayLastAttend = null;
let attendTimestamp = null;
let todayLatitude = null;
let todayLongitude = null;
let attendPointValue = 0;


// 출석 버튼
attendImage.style.pointerEvents = "none";


// 정보 가져오기
async function loadTodayInfo() {

    const deviceInfo = 
        await getDeviceInfo(deviceId);

    if (!deviceInfo) {
        showAttendMessage("학원생이 아닙니다.\n선생님께 문의하세요.");
        return false;
    }

    todayClassTime = await getClassTime(
        deviceInfo.class,
        getSeoulDay()
    );

    todayWisdom = deviceInfo.wisdom;
    todayMobile = deviceInfo.mobile;
    todayLastAttend = deviceInfo.lastAttend || "";
    attendTimestamp = deviceInfo.attendTimestamp || null;

        showAttendMessage(
            `attendTimestamp: ${attendTimestamp}\n\n` +
            `현재시간: ${Date.now()}\n\n` +
            `차이: ${Date.now() - attendTimestamp}ms`
        );

    todayLatitude = deviceInfo.latitude;
    todayLongitude = deviceInfo.longitude;

    attendImage.style.pointerEvents = "auto";

    return true;
}


// 오늘 정보 확인
loadTodayInfo()
    .catch(() => {
        showAttendMessage("학원생이 아닙니다.\n선생님께 문의하세요.");
    });


// 출석 버튼
attendImage.addEventListener(
    "click",
    async () => {
        try {

            // QR 유효시간 확인
            if (
                !attendTimestamp
                || Date.now() - attendTimestamp > 5 * 60 * 1000
            ) {
                showAttendMessage("출석체크 QR을 새로 인식해주세요.");
                return;
            }

            // 학원과의 거리 확인
            const distance = 
                checkAcademyDistance(
                    todayLatitude,
                    todayLongitude
                );

            if (distance > ALLOW_DISTANCE) {
                showAttendMessage("학원에 등원 후 출석해주세요.");
                return;
            }

            // 오늘 이미 출석한 경우
            const today =
                new Date()
                    .toLocaleDateString(
                        "sv-SE",
                        {timeZone: "Asia/Seoul"}
                    );

            if (todayLastAttend === today) {
                showAttendMessage("이미 출석을 완료했어요!");
                return;
            }

            // 수업이 없는 날
            if (!todayClassTime) {
                showAttendMessage("수업이 없는 날입니다.");
                return;
            }

            // 수업시간 확인
            const currentTime = getSeoulTime();
            const classParts = todayClassTime.split(":");
            const classMinutes =
                Number(classParts[0]) * 60
                + Number(classParts[1]);

            const currentParts = currentTime.split(":");
            const currentMinutes =
                Number(currentParts[0]) * 60
                + Number(currentParts[1]);

            // 출석 포인트
            let image = "";
            let point = "";

            if (currentMinutes < classMinutes) {
                image = "../image/attend1_투명.webp";
                point = "+ 100P";
                attendPointValue = 100;

            } else if (
                currentMinutes < classMinutes + 10
            ) {
                image = "../image/attend2_투명.webp";
                point = "+ 100P";
                attendPointValue = 100;

            } else {
                image = "../image/attend3_투명.webp";
                point = "+ 0P";
                attendPointValue = 0;
            }

            // 오늘의 명언
            const wisdom = getWisdom(todayWisdom);

            // 출석 팝업
            showAttendPopup(
                image,
                point,
                wisdom.title,
                wisdom.message,
                async () => {

                    const time =
                        new Date()
                            .toLocaleTimeString(
                                "en-GB",
                                {
                                    timeZone: "Asia/Seoul",
                                    hour12: false
                                }
                            );

                    // 출석일 저장
                    await updateLastAttend(
                        deviceId,
                        todayMobile,
                        today
                    );

                    // 출석 기록 저장
                    const saved =
                        await saveAttendHistory(
                            todayMobile,
                            today,
                            time,
                            attendPointValue
                        );

                    // 포인트 누적
                    if (saved) {
                        await updateTotalP(
                            todayMobile,
                            attendPointValue
                        );
                    }

                    // 다음 명언 저장
                    todayWisdom =
                        await updateWisdom(
                            deviceId,
                            todayWisdom
                        );

                    todayLastAttend = today;
                }
            );

        } catch (error) {

            showAttendMessage("출석 처리 중 오류가 발생했습니다.");
        }
    }
);