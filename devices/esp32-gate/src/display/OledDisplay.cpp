#include "OledDisplay.h"

OledDisplay::OledDisplay(GateType type, TwoWire *wireBus, uint8_t address,
                         uint8_t width, uint8_t height)
    : _gateType(type), _wireBus(wireBus), _address(address),
      _display(width, height, wireBus, -1), _displayClearMs(0) {}

bool OledDisplay::begin() {
  if (!_display.begin(_address, true)) {
    Serial.println(F("SH1106 allocation failed"));
    return false;
  }
  showIdle();
  return true;
}

void OledDisplay::loop() {
  if (_displayClearMs > 0 && millis() > _displayClearMs) {
    showIdle();
    _displayClearMs = 0;
  }
}

void OledDisplay::drawHeader(const String &title) {
  _display.fillRect(0, 0, 128, 16, SH110X_WHITE);
  _display.setTextSize(1);
  _display.setTextColor(SH110X_BLACK);

  int16_t x1, y1;
  uint16_t w, h;
  _display.getTextBounds(title, 0, 0, &x1, &y1, &w, &h);
  _display.setCursor((128 - w) / 2, 4);
  _display.print(title);

  _display.setTextColor(SH110X_WHITE);
}

void OledDisplay::centerText(const String &text, int16_t y, uint8_t textSize) {
  _display.setTextSize(textSize);
  int16_t x1, y1;
  uint16_t w, h;
  _display.getTextBounds(text, 0, 0, &x1, &y1, &w, &h);
  _display.setCursor((128 - w) / 2, y);
  _display.print(text);
}

void OledDisplay::showMessage(const String &msg, uint8_t textSize,
                              bool clearScreen) {
  if (clearScreen) {
    _display.clearDisplay();
    String gateName =
        (_gateType == GateType::ENTRY) ? "ENTRY GATE" : "EXIT GATE";
    drawHeader(gateName);
  }

  centerText(msg, 32, textSize);
  _display.display();
}

void OledDisplay::showIdle() {
  _display.clearDisplay();
  String gateName = (_gateType == GateType::ENTRY) ? "ENTRY GATE" : "EXIT GATE";
  drawHeader(gateName);

  centerText("Ready...", 26, 2);
  centerText("Please scan card", 48, 1);

  _display.display();
}

void OledDisplay::showError() {
  _display.clearDisplay();
  drawHeader("ACCESS DENIED");

  centerText("INVALID", 25, 2);
  centerText("CARD", 45, 2);

  _display.display();
  _displayClearMs = millis() + 3000;
}

void OledDisplay::showGreeting(const String &cardId) {
  String gateName = (_gateType == GateType::ENTRY) ? "ENTRY GATE" : "EXIT GATE";
  Serial.println("[" + gateName + "] OLED: showing greeting for " + cardId);

  _display.clearDisplay();
  drawHeader("OMNIPARK");

  centerText("WELCOME", 25, 2);
  centerText("ID: " + cardId, 48, 1);

  _display.display();

  _displayClearMs = millis() + 3000;
}