// adminFirebase.js

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-database.js";

import {
    db
} from "../firebase.js";

// 새 알림 감지
export function watchNewInbox(callback) {
    return onValue(
        ref(db, "inbox/new"),
        (snapshot) => {
            callback(snapshot.exists());
        }
    );
}