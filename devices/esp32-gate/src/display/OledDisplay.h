#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "../_core/gate_type.h"

class OledDisplay
{
public:
    OledDisplay(GateType type, TwoWire *wireBus = &Wire, uint8_t address = 0x3C, uint8_t width = 128, uint8_t height = 64);

    bool begin();
    void loop(); // to handle auto-clearing

    // Commands to show on the screen
    void showIdle();
    void showError();
    void showGreeting(const String &cardId);
    void showMessage(const String &msg, uint8_t textSize = 1, bool clearScreen = true);

private:
    void drawHeader(const String &title);
    void centerText(const String &text, int16_t y, uint8_t textSize);

    GateType _gateType;
    TwoWire *_wireBus;
    uint8_t _address;
    Adafruit_SSD1306 _display;
    unsigned long _displayClearMs;
};

#endif // OLED_DISPLAY_H
