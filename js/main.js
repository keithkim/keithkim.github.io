/*
 @requires jQuery v1.7 or later (tested on 1.11.2)
*/
"use strict";

var isFirefox = typeof InstallTrigger !== 'undefined',
mobileVar = isMobile.any;

var videoFailureCheckTimeout = null;
var lastLoadedVideoUrl = null;
var lastLoadedVideoStartAt = null;
var videoFallbackAttempts = 0;
var VIDEO_FALLBACK_MAX_ATTEMPTS = 5;

function scheduleVideoFailureCheck(instance) {
    if (videoFailureCheckTimeout) clearTimeout(videoFailureCheckTimeout);
    videoFailureCheckTimeout = setTimeout(function() {
        videoFailureCheckTimeout = null;
        if (!instance || instance.currentState !== 'notstarted') return;
        console.error('Video failed to play (e.g. embed disabled on other site):', lastLoadedVideoUrl);
        if (videoFallbackAttempts >= VIDEO_FALLBACK_MAX_ATTEMPTS) {
            console.error('Max fallback attempts reached, stopping.');
            return;
        }
        var result = (typeof SeasonVideo !== 'undefined' && SeasonVideo.getAnotherVideoUrl)
            ? SeasonVideo.getAnotherVideoUrl(lastLoadedVideoUrl) : null;
        if (result && result.url) {
            videoFallbackAttempts += 1;
            lastLoadedVideoUrl = result.url;
            lastLoadedVideoStartAt = result.startAt != null ? result.startAt : undefined;
            instance.setSource(result.url);
            if (result.startAt != null && typeof instance.setStartAt === 'function') {
                instance.setStartAt(result.startAt);
            }
            scheduleVideoFailureCheck(instance);
        }
    }, 5000);
}

function initVideoBackground() {
    if (!$('[data-vbg]').length) return;
    videoFallbackAttempts = 0;
    /* Season-based video (New York): pick random video for current season */
    var videoResult = (typeof SeasonVideo !== 'undefined' && SeasonVideo.getVideoUrl)
        ? SeasonVideo.getVideoUrl()
        : { url: 'https://www.youtube.com/watch?v=0QKdqm5TX6c', startAt: undefined };
    var videoUrl = (videoResult && videoResult.url) ? videoResult.url : 'https://www.youtube.com/watch?v=0QKdqm5TX6c';
    var videoStartAt = (videoResult && videoResult.startAt != null) ? videoResult.startAt : undefined;
    lastLoadedVideoUrl = videoUrl;
    lastLoadedVideoStartAt = videoStartAt;
    $('#yt-background').attr('data-vbg', videoUrl);
    if (videoStartAt != null) $('#yt-background').attr('data-vbg-start-at', videoStartAt);
    /* Start muted so Chrome/Brave allow autoplay (like Textomy); any key toggles mute/unmute */
    $('[data-vbg]').youtube_background({ muted: true });
    $('#yt-background').on('video-background-ready', function() {
        console.log('Video playing:', lastLoadedVideoUrl);
        TweenMax.fromTo($(".bg-cover"), 0.25, {autoAlpha: 0}, {autoAlpha: 1});
        var ytEl = document.getElementById('yt-background');
        if (typeof VIDEO_BACKGROUNDS !== 'undefined' && ytEl) {
            var instance = VIDEO_BACKGROUNDS.get(ytEl);
            if (instance) {
                if (lastLoadedVideoStartAt != null && typeof instance.seekTo === 'function') {
                    instance.seekTo(lastLoadedVideoStartAt);
                }
                scheduleVideoFailureCheck(instance);
                document.addEventListener('keydown', function(e) {
                    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
                    var isEnter = (e.key === 'Enter' || e.keyCode === 13);
                    if (isEnter) {
                        e.preventDefault();
                        var result = (typeof SeasonVideo !== 'undefined' && SeasonVideo.getRandomVideoUrl)
                            ? SeasonVideo.getRandomVideoUrl() : null;
                        if (result && result.url) {
                            videoFallbackAttempts = 0;
                            lastLoadedVideoUrl = result.url;
                            lastLoadedVideoStartAt = result.startAt != null ? result.startAt : undefined;
                            if (videoFailureCheckTimeout) clearTimeout(videoFailureCheckTimeout);
                            videoFailureCheckTimeout = null;
                            instance.setSource(result.url);
                            if (result.startAt != null && typeof instance.setStartAt === 'function') {
                                instance.setStartAt(result.startAt);
                            }
                            scheduleVideoFailureCheck(instance);
                        }
                        return;
                    }
                    e.preventDefault();
                    if (instance.muted) {
                        instance.unmute();
                    } else {
                        instance.mute();
                    }
                });
                document.addEventListener('click', function(e) {
                    if (/^(A|INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target.tagName)) return;
                    if (e.target.closest && e.target.closest('a')) return;
                    e.preventDefault();
                    if (instance.muted) {
                        instance.unmute();
                    } else {
                        instance.mute();
                    }
                });
            }
        }
    });
}

