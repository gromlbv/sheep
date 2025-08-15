// Loading Screen Animation
class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.pixels = [];
        this.isAnimating = false;
    }

    init() {
        this.loadingElement = document.querySelector('.loading');
        if (this.loadingElement) {
            this.pixels = Array.from(this.loadingElement.querySelectorAll('.pixel'));
        }
    }

    revealScreen() {
        if (this.isAnimating || !this.loadingElement) {
            return;
        }
        
        this.isAnimating = true;
        const totalPixels = this.pixels.length;
        const duration = 1000;
        
        // Создаем 3 случайные начальные точки
        const startPoints = this.getRandomStartPoints(3);
        
        // Вычисляем расстояние от каждого пикселя до ближайшей начальной точки
        const pixelDistances = this.pixels.map((pixel, index) => {
            const pixelRect = pixel.getBoundingClientRect();
            const pixelCenter = {
                x: pixelRect.left + pixelRect.width / 2,
                y: pixelRect.top + pixelRect.height / 2
            };
            
            // Находим минимальное расстояние до любой из начальных точек
            let minDistance = Infinity;
            startPoints.forEach(startPoint => {
                const distance = Math.sqrt(
                    Math.pow(pixelCenter.x - startPoint.x, 2) + 
                    Math.pow(pixelCenter.y - startPoint.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                }
            });
            
            return { pixel, distance: minDistance, index };
        });
        
        // Сортируем пиксели по расстоянию (ближайшие к начальным точкам сначала)
        pixelDistances.sort((a, b) => a.distance - b.distance);
        
        const interval = duration / totalPixels;
        let currentIndex = 0;
        
        const fadeInterval = setInterval(() => {
            if (currentIndex >= pixelDistances.length) {
                clearInterval(fadeInterval);
                this.hideLoadingScreen();
                return;
            }
            const pixelData = pixelDistances[currentIndex];
            pixelData.pixel.classList.add('fade-out');
            currentIndex++;
        }, interval);
    }

    hideLoadingScreen() {
        setTimeout(() => {
            if (this.loadingElement) {
                this.loadingElement.classList.add('hidden');
            }
            this.isAnimating = false;
        }, 500);
    }
    reset() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
        }
        this.pixels.forEach(pixel => {
            pixel.classList.remove('fade-out');
        });
        this.isAnimating = false;
    }

    getRandomStartPoints(count) {
        if (!this.loadingElement) return [];
        
        const rect = this.loadingElement.getBoundingClientRect();
        const points = [];
        
        for (let i = 0; i < count; i++) {
            points.push({
                x: rect.left + Math.random() * rect.width,
                y: rect.top + Math.random() * rect.height
            });
        }
        
        return points;
    }
}
let loadingScreen = null;

function revealScreen() {
    if (loadingScreen) {
        loadingScreen.revealScreen();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadingScreen = new LoadingScreen();
    loadingScreen.init();    
    if (typeof setState === 'function') {
        setState('loading');
    }
});
