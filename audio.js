const displayEl = document.querySelector('.display-chord');
const playButton = document.querySelector('#play-button');
playButton.addEventListener('click', () => {
    playButton.innerHTML = 'playing';
    playButton.disabled = true;
    displayEl.innerHTML = null;
    notesInput.disabled = true;
    chordsInput.disabled = true;
    limitInput.disabled = true;
    setupAudioProcessor();
    setTimeout(() => {
        playButton.disabled = false;
        playButton.innerHTML = 'play';
        notesInput.disabled = false;
        chordsInput.disabled = false;
        limitInput.disabled = false;
    }, chordsInput.valueAsNumber * 10 * 1000)
});

const notesInput = document.querySelector('#notes');
const chordsInput = document.querySelector('#chords');
const limitInput = document.querySelector('#limit');
const waveTypeInput = document.querySelector('#wave')
const filterFreqInput = document.querySelector('#filter')

// master controls
let filterFreq = filterFreqInput.value;
const sweepLength = 30;
const attackTime = 10;
const releaseTime = 10;
let baseFreq = 30;

function setupAudioProcessor() {
    const context = new AudioContext();
    function playTone(freq, delay = 0, wave = 'sine') {
        const osc = new OscillatorNode(context, {
            frequency: freq,
            type: wave,
        });
        osc.connect(context.destination);
        let time = context.currentTime + delay;
        osc.start(time);
        osc.stop(time + 1);
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
            frequency: filterFreq,
            type: 'lowpass',
        });

        const panner = new StereoPannerNode(context, {
            pan: (Math.random() * 2) - 1
        })

        osc.connect(sweepEnv).connect(panner).connect(filter).connect(masterGain);
        osc.start(time);
        osc.stop(time + sweepLength);
    }

    function playChord(chord, delay = 0) {
        // console.log(chord)
        displayChord(chord)
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

    function playChords(array) {
        for (let i = 0; i < array.length; i++) {
            // console.log('playchords', array[i]);
            setTimeout(() => {
                playChord(array[i], i);
            }, 15000 * i);
        }
    }

    const masterGain = new GainNode(context);
    masterGain.gain.value = 0.2;

    const filter = new BiquadFilterNode(context, {
        frequency: filterFreq,
        type: 'lowpass',
    });
    masterGain
        // .connect(filter)
        .connect(context.destination);

    function createChords(numOfNotes, numOfChords, limit = 13) {
        let array = [];
        for (let i = 0; i < numOfChords; i++) {
            let chord = new Array(numOfNotes)
                .fill(1)
                .map((x) => Math.floor(Math.random() * limit) + 1);
            array.push(chord);
        }
        return array;
    }

    const randomChords = createChords(
        notesInput.valueAsNumber,
        chordsInput.valueAsNumber,
        limitInput.valueAsNumber
    );
    playChords(randomChords);
}