function initImageBackground() {
    if (!$('.bg-cover').length || $('[data-vbg]').length) return;
    $('.bg-cover').imagesLoaded({
        background: true
    }, function( imgLoad ) {
        TweenMax.fromTo($(".bg-cover"), 0.25, {autoAlpha: 0}, {autoAlpha: 1});
    });
}

$(document).ready(function() {
    if ($('[data-vbg]').length) {
        function runVideoInit() {
            if (typeof YT !== 'undefined' && typeof YT.Player === 'function') {
                initVideoBackground();
                return;
            }
            var attempts = 0;
            var t = setInterval(function() {
                attempts++;
                if (typeof YT !== 'undefined' && typeof YT.Player === 'function') {
                    clearInterval(t);
                    initVideoBackground();
                    return;
                }
                if (attempts > 150) clearInterval(t);
            }, 100);
        }
        if (window.ytApiReady || (typeof YT !== 'undefined' && typeof YT.Player === 'function')) {
            initVideoBackground();
        } else {
            runVideoInit();
        }
    } else if ($('.bg-cover').length) {
        initImageBackground();
    }
});

$(window).load(function() {

    /* ==================================================================
	1.0 Initiate Canvas BG Animations
	================================================================== */
    var drifterBG = "#EC008C";
    if($("#minimos-4").length) {
        drifterBG = "#F8EB31";
    }

    // Initiate Canvas Background Animation
    if($("#drifter").length) {
        initDrifter("drifter", drifterBG);
    } else if($("#particles-js").length) {
        initStompParticles();
    }

    /* ==================================================================
	2.0 Initialize Countdown
	================================================================== */
    var $countDown = $(".st-countdown");
    $countDown.countdown("2017/09/01", function(event) {
        $(this).html(
            event.strftime('%D Days %H:%M:%S')
        );
    });

    $(".btn-count").hover(
        function () {
            $countDown.countdown('pause');
            $(".st-countdown").html("Bid on Flippa");
        },
        function () {
            $countDown.countdown('resume');
        }
    );

    /* ==================================================================
	3.0 Animation Function
	================================================================== */
    var $paragraph = $(".main-content p"),
    $heading = $(".main-content h3"),
    $footer = $(".main-content ul"),
    blurRadius = "20px", // Change blur radius for animation here
    paraSplit, headSplit,
    animTL = new TimelineMax({
        paused: true,
        delay: 0.05,
        onComplete: handleComplete,
        onCompleteParams: []
    });

    /* Blur radius variant for performance */
    if(isFirefox) {
        blurRadius = "0px";
    } else if(mobileVar) {
        blurRadius = "2px";
    }

    function initAnimation() {
        if($heading.length) {
            headSplit = new SplitText($heading, {
                type: "words,chars",
                wordsClass: "gpu-hack sven-word-++",
                charsClass: "sven-char-++"
            });
            animTL.staggerFromTo(headSplit.chars, 0.4, {
                y: "-50%",
                opacity: 0
            }, {
                y: "0%",
                opacity: 1,
                ease: Bounce.easeOut
            }, 0.08);
            animTL.addLabel("end");
            animTL.call(headingComplete, []);
        }

        if($paragraph.length) {
            paraSplit = new SplitText($paragraph, {
                type: "words,chars",
                wordsClass: "gpu-hack s-word sven-word-++",
                charsClass: "s-char sven-char-++"
            });
            // force3D on all chars and add rotationZ
            TweenMax.set(paraSplit.chars, {
                force3D: true,
                rotationZ: "0.01deg"
            });
            $.each(paraSplit.chars, function(index, el) {
                var textColor = $(el).css("color");
                var tweenPos = "end+=" + (index) * 0.04;
                animTL.fromTo($(el), 0.8, {
                    opacity: 0,
                    textShadow: "0 0 " + blurRadius + " " + textColor,
                    scale: 1.2,
                    color: "transparent"
                }, {
                    opacity: 1,
                    scale: 1,
                    color: textColor,
                    textShadow: "none",
                    ease: Linear.easeNone
                }, tweenPos);
            });
        }
        TweenMax.set($(".main-content"), {visibility: "visible"});
        TweenMax.set($(".preloader"), {display: "none"});
        animTL.play();
    }

    function handleComplete() {
        if($footer.length) {
            TweenMax.to($footer, 0.75, {autoAlpha: 1, ease: Linear.easeNone});
        }


    }

    function headingComplete() {
        $countDown.countdown('resume'); // Resume countdown after animation ends
    }

    /* ==================================================================
	4.0 Initialize Animation
	================================================================== */
    $countDown.countdown('pause'); // Pause countdown before animating
    initAnimation();

});
