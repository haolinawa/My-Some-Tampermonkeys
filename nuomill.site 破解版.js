// ==UserScript==
// @name         nuomill.site 破解版
// @namespace    https://github.com/haolinawa
// @version      1.5
// @description  你说得对，这是nuomill.site 破解版
// @author       haolinAWA
// @match        https://nuomill.site/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_LEVEL = "Lv6 共同体代表";
    const TARGET_LEVEL_NAME = "共同体代表";
    const EXP_TEXT = "1,000,000+ EXP";
    const CURRENT_TEXT = "当前等级";

    let myUsername = null; // 缓存用户名

    let isProcessing = false;
    let lastLevelsRun = 0;

    // 多位置尝试获取用户名
    function tryGetMyUsername() {
        if (myUsername) return true;

        let candidate = null;

        // 优先：如果在 /profile 页面，取 h2 或 p.profile-username
        if (location.pathname === '/profile' || location.pathname.startsWith('/profile/')) {
            // h2 显示名
            const h2 = document.querySelector('.profile-info h2');
            if (h2) candidate = h2.textContent.trim();

            // @用户名
            if (!candidate) {
                const usernameP = document.querySelector('p.profile-username');
                if (usernameP) candidate = usernameP.textContent.trim().replace(/^@/, ''); // 去掉 @
            }
        }

        // 通用位置nickname span
        if (!candidate) {
            const nicknameSpan = document.querySelector('a.nickname span');
            if (nicknameSpan) candidate = nicknameSpan.textContent.trim();
        }

        // popover内的nickname
        if (!candidate) {
            const popoverNickname = document.querySelector('div.v-popover a.nickname span');
            if (popoverNickname) candidate = popoverNickname.textContent.trim();
        }

        // 任何含nickname或username的文本元素
        if (!candidate) {
            const possible = document.querySelectorAll('[class*="nickname"], [class*="username"], h2, .profile-username');
            for (let el of possible) {
                const txt = el.textContent.trim();
                if (txt && txt.length > 1 && !txt.startsWith('@')) { // 避免取 @ 开头的作为显示名
                    candidate = txt;
                    break;
                }
            }
        }

        if (candidate && candidate.length > 1) {
            myUsername = candidate;
            console.log('咱知道你的用户名了，你叫：' + myUsername + '对吧？');
            return true;
        }

        return false;
    }

    // 一些通用修改
    function applyGlobalChanges() {
        document.querySelectorAll('span.level-badge').forEach(el => {
            if (el.textContent.trim() !== TARGET_LEVEL) {
                el.textContent = TARGET_LEVEL;
            }
        });

        document.querySelectorAll('div.exp-bar div.exp-fill').forEach(el => {
            if (el.style.width !== '100%') {
                el.style.cssText = 'width: 100% !important; transition: none !important;';
            }
        });

        document.querySelectorAll('span.exp-text').forEach(el => {
            if (el.textContent.trim() !== EXP_TEXT) {
                el.textContent = EXP_TEXT;
            }
        });
    }

    // levels页面强制Lv6当前
    function fixLevelsCurrent() {
        if (!location.pathname.includes('/levels')) return;

        const now = Date.now();
        if (now - lastLevelsRun < 280) return;
        lastLevelsRun = now;

        document.querySelectorAll('div.level-current').forEach(el => el.remove());
        document.querySelectorAll('div.level-card.active').forEach(card => card.classList.remove('active'));

        let targetCard = null;
        document.querySelectorAll('div.level-card').forEach(card => {
            const nameEl = card.querySelector('span.level-name');
            if (nameEl && nameEl.textContent.trim().includes(TARGET_LEVEL_NAME)) {
                targetCard = card;
            }
        });

        if (targetCard) {
            targetCard.classList.add('active');
            if (!targetCard.querySelector('div.level-current')) {
                const expDiv = targetCard.querySelector('div.level-exp');
                if (expDiv) {
                    const curDiv = document.createElement('div');
                    curDiv.className = 'level-current';
                    curDiv.setAttribute('data-v-ca71f334', '');
                    curDiv.textContent = CURRENT_TEXT;
                    expDiv.insertAdjacentElement('afterend', curDiv);
                }
            }
        }
    }

    // 只改自己的评论等级
    function fixMyCommentLevel() {
        tryGetMyUsername(); // 每次尝试刷新用户名
        if (!myUsername) return;

        document.querySelectorAll('div.comment-author-row span.comment-author').forEach(author => {
            const displayed = author.textContent.trim();
            if (displayed === myUsername || displayed.toLowerCase() === myUsername.toLowerCase()) {
                const level = author.nextElementSibling; // 通常下一个 sibling 就是 comment-level
                if (level && level.classList.contains('comment-level')) {
                    if (level.textContent.trim() !== TARGET_LEVEL) {
                        level.textContent = TARGET_LEVEL;
                    }
                }
            }
        });
    }

    // 主循环
    function mainLoop() {
        if (isProcessing) return;
        isProcessing = true;
        try {
            applyGlobalChanges();
            fixLevelsCurrent();
            fixMyCommentLevel();
        } finally {
            isProcessing = false;
        }
    }

    // 启动！
    function earlyTry() {
        tryGetMyUsername();
        if (document.body) mainLoop();
        else setTimeout(earlyTry, 30);
    }
    earlyTry();

    document.addEventListener('DOMContentLoaded', () => {
        tryGetMyUsername();
        mainLoop();
    }, { once: true });

    // levels定时
    const levelsTimer = setInterval(() => {
        if (location.pathname.includes('/levels')) fixLevelsCurrent();
    }, 300);

    // 用户名加评论等级的定时
    setInterval(() => {
        tryGetMyUsername();
        fixMyCommentLevel();
    }, 500);

    // observer监听所有变化
    const observer = new MutationObserver(mainLoop);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    setInterval(mainLoop, 2000);

    window.addEventListener('beforeunload', () => clearInterval(levelsTimer));
})();
