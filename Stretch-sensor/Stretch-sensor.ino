// Create variables for pins
const int stretch_pin = A5;

// Set max and min levels for stretch detection
const int min_level = 420;
const int max_level = 580;

void setup() {
  Serial.begin(115200);
}

void loop() {

  // Read in stretch sensor value
  int stretch_reading = analogRead(stretch_pin);

  // Constrain reading so that it doesn't exceed bounds
  stretch_reading = constrain(stretch_reading, min_level, max_level);

  // Map the stretch sensor to the servo motor range (10 -> 170)
  int scaled = map(stretch_reading, min_level, max_level, 0, 100);

  Serial.println(scaled);
  delay(20);
}
