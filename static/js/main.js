let $activeVideo = null;
let videoCache = {};
let videoOrder = [];
let videoCacheSize = 0;
let isMuted = true;
let isPlaying = false;
let state = 'landing-active';

const MAX_CACHE_SIZE = 5000 * 1024 * 1024;

function setVideoIndices() {
    $('.all-videos .video').not('.clear').each(function(index) {
        $(this).find('.num').text('#' + index);
    });
}

function getRandomPadding(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min + 'px';
}

function createRandomPadding() {
    $('.video').each(function() {
        const randomPadding = getRandomPadding(30, 80);
        $(this).find('span:not(.num)').css('padding-right', randomPadding);
    });
}

function formatMultilineText(text) {
    return String(text).replace(/\\n/g, '<br>');
}

function createOrGetVideo(url) {
    if (videoCache[url]) {
        const cachedVideo = videoCache[url];
        cachedVideo.muted = isMuted;
        cachedVideo.volume = isMuted ? 0 : 0.5;
        
        if (cachedVideo.readyState < 3) {
            return cachedVideo;
        }
        
        cachedVideo.currentTime = 0;
        return cachedVideo;
    }

    const video = document.createElement('video');
    
    video.src = 'static/videos/' + url + '.mp4';
    video.muted = true;
    video.setAttribute('playsinline', true);
    video.setAttribute('preload', 'metadata');
    
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    
    const approxSize = 50 * 1024 * 1024;
    videoCache[url] = video;
    videoOrder.push(url);
    videoCacheSize += approxSize;
    
    cleanupVideoCache();
    
    video.addEventListener('error', (e) => {
        delete videoCache[url];
        const index = videoOrder.indexOf(url);
        if (index > -1) {
            videoOrder.splice(index, 1);
            videoCacheSize -= approxSize;
        }
    });
    
    return video;
}

function preloadVideos() {
    $('.video.view').each(function() {
        const url = $(this).data('url');
        if (url && !videoCache[url]) {
            createOrGetVideo(url);
        }
    });
}

function cleanupVideoCache() {
    while (videoCacheSize > MAX_CACHE_SIZE && videoOrder.length > 0) {
        const oldestUrl = videoOrder.shift();
        const video = videoCache[oldestUrl];
        if (video) {
            video.remove();
            delete videoCache[oldestUrl];
            videoCacheSize -= 50 * 1024 * 1024;
        }
    }
}

function stopAllVideos() {
    Object.values(videoCache).forEach(video => {
        if (video && !video.paused) {
            video.pause();
            video.currentTime = 0;
        }
    });
    
    const mainVideo = document.getElementById('main-video');
    if (mainVideo && !mainVideo.paused) {
        mainVideo.pause();
        mainVideo.currentTime = 0;
    }
    
    isPlaying = false;
}

setVideoIndices();
createRandomPadding();
preloadVideos();

$(window).on('resize', function() {
    if (videoCacheSize > MAX_CACHE_SIZE / 2) {
        cleanupVideoCache();
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        stopAllVideos();
    }
});




function updateVideoInfo(creditsSimple) {
    const $videoInfo = $('.video-info');
    
    $videoInfo.find('.video:not(.clear)').remove();
    
    let creditsArray = [];
    if (creditsSimple && creditsSimple.trim()) {
        const creditStrings = creditsSimple.split('||');
        creditsArray = creditStrings.map(creditStr => {
            const [role, name] = creditStr.split('|');
            return { role, name };
        });
    }
    
    if (creditsArray && creditsArray.length > 0) {
        const $thirdClear = $videoInfo.find('.video.clear').eq(2);
        
        creditsArray.forEach((credit, index) => {
            const randomPadding = getRandomPadding(30, 80);
            const $newVideo = $(`
                <div class="video">
                    <span class="num">${credit.role}:</span>
                    <span style="padding-right: ${randomPadding}">${credit.name}</span>
                </div>
            `);
            
            $thirdClear.after($newVideo);
        });
    }
}

