class FluidScroll {
    constructor() {
        this.currentScrollY = 0;
        this.pageHeight = window.innerHeight;
        this.activeRow = null;
        this.videos = [];
        this.isAnimating = false;
        this.pendingTimeouts = [];
        
        this.bindEvents();
        this.findActiveRow();
        this.initializeVideoStates();
    }

    bindEvents() {
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        this.observeActiveChanges();
    }

    findActiveRow() {
        const activeRow = document.querySelector('.video-row.active');
        if (activeRow !== this.activeRow) {
            this.resetScroll();
            this.activeRow = activeRow;
            this.updateVideos();
        }
    }

    observeActiveChanges() {
        const observer = new MutationObserver(() => {
            this.findActiveRow();
        });
        
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
    }

    updateVideos() {
        if (!this.activeRow) return;
        this.videos = Array.from(this.activeRow.querySelectorAll('.video'));
    }

    resetScroll() {
        this.currentScrollY = 0;
        this.updateTransform();
        this.updateVideoStates();
    }

    handleWheel(e) {
        if (!this.activeRow || this.isAnimating) return;
        
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 1 : -1;
        const newScrollY = this.currentScrollY + (delta * this.pageHeight);
        
        let targetScrollY = Math.max(0, newScrollY);
        
        if (delta > 0) {
            const wouldHaveVisibleVideos = this.videos.some((video, index) => {
                const videoTop = index * 48 - targetScrollY;
                const videoBottom = videoTop + 48;
                return videoBottom > 0 && videoTop < this.pageHeight;
            });
            
            if (!wouldHaveVisibleVideos) {
                return;
            }
        }
        
        if (targetScrollY === this.currentScrollY) return;
        
        this.animateToPosition(targetScrollY);
    }

    animateToPosition(targetY) {
        this.isAnimating = true;
        this.currentScrollY = targetY;
        
        this.activeRow.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.42, 0.94)';
        this.updateTransform();
        
        setTimeout(() => {
            this.isAnimating = false;
            this.updateVideoStates();
        }, 200);
    }

    updateTransform() {
        if (!this.activeRow) return;
        this.activeRow.style.transform = `translateY(-${this.currentScrollY}px)`;
    }

    updateVideoStates() {
        if (!this.videos.length) return;
        
        const viewportTop = this.currentScrollY;
        const viewportBottom = this.currentScrollY + this.pageHeight;
        
        const toActivate = [];
        const toDeactivate = [];
        
        this.videos.forEach((video, index) => {
            const videoTop = index * 48;
            const videoBottom = videoTop + 48;
            
            const isInViewport = videoBottom > viewportTop && videoTop < viewportBottom;
            const isCurrentlyInactive = video.classList.contains('inactive');
            
            if (isInViewport && isCurrentlyInactive) {
                toActivate.push(video);
            } else if (!isInViewport && !isCurrentlyInactive) {
                toDeactivate.push(video);
            }
        });
        
        this.animateVideoStates(toActivate, toDeactivate);
    }

    animateVideoStates(toActivate, toDeactivate) {
        this.clearPendingTimeouts();
        
        const getRandomDelay = (maxDelay) => {
            return Math.random() * maxDelay;
        };
        
        toDeactivate.forEach((video) => {
            const timeoutId = setTimeout(() => {
                video.classList.add('inactive');
            }, getRandomDelay(200));
            this.pendingTimeouts.push(timeoutId);
        });
        
        toActivate.forEach((video) => {
            const timeoutId = setTimeout(() => {
                video.classList.remove('inactive');
            }, getRandomDelay(150));
            this.pendingTimeouts.push(timeoutId);
        });
    }

    clearPendingTimeouts() {
        this.pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.pendingTimeouts = [];
    }

    initializeVideoStates() {
        if (!this.videos.length) return;
        
        this.videos.forEach((video) => {
            video.classList.add('inactive');
        });
        
        this.updateVideoStates();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FluidScroll();
});
