class AudioManager {
    constructor() {
        this.messageSound = new Audio();
        this.messageSound.volume = 1;
        this.isUnlocked = false;
        this.playTimeout = null;
    }

    unlock() {
        if (this.isUnlocked) return;
        this.messageSound.src = '/sounds/faaah.mp3';
        this.messageSound.play().then(() => {
            this.messageSound.pause();
            this.messageSound.currentTime = 0;
            this.isUnlocked = true;
        }).catch(err => {
            // console.warn('Аудіо ще заблоковано:', err);
        });
    }

    playMessageSound(customUrl = null) {
        if (customUrl === 'none') return;

        if (customUrl && typeof customUrl !== 'string') {
            // console.warn("audioManager отримав не рядок, а:", customUrl);
            return;
        }

        let urlToPlay = customUrl ? customUrl : '/sounds/faaah.mp3';

        if (!urlToPlay.startsWith('http') && !urlToPlay.startsWith('/') && !urlToPlay.startsWith('blob:')) {
            urlToPlay = `/sounds/${urlToPlay}`;
        }

        if (!this.messageSound.src.endsWith(urlToPlay)) {
            this.messageSound.src = urlToPlay;
        }

        this.messageSound.pause();
        this.messageSound.currentTime = 0;

        this.messageSound.play().then(() => {
            if (this.playTimeout) clearTimeout(this.playTimeout);
            this.playTimeout = setTimeout(() => {
                this.messageSound.pause();
                this.messageSound.currentTime = 0;
            }, 5000); // 5000 мілісекунд = 5 секунд
        }).catch(e => {//console.warn('Автоплей аудіо заблоковано:', e)
        });
    }
}

export const audioManager = new AudioManager();