'use strict';

// When page loads
document.addEventListener("DOMContentLoaded", () => {

	// Setup canvas
	const canvas = document.querySelector('.bg_canvas')
	const canvas_ctx = canvas.getContext("2d", { willReadFrequently: true })
	const canvas_w = window.innerWidth
	const canvas_h = window.innerHeight
	canvas_ctx.canvas.width  = window.innerWidth
	canvas_ctx.canvas.height = window.innerHeight

	// Set line style for drawing
	canvas_ctx.lineWidth = 3
	canvas_ctx.lineJoin = "round"
	canvas_ctx.lineCap = "round"
	canvas_ctx.strokeStyle = `#8bdbce`

	// Drawing constants
	let last_x = 0
	let last_y = canvas_h/2
	let speed = 5
	let right_margin = 30
	let offset_y = 150

	// Circle click handler
	const circle = document.querySelector('.circle')

	circle.addEventListener("click", async (e) => {
		e.preventDefault()
		const connected = await serial.connect()
		if(connected){
			circle.classList.add('is-connected')
			oscillator.start(0)
		}
	})
		
	// Setup audio context handling
	const ctx = new AudioContext()
	const oscillator = ctx.createOscillator()
	const gain = ctx.createGain()
	gain.gain.value = 0

	// Connect audio generators
	oscillator.connect(gain)
	gain.connect(ctx.destination)

	// Don't start scrolling until the first data point comes in
	let is_drawing_line = false

	// Create Serial connection
	const serial = new Serial({

		// When a new serial value arrives, set everything
		// Level = 0..100 expected value
		read_callback: (msg) => {

			// Convert to int
			let level = parseInt(msg)

			// Only start drawing if we had a value so far (budget way to flush the Serial buffer)
			if(level > 0){
				is_drawing_line = true
			}else if(!is_drawing_line){
				return
			}

			// Set oscillator sound output
			gain.gain.value = Math.min(1, (level*10/100))
			oscillator.frequency.value = 250 + 20*level

			// Set circle styling
			circle.style.transform = `scale(${1+(level*8/100)})`
			circle.style.background = `hsla(${1 + (level*65/100)}, 84%, ${65 - (level*20/100)}%, 1)`


			let new_x = last_x+speed

			if(new_x >= (canvas_w-right_margin)){
				// Shift canvas contents if we reached the end
				const imageData = canvas_ctx.getImageData(speed, 0, canvas_w-speed, canvas_h);
				canvas_ctx.putImageData(imageData, 0, 0);
				canvas_ctx.clearRect(canvas_w-speed, 0, speed, canvas_h); // Clear right-most pixels

				// Save new values
				new_x = canvas_w-right_margin
				last_x = canvas_w-right_margin-speed
			}

			let new_y = (canvas_h/2)-((canvas_h/2)*(level/100))+offset_y

			// Draw line
			canvas_ctx.beginPath();
			canvas_ctx.moveTo(last_x, last_y);
			if(level > 0){
				canvas_ctx.lineTo(new_x, new_y);
			}else{
				// If value=0, don't draw a flatline, just skip it
				canvas_ctx.moveTo(new_x, new_y);
			}
			canvas_ctx.stroke(); 

			last_x = new_x
			last_y = new_y

		}
	});

});


