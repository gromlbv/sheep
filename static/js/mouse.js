$(document).ready(function () {
    const cursor = $('.custom-cursor');
    const helperCursor = $('.custom-cursor-helper');

    let isSticked = false;
    let stickedElement = null;

    let mouseX = 0, mouseY = 0;
    let scrollX = 0, scrollY = 0;
    
    function resetCursor() {
        isSticked = false;
        stickedElement = null;
        
        cursor.removeClass('morphing').css({
            width: '20px',
            height: '20px',
            borderRadius: '0',
            background: 'rgba(255, 255, 255, 0.8)',
            transform: 'translate(-50%, -50%)',
            clipPath: 'none'
        });
        
        helperCursor.addClass('hidden');
    }
    
    $(window).scroll(function() {
        scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        scrollY = window.pageYOffset || document.documentElement.scrollTop;
    });
    
    $(document).mousemove(function (e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    function animateCursor() {
        if (!isSticked) {
            cursor.css({
                left: mouseX,
                top: mouseY
            });
        } else if (stickedElement) {
            const rect = stickedElement.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(stickedElement);
            const borderRadius = computedStyle.borderRadius;
            const transform = computedStyle.transform;
            const clipPath = computedStyle.clipPath;
            
            const opacity = parseFloat(computedStyle.opacity);
            const pointerEvents = computedStyle.pointerEvents;
            
            if (opacity === 0 || pointerEvents === 'none' || !document.body.contains(stickedElement)) {
                resetCursor();
                cursor.css({
                    left: mouseX,
                    top: mouseY
                });
            } else {
                const centerX = rect.left + rect.width / 2 + scrollX;
                const centerY = rect.top + rect.height / 2 + scrollY;
                
                cursor.css({
                    left: centerX,
                    top: centerY,
                    width: rect.width,
                    height: rect.height,
                    borderRadius: borderRadius,
                    transform: `translate(-50%, -50%) ${transform !== 'none' ? transform : ''}`,
                    clipPath: clipPath !== 'none' ? clipPath : 'none'
                });
            }
        }
        
        helperCursor.css({
            left: mouseX,
            top: mouseY
        });
        
        if (isSticked && stickedElement && !document.body.contains(stickedElement)) {
            resetCursor();
        }
        requestAnimationFrame(animateCursor);
    }
    animateCursor();


    $('.cursor-hover').on('mouseenter', function () {
        const element = $(this);
        const rect = this.getBoundingClientRect();
        const customColor = element.data('color');
        helperCursor.removeClass('hidden');

        isSticked = true;
        stickedElement = this;

        const computedStyle = window.getComputedStyle(this);
        const borderRadius = computedStyle.borderRadius;
        const background = customColor || computedStyle.backgroundColor;
        const transform = computedStyle.transform;
        const clipPath = computedStyle.clipPath;

        const centerX = rect.left + rect.width / 2 + scrollX;
        const centerY = rect.top + rect.height / 2 + scrollY;

        cursor.addClass('morphing').css({
            left: centerX,
            top: centerY,
            width: rect.width,
            height: rect.height,
            borderRadius: borderRadius,
            transform: `translate(-50%, -50%) ${transform !== 'none' ? transform : ''}`,
            clipPath: clipPath !== 'none' ? clipPath : 'none'
        });
    });

    $('.cursor-hover').on('mouseleave', function (e) {
        const rect = this.getBoundingClientRect();
        const mouseX = e.pageX;
        const mouseY = e.pageY;
        helperCursor.addClass('hidden');

        const buffer = 10;
        const isOutside = mouseX < (rect.left + scrollX) - buffer ||
            mouseX > (rect.right + scrollX) + buffer ||
            mouseY < (rect.top + scrollY) - buffer ||
            mouseY > (rect.bottom + scrollY) + buffer;

        if (isOutside) {
            resetCursor();
            cursor.css({
                left: e.pageX,
                top: e.pageY
            });
        }
    });

    $(document).mousemove(function (e) {
        if (isSticked && stickedElement) {
            const rect = stickedElement.getBoundingClientRect();
            const mouseX = e.pageX;
            const mouseY = e.pageY;

            const buffer = 20;
            const isOutside = mouseX < (rect.left + scrollX) - buffer ||
                mouseX > (rect.right + scrollX) + buffer ||
                mouseY < (rect.top + scrollY) - buffer ||
                mouseY > (rect.bottom + scrollY) + buffer;

            if (isOutside) {
                resetCursor();
            }
        }
    });

    $(document).mouseleave(function () {
        cursor.css('opacity', '0');
        resetCursor();
    });

    $(document).mouseenter(function () {
        cursor.css('opacity', '1');
    });
    
    $(document).keydown(function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement && (focusedElement.classList.contains('extend') || focusedElement.classList.contains('video'))) {
                e.preventDefault();
                focusedElement.click();
            }
        }
    });

    
    $('.extend, .video').on('focus', function() {
        const element = $(this);
        if (element.hasClass('cursor-hover')) {
            element.trigger('mouseenter');
        }
    });
    
    $('.extend, .video').on('blur', function() {
        const element = $(this);
        if (element.hasClass('cursor-hover')) {
            element.trigger('mouseleave');
        }
    });
});