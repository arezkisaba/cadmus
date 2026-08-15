let voicesCache: SpeechSynthesisVoice[] = [];
let pendingTimer: number | null = null;
let retryTimer: number | null = null;

function refreshVoices(): void {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
        return;
    }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        voicesCache = voices;
    }
}

if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function clearTimers(): void {
    if (pendingTimer !== null) {
        window.clearTimeout(pendingTimer);
        pendingTimer = null;
    }
    if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
    }
}

export function speak(text: string, lang: string): void {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
        return;
    }

    const synthesis = window.speechSynthesis;
    refreshVoices();
    clearTimers();
    synthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    const speakNow = (): void => {
        const voice = findVoice(lang);
        if (voice !== null) {
            utterance.voice = voice;
        }
        if (synthesis.paused) {
            synthesis.resume();
        }
        synthesis.speak(utterance);
        if (synthesis.paused) {
            synthesis.resume();
        }
    };

    if (voicesCache.length === 0) {
        const onVoices = (): void => {
            synthesis.removeEventListener('voiceschanged', onVoices);
            if (retryTimer !== null) {
                window.clearTimeout(retryTimer);
                retryTimer = null;
            }
            speakNow();
        };
        synthesis.addEventListener('voiceschanged', onVoices);
        retryTimer = window.setTimeout(() => {
            synthesis.removeEventListener('voiceschanged', onVoices);
            retryTimer = null;
            speakNow();
        }, 1200);
        return;
    }

    pendingTimer = window.setTimeout(() => {
        pendingTimer = null;
        speakNow();
    }, 50);
}

function findVoice(lang: string): SpeechSynthesisVoice | null {
    const code = lang.toLowerCase();
    return (
        voicesCache.find((voice) => voice.lang.toLowerCase() === code) ??
        voicesCache.find((voice) => voice.lang.toLowerCase().startsWith(`${code}-`)) ??
        null
    );
}
