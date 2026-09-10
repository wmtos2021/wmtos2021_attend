// inbox.js

import {
    onValue,
    ref,
    update
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "../firebase.js";

// NEWS 조회 요소
const newsHistoryList = document.getElementById("newsHistoryList");

// 상태
let completedData = {};
let processingKey = null;

// Inbox 초기화
export function initInbox() {
    if (!newsHistoryList) {
        return;
    }

    watchCompletedNews();
}

// inbox/completed 감시
function watchCompletedNews() {
    onValue(
        ref(db, "inbox/completed"),
        snapshot => {
            completedData = snapshot.exists()
                ? snapshot.val()
                : {};

            renderHistory();
        }
    );
}

// 지급 완료 내역 표시
function renderHistory() {
    const historyKeys = Object.keys(completedData);

    if (historyKeys.length === 0) {
        newsHistoryList.innerHTML = `
            <div class="newsHistoryEmpty">
                지급 완료 내역이 없습니다.
            </div>
        `;
        return;
    }

    historyKeys.sort(
        (a, b) => b.localeCompare(a)
    );

    newsHistoryList.innerHTML = historyKeys
        .map(key => createHistoryItem(
            key,
            completedData[key]
        ))
        .join("");

    bindCancelButtons();
}

// 지급 취소 버튼 연결
function bindCancelButtons() {
    newsHistoryList
        .querySelectorAll(".newsHistoryCancelBtn")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    cancelPayment(
                        button.dataset.key,
                        button
                    );
                }
            );
        });
}

// 지급 완료 내역 생성
function createHistoryItem(key, data) {
    const name = data?.name || "";
    const mobile = data?.mobile || "";
    const product = data?.product || "";

    return `
        <div class="newsHistoryItem">
            <div class="newsHistoryItemContent">
                <div class="newsHistoryItemName">
                    ${escapeHtml(name)}(${escapeHtml(mobile)})
                </div>
                <div class="newsHistoryItemProduct">
                    ${escapeHtml(product)} 교환신청
                </div>
                <div class="newsHistoryItemDate">
                    ${escapeHtml(key)}
                </div>
            </div>
            <button
                class="newsHistoryCancelBtn"
                type="button"
                data-key="${escapeHtml(key)}">
                지급<br>취소
            </button>
        </div>
    `;
}

// 지급 취소
async function cancelPayment(key, button) {
    if (processingKey) {
        return;
    }

    const data = completedData[key];

    if (!data) {
        return;
    }

    processingKey = key;

    if (button) {
        button.disabled = true;
    }

    try {
        const updates = {
            [`inbox/new/${key}`]: data,
            [`inbox/completed/${key}`]: null
        };

        await update(
            ref(db),
            updates
        );
    } catch (error) {
        console.error(
            "NEWS 지급 취소 처리 실패:",
            error
        );

        if (button) {
            button.disabled = false;
        }
    } finally {
        processingKey = null;
    }
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