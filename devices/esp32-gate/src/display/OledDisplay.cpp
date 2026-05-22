#include "OledDisplay.h"

OledDisplay::OledDisplay(uint8_t sdaPin, uint8_t sclPin, uint8_t width, uint8_t height)
    : _sdaPin(sdaPin), _sclPin(sclPin), _display(width, height, &Wire, -1), _displayClearMs(0)
{
}

bool OledDisplay::begin()
{
    Wire.begin(_sdaPin, _sclPin);
    if (!_display.begin(SSD1306_SWITCHCAPVCC, 0x3C))
    {
        Serial.println(F("SSD1306 allocation failed"));
        return false;
    }
    showIdle();
    return true;
}

void OledDisplay::loop()
{
    if (_displayClearMs > 0 && millis() > _displayClearMs)
    {
        showIdle();
        _displayClearMs = 0;
    }
}

void OledDisplay::showMessage(const String &msg, uint8_t textSize, bool clearScreen)
{
    if (clearScreen)
    {
        _display.clearDisplay();
        _display.setCursor(0, 0);
    }
    _display.setTextSize(textSize);
    _display.setTextColor(SSD1306_WHITE);
    _display.println(msg);
    _display.display();
}

void OledDisplay::showIdle()
{
    showMessage("Waiting...", 2, true);
}

void OledDisplay::showError()
{
    showMessage("ERROR!", 2);
    _displayClearMs = millis() + 3000;
}

void OledDisplay::showGreeting(const String &cardId)
{
    _display.clearDisplay();
    _display.setCursor(0, 0);
    _display.setTextSize(2);
    _display.setTextColor(SSD1306_WHITE);
    _display.println("WELLCOME");

    _display.setTextSize(2);
    _display.println(cardId);

    _display.display();

    _displayClearMs = millis() + 3000;
}
