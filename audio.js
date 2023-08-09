const displayEl = document.querySelector('.display-chord');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop');

const notesInput = document.querySelector('#notes');
const limitInput = document.querySelector('#limit');
const waveTypeInput = document.querySelector('#wave');
const filterFreqInput = document.querySelector('#filter');
const filterQInput = document.querySelector('#filterQ')

playButton.addEventListener('click', () => {
    displayEl.innerHTML = null;
    clearInterval(intervalId);
    playButton.innerHTML = 'playing';
    setupAudioProcessor();
});

let intervalId;
stopButton.addEventListener('click', () => {
    clearInterval(intervalId);
    playButton.innerHTML = 'start';
});

// master controls
const sweepLength = 28;
const attackTime = 10;
const releaseTime = 10;
let baseFreq = 30;
const timeBetweenChords = 15000;
let context;
let playedChords = [];

function setupAudioProcessor() {
    if (!context) {
        context = new AudioContext();
    }

    function playSweep(freq, delay) {
        const osc = new OscillatorNode(context, {
            frequency: freq,
            type: waveTypeInput.value,
        });

        const time = context.currentTime + delay;
        const sweepEnv = new GainNode(context);
        sweepEnv.gain.cancelScheduledValues(time);
        sweepEnv.gain.setValueAtTime(0, time);
        sweepEnv.gain.linearRampToValueAtTime(1, time + attackTime);
        sweepEnv.gain.linearRampToValueAtTime(
            0,
            time + sweepLength - releaseTime
        );

        const filter = new BiquadFilterNode(context, {
            frequency: filterFreqInput.value,
            Q: filterQInput.value,
            type: 'lowpass',
        });
        filter.frequency.cancelScheduledValues(time);
        filter.frequency.setValueAtTime(filterFreqInput.value / 2, time);
        filter.frequency.linearRampToValueAtTime(filterFreqInput.value, time + attackTime);
        filter.frequency.linearRampToValueAtTime(
            filterFreqInput.value / 2,
            time + sweepLength - releaseTime
        );

        const panner = new StereoPannerNode(context, {
            pan: Math.random() * 2 - 1,
        });

        const compressor = new DynamicsCompressorNode(context)

        osc.connect(sweepEnv)
            .connect(panner)
            .connect(filter)
            .connect(masterGain)
            .connect(compressor);
        osc.start(time);
        osc.stop(time + sweepLength);
    }

    function playChord(chord) {
        displayChord(chord);
        for (let i = 0; i < chord.length; i++) {
            const noteDelay = 1;
            playSweep(baseFreq * chord[i], noteDelay * i);
        }
    }

    function displayChord(chord) {
        playedChords = [chord, ...playedChords];
        displayEl.innerHTML = '';
        playedChords.map((c) => {
            const liEl = document.createElement('li');
            liEl.innerHTML = c.join(', ');
            displayEl.appendChild(liEl);
        });
    }

    function playChords() {
        let notes = parseInt(notesInput.value);
        let limit = parseInt(limitInput.value);
        playChord(createChord(notes, limit));
    }

    const masterGain = new GainNode(context);
    masterGain.gain.value = 0.2;

    masterGain.connect(context.destination);

    function createChord(numOfNotes, limit) {
        return new Array(numOfNotes)
            .fill(1)
            .map((x) => Math.floor(Math.random() * limit) + 1);
    }

    // first chord
    playChords();

    //subsequent chords
    intervalId = setInterval(() => {
        playChords();
    }, timeBetweenChords);
}
