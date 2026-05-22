#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

class OledDisplay {
public:
    OledDisplay(uint8_t sdaPin, uint8_t sclPin, uint8_t width = 128, uint8_t height = 64);
    
    bool begin();
    void loop(); // to handle auto-clearing
    
    // Commands to show on the screen
    void showIdle();
    void showError();
    void showGreeting(const String& cardId);
    void showMessage(const String& msg, uint8_t textSize = 1, bool clearScreen = true);

private:
    uint8_t _sdaPin;
    uint8_t _sclPin;
    Adafruit_SSD1306 _display;
    unsigned long _displayClearMs;
};

#endif // OLED_DISPLAY_H
