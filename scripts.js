'use strict';

// When page loads
document.addEventListener("DOMContentLoaded", () => {

	const circle = document.querySelector('.circle')

	// Click buton to connect
	circle.addEventListener("click", async (e) => {
		e.preventDefault()
		const connected = await serial.connect()
		if(connected){
			circle.classList.add('is-connected')
			oscillator.start(0)
		}
	})
		
	const ctx = new AudioContext()
	const oscillator = ctx.createOscillator()
	const gain = ctx.createGain()

	oscillator.connect(gain)
	gain.connect(ctx.destination)

	// Create Serial connection
	const serial = new Serial({

		// When a new serial value arrives, set everything
		// Level = 0..100 expected value
		read_callback: (msg) => {
			let level = parseInt(msg)
			gain.gain.value = Math.min(1, (level*10/100))
			oscillator.frequency.value = 250 + 20*level
			circle.style.transform = `scale(${1+(level*8/100)})`
		}
	});

});


