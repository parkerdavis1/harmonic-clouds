const displayEl = document.querySelector('.display-chord');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop');

const notesInput = document.querySelector('#notes');
const notesCheckbox = document.querySelector('#notesRandom');
const limitInput = document.querySelector('#limit');
const limitCheckbox = document.querySelector('#limitRandom');
const waveTypeInput = document.querySelector('#wave');
const waveTypeCheckbox = document.querySelector('#waveRandom');
const filterFreqInput = document.querySelector('#filter');
const filterFreqCheckbox = document.querySelector('#filterRandom');
const filterQInput = document.querySelector('#filterQ');
const filterQCheckbox = document.querySelector('#filterQRandom');
const filterShapeInput = document.querySelector('#filterShape');
const filterShapeCheckbox = document.querySelector('#filterShapeRandom');

playButton.addEventListener('click', () => {
    playing = true;
    playButton.innerHTML = 'playing';
    playButton.disabled = true;
    setupAudioProcessor();
});

stopButton.addEventListener('click', () => {
    playing = false;
    playButton.innerHTML = 'start';
    playButton.disabled = false;
    timeoutIds.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    timeoutIds = [];
});

function chooseRandomEntry(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// random checkboxes
function checkboxActivate(input, checkbox) {
    input.disabled = checkbox.checked;
    checkbox.addEventListener('change', () => {
        input.disabled = checkbox.checked;
    });
}
checkboxActivate(waveTypeInput, waveTypeCheckbox);
checkboxActivate(notesInput, notesCheckbox);
checkboxActivate(limitInput, limitCheckbox);
checkboxActivate(filterFreqInput, filterFreqCheckbox);
checkboxActivate(filterShapeInput, filterShapeCheckbox);
checkboxActivate(filterQInput, filterQCheckbox);

let context;
let playing;
let playedChords = [];
let timeoutIds = [];

// master controls
const sweepLength = 28;
const attackTime = 10;
const releaseTime = 10;
let baseFreq = 32;

// random options
const timesBetweenChords = [14000, 15000, 16000];
const sweepLengths = [10, 15, 20, 25, 30, 35, 40];
const waveTypes = ['sine', 'triangle', 'square', 'sawtooth'];
const filterShapeTypes = ['up', 'upDown', 'flat'];
const filterQs = [1, 2, 3, 4, 5];
const filterFreqs = [500, 1000, 2000, 3000, 4000];
const maxLimit = 31;
const numsOfNotes = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

function setupAudioProcessor() {
    if (!context) {
        context = new AudioContext();
    }

    const masterGain = new GainNode(context);
    masterGain.gain.value = 0.2;
    const compressor = new DynamicsCompressorNode(context);
    masterGain.connect(compressor).connect(context.destination);

    playChords();

    // Functions
    function playSweep(freq, delay, waveType) {
        // ----- OSCILLATOR -----
        const osc = new OscillatorNode(context, {
            frequency: freq,
            type: waveType,
        });

        const time = context.currentTime + delay;

        // ----- AMP ENVELOPE -----
        const sweepEnv = new GainNode(context);
        sweepEnv.gain.cancelScheduledValues(time);
        sweepEnv.gain.setValueAtTime(0, time);
        sweepEnv.gain.linearRampToValueAtTime(1, time + attackTime);
        sweepEnv.gain.linearRampToValueAtTime(
            0,
            time + sweepLength - releaseTime
        );

        // ----- FILTER -----
        if (filterQCheckbox.checked) {
            filterQInput.value = chooseRandomEntry(filterQs);
        }
        if (filterFreqCheckbox.checked) {
            filterFreqInput.value = chooseRandomEntry(filterFreqs);
        }
        if (filterShapeCheckbox.checked) {
            filterShapeInput.value = chooseRandomEntry(filterShapeTypes);
        }

        const filter = new BiquadFilterNode(context, {
            frequency: filterFreqInput.value,
            Q: filterQInput.value,
            type: 'lowpass',
        });

        switch (filterShapeInput.value) {
            case 'flat':
                break;
            case 'down':
                filter.frequency.setValueAtTime(filterFreqInput.value, time);
                filter.frequency.linearRampToValueAtTime(0, time + sweepLength);
                break;
            case 'up':
                filter.frequency.setValueAtTime(
                    // filterFreqInput.value / 4,
                    0,
                    time
                );
                filter.frequency.linearRampToValueAtTime(
                    filterFreqInput.value,
                    time + sweepLength - releaseTime
                );
                break;
            case 'upDown':
                filter.frequency.setValueAtTime(
                    // filterFreqInput.value / 4,
                    0,
                    time
                );
                filter.frequency.linearRampToValueAtTime(
                    filterFreqInput.value,
                    time + attackTime
                );
                filter.frequency.linearRampToValueAtTime(
                    // filterFreqInput.value / 4,
                    0,
                    time + sweepLength - releaseTime
                );
        }

        // ---- PANNER -----
        const panner = new StereoPannerNode(context, {
            pan: Math.random() * 2 - 1,
        });

        // ----- PATCH CABLES ------
        osc.connect(sweepEnv)
            .connect(panner)
            .connect(filter)
            .connect(masterGain);
        osc.start(time);
        osc.stop(time + sweepLength);
    }

    function playChord(chord) {
        displayChord(chord);
        if (waveTypeCheckbox.checked) {
            waveTypeInput.value = chooseRandomEntry(waveTypes);
        }

        for (let i = 0; i < chord.length; i++) {
            const noteDelay = 1;
            playSweep(baseFreq * chord[i], noteDelay * i, waveTypeInput.value);
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
        if (notesCheckbox.checked) {
            notes = chooseRandomEntry(numsOfNotes);
            notesInput.value = notes;
        }
        let limit = parseInt(limitInput.value);
        if (limitCheckbox.checked) {
            limit = Math.ceil(Math.random() * maxLimit);
            limitInput.value = limit;
        }
        if (playing) {
            playChord(createChord(notes, limit));
            const timeoutId = setTimeout(() => {
                playChords();
            }, chooseRandomEntry(timesBetweenChords));
            timeoutIds.push(timeoutId);
        }
    }

    function createChord(numOfNotes, limit) {
        return new Array(numOfNotes)
            .fill(1)
            .map((x) => Math.ceil(Math.random() * limit));
    }
}
