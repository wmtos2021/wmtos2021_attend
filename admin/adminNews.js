// adminNews.js

import {
    onValue,
    ref,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "../firebase.js";

// NEWS 요소
let informBtn;
let informBadge;
let informModal;
let informModalList;
let informModalClose;

// 상태
let newsData = {};
let processingKey = null;

// NEWS 초기화
export function initNews() {
    informBtn = document.getElementById("informBtn");
    informBadge = document.getElementById("informBadge");
    informModal = document.getElementById("informModal");
    informModalList = document.getElementById("informModalList");
    informModalClose = document.getElementById("informModalClose");

    if (
        !informBtn ||
        !informBadge ||
        !informModal ||
        !informModalList ||
        !informModalClose
    ) {
        return;
    }

    watchNews();
    bindNewsEvents();
}

// inbox/new 감시
function watchNews() {
    onValue(
        ref(db, "inbox/new"),
        snapshot => {
            newsData = snapshot.exists()
                ? snapshot.val()
                : {};

            updateBadge();
            renderNews();
        }
    );
}

// 알림 배지
function updateBadge() {
    const hasNews = Object.keys(newsData).length > 0;

    informBadge.classList.toggle(
        "hidden",
        !hasNews
    );
}

// NEWS 목록 표시
function renderNews() {
    const newsKeys = Object.keys(newsData);

    if (newsKeys.length === 0) {
        informModalList.innerHTML = `
            <div class="informEmpty">
                새 알림이 없습니다.
            </div>
        `;
        return;
    }

    newsKeys.sort(
        (a, b) => b.localeCompare(a)
    );

    informModalList.innerHTML = newsKeys
        .map(key => createNewsItem(key, newsData[key]))
        .join("");

    bindCompleteButtons();
}

// 지급 완료 버튼 연결
function bindCompleteButtons() {
    informModalList
        .querySelectorAll(".informCompleteBtn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    completeNews(
                        button.dataset.key,
                        button
                    );
                }
            );
        });
}

// NEWS 항목 생성
function createNewsItem(key, data) {
    const name = data?.name || "";
    const mobile = data?.mobile || "";
    const product = data?.product || "";

    return `
        <div class="informItem">
            <div class="informItemContent">
                <div class="informItemName">
                    ${escapeHtml(name)}(${escapeHtml(mobile)})
                </div>
                <div class="informItemProduct">
                    ${escapeHtml(product)} 교환신청
                </div>
                <div class="informItemDate">
                    ${escapeHtml(key)}
                </div>
            </div>
            <button
                class="informCompleteBtn"
                type="button"
                data-key="${escapeHtml(key)}">
                지급<br>완료
            </button>
        </div>
    `;
}

// 지급 완료
async function completeNews(key, button) {
    if (processingKey) {
        return;
    }

    const data = newsData[key];

    if (!data) {
        return;
    }

    processingKey = key;

    if (button) {
        button.disabled = true;
    }

    try {
        const updates = {
            [`inbox/completed/${key}`]: data,
            [`inbox/new/${key}`]: null
        };

        await update(
            ref(db),
            updates
        );
    } catch (error) {

        if (button) {
            button.disabled = false;
        }
    } finally {
        processingKey = null;
    }
}

// NEWS 열기 / 닫기
function bindNewsEvents() {
    informBtn.addEventListener(
        "click",
        () => {
            informModal.classList.remove(
                "hidden"
            );
        }
    );

    informModalClose.addEventListener(
        "click",
        () => {
            informModal.classList.add(
                "hidden"
            );
        }
    );

    informModal.addEventListener(
        "click",
        event => {
            if (event.target === informModal) {
                informModal.classList.add(
                    "hidden"
                );
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape" &&
                !informModal.classList.contains("hidden")
            ) {
                informModal.classList.add(
                    "hidden"
                );
            }
        }
    );
}

// HTML 문자열 안전 처리
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}