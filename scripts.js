'use strict'

// When page loads
document.addEventListener("DOMContentLoaded", () => {

	if(!('serial' in navigator)){
		alert("Web Serial API is not supported on this device")
	}

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

	let ctx, oscillator, gain

	circle.addEventListener("click", async (e) => {
		e.preventDefault()

		ctx = new AudioContext()
		oscillator = ctx.createOscillator()
		gain = ctx.createGain()
		gain.gain.value = 0
	
		// Connect audio generators
		oscillator.connect(gain)
		gain.connect(ctx.destination)

		const connected = await serialConnect()
		if(connected){
			circle.classList.add('is-connected')
			oscillator.start(0)
		}
	})


	// Don't start scrolling until the first data point comes in
	let is_drawing_line = false

	let port, outputDone, outputStream, reader

	const serialConnect = async () => {
		try{
			// Request port and open it
			port = await navigator.serial.requestPort()
			await port.open({ baudRate: 115200 })
		
			// Stream reader for incoming data
			reader = port.readable
				.pipeThrough(new TextDecoderStream())
				.pipeThrough(new TransformStream(new LineBreakTransformer('\r\n')))
				.getReader()
			startReadLoop()
		
			const encoder = new TextEncoderStream()
			outputDone = encoder.readable.pipeTo(port.writable)
			outputStream = encoder.writable

		}catch(e){
			console.log(e)
			return false
		}

		return true
	}

		// Read loop for incoming data
	const startReadLoop = async () => {
		try{
			while (true){
				const { value, done } = await reader.read()
				if(value){
					if(value.trim().length > 0){
						// Check if message actually has some content
						useSerialValue(value)
					}
				}
				if(done){
					reader.releaseLock()
					break
				}
			}
		}catch(e){
			// Stream failed, probably because connection closed (got unplugged?)
			console.log(e)
			return false
		}finally {
			reader.releaseLock()
		}
	}

	let minimum_write_interval = 100
	let last_write

	// Write function to send lines to stream
	const serialWrite = (line) => {
		if(outputDone){
			// Add small delay buffer to space out message writing
			if(Date.now() > last_write+minimum_write_interval){
				const writer = outputStream.getWriter()

				writer.write(line + '\r\n')
				writer.releaseLock()

				last_write = Date.now()
			}else{
				return new Promise(resolve => 
					setTimeout(() => resolve(serialWrite(line)), minimum_write_interval)
				)
			}
		}
	}




	const useSerialValue = (msg) => {
		// Convert to int
		let level = parseInt(msg)

		// Only start drawing if we had a value so far (budget way to flush the Serial buffer)
		if(level > 0){
			is_drawing_line = true
		}else if(!is_drawing_line){
			return
		}

		// Set oscillator sound output
		gain.gain.value = Math.min(10, (level*10/100))
		oscillator.frequency.value = 250 + 20*level

		console.log(gain.gain.value, oscillator.frequency.value)


		// Set circle styling
		circle.style.transform = `scale(${1+(level*8/100)})`
		circle.style.background = `hsla(${1 + (level*65/100)}, 84%, ${65 - (level*20/100)}%, 1)`


		let new_x = last_x+speed

		if(new_x >= (canvas_w-right_margin)){
			// Shift canvas contents if we reached the end
			const imageData = canvas_ctx.getImageData(speed, 0, canvas_w-speed, canvas_h)
			canvas_ctx.putImageData(imageData, 0, 0)
			canvas_ctx.clearRect(canvas_w-speed, 0, speed, canvas_h) // Clear right-most pixels

			// Save new values
			new_x = canvas_w-right_margin
			last_x = canvas_w-right_margin-speed
		}

		let new_y = (canvas_h/2)-((canvas_h/2)*(level/100))+offset_y

		// Draw line
		canvas_ctx.beginPath()
		canvas_ctx.moveTo(last_x, last_y)
		if(level > 0){
			canvas_ctx.lineTo(new_x, new_y)
		}else{
			// If value=0, don't draw a flatline, just skip it
			canvas_ctx.moveTo(new_x, new_y)
		}
		canvas_ctx.stroke()

		last_x = new_x
		last_y = new_y
	}

})



// Quick helper class to transform incoming content by splitting based on line breaks
class LineBreakTransformer {

	_split_chars = '\r\n'

	constructor(split_chars) {
	  this.container = ''

	  if(split_chars !== undefined){
		  this._split_chars = split_chars
	  }
	}
 
	transform(chunk, controller) {
	  this.container += chunk
	  const lines = this.container.split(this._split_chars)
	  this.container = lines.pop()
	  lines.forEach(line => controller.enqueue(line))
	}
 
	flush(controller) {
	  controller.enqueue(this.container)
	}
}