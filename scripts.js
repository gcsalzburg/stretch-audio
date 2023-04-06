'use strict';

const ctx = new AudioContext();
const o = ctx.createOscillator();
o.frequency.value = 261.63;

// When page loads
document.addEventListener("DOMContentLoaded", () => {

	// Click buton to connect
	document.querySelector(".connect").addEventListener("click", async (e) => {
		e.preventDefault();
		await serial.connect();
	});	
	
	// Click button to start sinewave
	document.querySelector('.start').addEventListener('click', (e) => {
		e.preventDefault();
		o.start(0);
		o.connect(ctx.destination);
	});
});

// Create Serial connection
const serial = new Serial({

	// When a new serial value arrives, set the sinewave frequency based on that value
	read_callback: (msg) => {
		o.frequency.value = 250 + 15*parseInt(msg);
	}
});
