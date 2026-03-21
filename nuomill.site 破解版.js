// ==UserScript==
// @name         nuomill.site 破解版
// @namespace    https://github.com/haolinawa
// @version      1.0
// @description  你说得对，这是uomill.site 破解版
// @author       haolinAWA
// @match        https://nuomill.site/*
// @grant        none
// @run-at       document-start
// @license MIT
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_LEVEL = "Lv6 共同体代表";
    const TARGET_LEVEL_NAME = "共同体代表";
    const EXP_TEXT = "1,000,000+ EXP";
    const CURRENT_TEXT = "当前等级";

    let isProcessing = false;
    let lastLevelsRun = 0;

    // only通用修改
    function applyGlobalChanges() {
        // level-badge
        document.querySelectorAll('span.level-badge').forEach(el => {
            if (el.textContent.trim() !== TARGET_LEVEL) {
                el.textContent = TARGET_LEVEL;
            }
        });

        // 等级进度条变成100%
        document.querySelectorAll('div.exp-bar div.exp-fill').forEach(el => {
            if (el.style.width !== '100%') {
                el.style.cssText = 'width: 100% !important; transition: none !important;';
            }
        });

        // exp-text
        document.querySelectorAll('span.exp-text').forEach(el => {
            if (el.textContent.trim() !== EXP_TEXT) {
                el.textContent = EXP_TEXT;
            }
        });
    }

    // 强制把当前等级放到Lv6
    function fixLevelsCurrent() {
        if (!location.pathname.includes('/levels')) return;

        const now = Date.now();
        if (now - lastLevelsRun < 280) return;
        lastLevelsRun = now;

        // 先全局移除所有当前等级（清掉网站原生的和之前脚本加的）
        document.querySelectorAll('div.level-current').forEach(el => el.remove());

        // 移除所有active
        document.querySelectorAll('div.level-card.active').forEach(card => {
            card.classList.remove('active');
        });

        // 找到Lv6卡片
        let targetCard = null;
        document.querySelectorAll('div.level-card').forEach(card => {
            const nameEl = card.querySelector('span.level-name');
            if (nameEl && nameEl.textContent.trim().includes(TARGET_LEVEL_NAME)) {
                targetCard = card;
            }
        });

        // 如果找到就加active还有插入当前等级
        if (targetCard) {
            targetCard.classList.add('active');

            // 确认没重复才插入cwc
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

    // 主循环函数
    function mainLoop() {
        if (isProcessing) return;
        isProcessing = true;
        try {
            applyGlobalChanges();
            fixLevelsCurrent();
        } finally {
            isProcessing = false;
        }
    }

    // 极早执行
    function tryEarlyRun() {
        if (document.body) {
            mainLoop();
        } else {
            setTimeout(tryEarlyRun, 30);
        }
    }
    tryEarlyRun();

    // DOMContentLoaded再run一次
    document.addEventListener('DOMContentLoaded', mainLoop, { once: true });

    // 专门为levels页的快速修复定时器（只在levels路径下有效捏）
    const levelsInterval = setInterval(() => {
        if (location.pathname.includes('/levels')) {
            fixLevelsCurrent();
        }
    }, 300);

    // 通用变化监听
    const observer = new MutationObserver(mutations => {
        const hasRelevantChange = mutations.some(m =>
            m.type === 'childList' ||
            (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'style'))
        );
        if (hasRelevantChange) {
            mainLoop();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    // 兜底
    setInterval(mainLoop, 2000);

    // 清理定时器（防内存泄漏）
    window.addEventListener('beforeunload', () => {
        clearInterval(levelsInterval);
    });
})();
