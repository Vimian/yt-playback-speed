// ==UserScript==
// @name         yt-playback-speed
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       You
// @match        https://*.youtube.com/watch?*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

const STORAGE_KEY = "rate_index";

(function () {
    "use strict";

    const rates = [
        0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0,
    ];
    let index = GM_getValue(STORAGE_KEY) || 3;

    function listenForClassChange(player_class, video_class) {
        const player_element = document.querySelector(player_class);
        const video_element = document.querySelector(video_class);
        var adStarted = 0;

        const observer = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (
                    mutation.attributeName === "class" &&
                    mutation.target === player_element
                ) {
                    console.log("Class changed:");
                    if (player_element.classList.contains("ad-showing")) {
                        video_element.muted = true;
                        if (document.querySelector(".ytp-skip-ad-button")) {
                            document
                                .querySelector(".ytp-skip-ad-button")
                                .click();
                            console.log("Ad skipped!");
                            video_element.muted = false;
                        } else if (adStarted === 0) {
                            adStarted = new Date().getTime();
                            setTimeout(() => {
                                video_element.playbackRate = 16.0;
                            }, 2000);
                            //video_element.playbackRate = 16.0;
                        } else if (adStarted < new Date().getTime() - 2000) {
                            video_element.playbackRate = 16.0;
                        }
                    } else {
                        video_element.playbackRate = rates[index];
                        video_element.muted = false;
                        adStarted = 0;
                    }
                }
            });
        });

        observer.observe(player_element, { attributes: true });
    }

    function createVideoPlaybackRateControl(parent_identifier, video_class) {
        const video_element = document.querySelector(video_class);
        const parent_element = document.querySelector(parent_identifier);
        const firstChild = parent_element.firstChild;

        function createButton(text, clickHandler) {
            const button = document.createElement("button");
            button.innerHTML = text;
            button.style.margin = "0 5px";
            button.style.padding = "5px 15px";
            button.style.border = "1px solid #ccc";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.addEventListener("click", clickHandler);
            return button;
        }

        const decrementButton = createButton("-", function () {
            index--;
            if (index < 0) index = 0;
            counterSpan.textContent = rates[index];
            video_element.playbackRate = rates[index];
            GM_setValue(STORAGE_KEY, index);
        });

        const incrementButton = createButton("+", function () {
            index++;
            if (index >= rates.length) index = rates.length - 1;
            counterSpan.textContent = rates[index];
            video_element.playbackRate = rates[index];
            GM_setValue(STORAGE_KEY, index);
        });

        const counterSpan = document.createElement("b");
        counterSpan.id = "video-playback-rate";
        counterSpan.textContent = rates[index];
        counterSpan.style.fontSize = "1.5em";
        counterSpan.style.padding = "5px";
        counterSpan.style.backgroundColor = "#FFFFFF";

        const holderDiv = document.createElement("div");
        holderDiv.style.display = "flex";
        holderDiv.style.alignItems = "center";

        holderDiv.appendChild(decrementButton);
        holderDiv.appendChild(counterSpan);
        holderDiv.appendChild(incrementButton);

        const holderHolderDiv = document.createElement("div");
        holderHolderDiv.style.display = "flex";
        holderHolderDiv.style.flexDirection = "column";
        holderHolderDiv.style.alignItems = "center";

        holderHolderDiv.appendChild(holderDiv);

        parent_element.insertBefore(holderHolderDiv, firstChild);
    }

    const registerSkipper = setInterval(() => {
        if (
            document.querySelector(".html5-video-player") &&
            document.querySelector(".html5-main-video")
        ) {
            listenForClassChange(".html5-video-player", ".html5-main-video");
            clearInterval(registerSkipper);
        }
    }, 100);

    const registerPlaybackRateControl = setInterval(() => {
        if (
            document.querySelector("#primary-inner #below").firstChild &&
            document.querySelector(".html5-main-video")
        ) {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                window.trustedTypes.createPolicy("default", {
                    createHTML: (string, sink) => string,
                });
            }
            createVideoPlaybackRateControl(
                "#primary-inner #below",
                ".html5-main-video"
            );
            clearInterval(registerPlaybackRateControl);
        }
    }, 100);
})();
