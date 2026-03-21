// ==UserScript==
// @name         Google 地区显示 中国(大陆)
// @namespace    https://greasyfork.org/users/xxx
// @version      1.3
// @description  把 Google 首页/搜索页的地区显示改为中国(大陆)
// @author       haolinAWA
// @match           https://www.google.com.hk/*
// @match           https://www.google.com/*
// @grant        none
// @run-at       document-end
// @license MIT
// @downloadURL https://update.greasyfork.org/scripts/569184/Google%20%E5%9C%B0%E5%8C%BA%E6%98%BE%E7%A4%BA%20%E4%B8%AD%E5%9B%BD%28%E5%A4%A7%E9%99%86%29.user.js
// @updateURL https://update.greasyfork.org/scripts/569184/Google%20%E5%9C%B0%E5%8C%BA%E6%98%BE%E7%A4%BA%20%E4%B8%AD%E5%9B%BD%28%E5%A4%A7%E9%99%86%29.meta.js
// ==/UserScript==

(function () {
    'use strict';

    const TARGET_TEXT = '中国(大陆)';

    // 防抖函数
    function debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // 核心替换逻辑（只处理文本节点，且尽量早返回）
    function replaceInNode(node) {
        if (node.nodeType !== Node.TEXT_NODE) return;
        let text = node.textContent;
        if (!text) return;

        let changed = false;

        // 情况1：搜索页的位置提示（最常见）
        if (text.includes('是根据您的 IP 地址推断出来的') ||
            text.includes('·') && text.includes('- 新位置信息')) {
            text = text.replace(
                /^([^·\n]+?)\s*·\s*([^·\n]+?)\s*-\s*是根据您的 IP 地址推断出来的\s*-\s*新位置信息/,
                `${TARGET_TEXT} · ${TARGET_TEXT} - 是根据您的 IP 地址推断出来的 - 新位置信息`
            );
            changed = true;
        }

        // 情况2：首页左下角单独的地区名（香港/台湾/新加坡等）
        else if (/^(香港|台湾|新加坡|日本|韩国|美国)$/i.test(text.trim())) {
            text = TARGET_TEXT;
            changed = true;
        }

        if (changed) {
            node.textContent = text;
        }
    }

    // 递归处理一个容器
    function processContainer(container) {
        if (!container) return;
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        let node;
        while ((node = walker.nextNode())) {
            replaceInNode(node);
        }
    }

    // 初始执行 - 只扫描可能出现目标的区域
    function initialReplace() {
        // 优先尝试常见的容器（性能更好）
        const selectors = [
            '#fbar',                    // 首页底部
            'footer',                   // 通用底部
            '#bres',                    // 搜索结果区
            '#taw',                     // 顶部广告+位置提示
            '#rhs',                     // 右侧知识图谱
            'body'                      // 兜底
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) processContainer(el);
        }
    }

    // 防抖后的动态替换
    const debouncedProcess = debounce((container) => {
        processContainer(container || document.body);
    }, 400);

    // 观察器 - 只观察 body 和几个关键父元素
    const observer = new MutationObserver((mutations) => {
        let hasRelevantChange = false;

        for (const mut of mutations) {
            if (mut.type === 'childList' && mut.addedNodes.length > 0) {
                hasRelevantChange = true;
                break;
            }
        }

        if (hasRelevantChange) {
            // 尝试找更精确的容器
            const possibleContainers = document.querySelectorAll('#taw, #fbar, footer, #bres, #result-stats');
            if (possibleContainers.length > 0) {
                possibleContainers.forEach(c => debouncedProcess(c));
            } else {
                debouncedProcess();
            }
        }
    });

    // 启动
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 初次替换（等 DOM 基本稳定）
    if (document.body) {
        initialReplace();
    } else {
        window.addEventListener('DOMContentLoaded', initialReplace, { once: true });
    }

    console.log('Google 地区伪装脚本 v1.3 已启动');
})();
