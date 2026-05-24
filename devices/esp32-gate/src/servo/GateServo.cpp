#include "GateServo.h"

GateServo::GateServo(GateType type, uint8_t pin)
    : _gateType(type), _pin(pin), _isOpen(false), _openMs(0)
{
}

void GateServo::begin()
{
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    
    _servo.setPeriodHertz(50);
    _servo.attach(_pin, 500, 2400);
    
    close();
}

void GateServo::loop()
{
    if (_isOpen && (millis() - _openMs > AUTO_CLOSE_DELAY_MS))
    {
        close();
    }
}

void GateServo::open()
{
    String gateName = (_gateType == GateType::ENTRY) ? "ENTRY" : "EXIT";
    Serial.println("[" + gateName + "] Opening servo gate...");
    
    _servo.write(90); // Open 90 degrees
    _isOpen = true;
    _openMs = millis();
}

void GateServo::close()
{
    if (_isOpen) {
        String gateName = (_gateType == GateType::ENTRY) ? "ENTRY" : "EXIT";
        Serial.println("[" + gateName + "] Closing servo gate...");
    }
    
    _servo.write(0); // Close back to 0 degrees
    _isOpen = false;
}
