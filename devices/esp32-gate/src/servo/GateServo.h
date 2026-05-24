#ifndef GATE_SERVO_H
#define GATE_SERVO_H

#include <Arduino.h>
#include <ESP32Servo.h>
#include "../_core/gate_type.h"

class GateServo
{
public:
    GateServo(GateType type, uint8_t pin);

    void begin();
    void loop();

    void open();
    void close();
    bool isOpen() const { return _isOpen; }

private:
    GateType _gateType;
    uint8_t _pin;
    Servo _servo;
    bool _isOpen;
    unsigned long _openMs;
    const unsigned long AUTO_CLOSE_DELAY_MS = 20000;
};

#endif // GATE_SERVO_H