function handleVideoHover($element) {
    const url = $element.data('url');
    const credits = $element.data('credits');
    const creditsSimple = $element.data('credits-simple');
    const mainVideo = document.getElementById('main-video');
    
    if ($activeVideo && $activeVideo.data('url') === url) {
        return;
    }
    
    if ($activeVideo) {
        $activeVideo.removeClass('active');
    }
    
    $element.addClass('active');
    $activeVideo = $element;
    
    if (credits) {
        $('.video-text').html(formatMultilineText(credits));
    }
    updateVideoInfo(creditsSimple);
    
    if ($element.hasClass('view')) {
        if (mainVideo.src && mainVideo.src.includes(url)) {
            return;
        }
        stopAllVideos();

        isPlaying = true;

        $(mainVideo).addClass('hidden');

        const video = createOrGetVideo(url);

        setTimeout(() => {
            if (!isPlaying) return;

            if (mainVideo.src !== video.src) {
                mainVideo.src = video.src;
            }
            mainVideo.muted = isMuted;
            mainVideo.volume = isMuted ? 0 : 0.5;
            mainVideo.currentTime = 0;

            $(mainVideo).removeClass('hidden');

            const playPromise = mainVideo.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.then(() => {
                    isPlaying = false;
                }).catch(e => {
                    if (e.name !== 'AbortError') {
                        console.error('Ошибка воспроизведения:', e);
                    }
                    mainVideo.muted = true;
                    mainVideo.volume = 0;
                    mainVideo.play().finally(() => {
                        isPlaying = false;
                    });
                });
            } else {
                isPlaying = false;
            }
        }, 150);
    }
}

function bindHoverHandlers() {
    $('.video:not(.clear)').hover(function() {
        handleVideoHover($(this));
    });
}

bindHoverHandlers();
handleVideoHover($('.video:not(.clear)').first());

function handleVideoEnded() {
    if (state === 'view-video' || state === 'all-videos') {
        const $videoEnded = $('.video-ended');
        $videoEnded.addClass('active');
        
        const $elems = $videoEnded.find('.video');
        $elems.css({
            transform: 'translateX(0)',
            opacity: 1
        });
        
        setTimeout(() => {
            animateRow($videoEnded, 'outLeft');
        }, 100);
    }
}

const mainVideo = document.getElementById('main-video');
if (mainVideo) {
    mainVideo.addEventListener('ended', handleVideoEnded);
}
$('#watch-again').on('click', function() {
    $('.video-ended').removeClass('active');
    if (mainVideo) {
        mainVideo.currentTime = 0;
        mainVideo.play();
    }
});

$('#view-credits').on('click', function() {
    $('.video-ended').removeClass('active');
    setState('view-info');
});



$('#volume').on('click', function () {
    isMuted = !isMuted;
    const video = document.getElementById('main-video');
    if (video) {
        video.muted = isMuted;
        video.volume = isMuted ? 0 : 0.5;
    }
    const iconOff = '<img src="static/icons/volume-off.svg" draggable="false" alt="VOLUME OFF">';
    const iconOn = '<img src="static/icons/volume-on.svg" draggable="false" alt="VOLUME ON">';
    $(this).html(isMuted ? iconOff : iconOn);
});


function getRandomizedOrder(length) {
    const indices = Array.from({length}, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        if (Math.random() < 0.5) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
    }
    return indices;
}

function animateRow($container, direction = 'in') {
    const $elems = $container.find('.video, .clear');
    
    if ($elems.length === 0) return;
    
    const order = getRandomizedOrder($elems.length);
    
    const totalDuration = 2000;
    const maxDelay = totalDuration / $elems.length;
    const delayBetweenElements = Math.min(maxDelay, 150);

    const transformValue = {
        in: 'translateX(0)',
        inLeft: 'translateX(0)',
        inRight: 'translateX(0)',
        outLeft: 'translateX(-100vw)',
        outRight: 'translateX(100vw)'
    }[direction];

    const opacityValue = direction.startsWith('in') ? 1 : 0;

    const isAlreadyInTargetState = direction.startsWith('in') ? 
        $elems.first().css('opacity') === '1' && $elems.first().css('transform') === 'translateX(0px)' :
        $elems.first().css('opacity') === '0' || 
        $elems.first().css('transform') === 'translateX(-100vw)' || 
        $elems.first().css('transform') === 'translateX(100vw)';

    if (isAlreadyInTargetState) {
        return;
    }

    let initialTransform;
    if (direction === 'inLeft') {
        initialTransform = 'translateX(-100vw)';
    } else if (direction === 'inRight') {
        initialTransform = 'translateX(100vw)';
    } else if (direction === 'in') {
        initialTransform = 'translateX(-100vw)';
    } else {
        initialTransform = 'translateX(0)';
    }

    $elems.css({
        transform: initialTransform,
        opacity: direction.startsWith('in') ? 0 : 1
    });

    $elems.each(function(i) {
        setTimeout(() => {
            if ($(this).length > 0) {
                $(this).css({
                    transform: transformValue,
                    opacity: opacityValue
                });
            }
        }, order[i] * delayBetweenElements);
    });
}