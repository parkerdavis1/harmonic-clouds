const displayEl = document.querySelector('.display-chord');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop');
playButton.addEventListener('click', () => {
        displayEl.innerHTML = null;
        clearInterval(intervalId)
        playButton.innerHTML = 'playing';
        setupAudioProcessor();
})

let intervalId
stopButton.addEventListener('click', () => {
    clearInterval(intervalId);
    playButton.innerHTML = 'start'
})

const notesInput = document.querySelector('#notes');
const limitInput = document.querySelector('#limit');
const waveTypeInput = document.querySelector('#wave');
const filterFreqInput = document.querySelector('#filter');

// master controls
let filterFreq = filterFreqInput.value;
const sweepLength = 30;
const attackTime = 10;
const releaseTime = 10;
let baseFreq = 30;
const timeBetweenChords = 15000;
let context;

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
            type: 'lowpass',
        });

        const panner = new StereoPannerNode(context, {
            pan: Math.random() * 2 - 1,
        });

        osc.connect(sweepEnv)
            .connect(panner)
            .connect(filter)
            .connect(masterGain);
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
        const liEl = document.createElement('li');
        liEl.innerHTML = chord.join(', ');
        displayEl.appendChild(liEl);
    }

    function playChords() {
            let notes = parseInt(notesInput.value)
            let limit = parseInt(limitInput.value)
            playChord(createChord(notes, limit))
    }

    const masterGain = new GainNode(context);
    masterGain.gain.value = 0.2;

    masterGain
        .connect(context.destination);

    function createChord(numOfNotes, limit) {
        return new Array(numOfNotes)
            .fill(1)
            .map(x => Math.floor(Math.random() * limit) + 1);
    }

    // first chord
    playChords();
    
    //subsequent chords
    intervalId = setInterval(() => {
        playChords();
    }, timeBetweenChords)
}
