let distractionTimeout = null;
let isDistractionHidden = false;

function setRightArrowAction(state){
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') {
            setState(state);
        }
    });
}
function setLeftArrowAction(state){
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            setState(state);
        }
    });
}

function startDistractionHideTimer() {
    clearTimeout(distractionTimeout);
    showDistractions();
    distractionTimeout = setTimeout(() => {
        hideDistractions();
    }, 3000);
}

function hideDistractions() {
    if (!isDistractionHidden) {
        $('.blur-out').addClass('blurred');
        isDistractionHidden = true;
    }
}

function showDistractions() {
    if (isDistractionHidden) {
        $('.blur-out').removeClass('blurred');
        isDistractionHidden = false;
    }
}

['mousemove', 'mousedown', 'keydown', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        if (state === 'landing-active' || state === 'view-video') {
            startDistractionHideTimer();
        } else {
            showDistractions();
            clearTimeout(distractionTimeout);
        }
    });
});

function setState(newState) {
    state = newState;

    const all_videos = $('.all-videos');
    const video_info = $('.video-info');
    const video_ended = $('.video-ended');
    const contacts_row = $('.contacts-row');

    const extend = $('.extend');
    const to_all_videos = $('#to-all-videos');
    const play = $('#play');
    const back = $('#back');
    const info = $('#info');
    const video_text = $('.video-text');
    const hide_info = $('#hide-info');
    const hide_videos = $('#hide-videos');

    const logo = $('#logo');
    
    all_videos.removeClass('active');
    video_info.removeClass('active');
    video_ended.removeClass('active');

    video_text.addClass('hidden');
    extend.addClass('hidden');
    
    switch (state) {
        case 'loading':
            revealScreen();

            setTimeout(() => {
                setState('landing-active');
            }, 700);

            break;


        case 'landing-active':
            to_all_videos.removeClass('hidden');
            logo.addClass('page-loaded');
            startDistractionHideTimer()

            animateRow(all_videos, 'outRight');
            animateRow(video_ended, 'outLeft');
            handleVideoHover($('.video.view').first());

            setRightArrowAction('all-videos');

            break;

        case 'all-videos':
            play.removeClass('hidden');
            video_text.removeClass('hidden');
            hide_videos.removeClass('hidden');
            all_videos.addClass('active');

            animateRow(all_videos, 'inRight');
            animateRow(video_info, 'outLeft');

            setLeftArrowAction('view-video');

            break;

        case 'view-video':
            back.removeClass('hidden');
            info.removeClass('hidden');

            startDistractionHideTimer()

            animateRow(all_videos, 'outRight');
            animateRow(video_info, 'outLeft');

            setLeftArrowAction('view-info');
            setRightArrowAction('all-videos');

            break;

        case 'view-info':
            back.removeClass('hidden');
            hide_info.removeClass('hidden');

            video_info.addClass('active');
            all_videos.removeClass('active');

            animateRow(all_videos, 'outRight');  
            animateRow(video_info, 'inLeft');

            setRightArrowAction('all-videos');
            
            break;

        case 'view-contacts':
            contacts_row.addClass('active');
            animateRow(contacts_row, 'inLeft');

            break;
            
        default:
            break;
    }
}

$('.video.view, #play, #hide-info, #hide-videos').on('click', () =>
setState('view-video'));

$('#back, #to-all-videos').on('click', () =>
setState('all-videos'));

$('#info').on('click', () =>
setState('view-info'));