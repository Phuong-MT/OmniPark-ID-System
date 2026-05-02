#include "RFIDScanner.h"

RFIDScanner::RFIDScanner(uint8_t ssPin, uint8_t rstPin) 
    : _ssPin(ssPin), _rstPin(rstPin), _mfrc522(ssPin, rstPin), _callback(nullptr), _lastReadMs(0) {
}

void RFIDScanner::begin() {
    // Explicitly set SPI pins for ESP32 (SCK=18, MISO=19, MOSI=23, SS=5)
    SPI.begin(18, 19, 23, _ssPin);
    delay(50); // Give it some time to stabilize
    _mfrc522.PCD_Init();
    delay(50); // Optional delay
    _mfrc522.PCD_DumpVersionToSerial();
    Serial.println(F("RFID Scanner initialized."));
}

void RFIDScanner::setCallback(void (*cb)(const String&)) {
    _callback = cb;
}

void RFIDScanner::loop() {
    // Look for new cards
    if (!_mfrc522.PICC_IsNewCardPresent()) {
        return;
    }

    // Select one of the cards
    if (!_mfrc522.PICC_ReadCardSerial()) {
        return;
    }

    String cardId = "";
    for (byte i = 0; i < _mfrc522.uid.size; i++) {
        cardId += String(_mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        cardId += String(_mfrc522.uid.uidByte[i], HEX);
    }
    cardId.toUpperCase();

    unsigned long now = millis();
    // Debounce: prevent reading the same card multiple times within 1 second
    if (cardId != _lastCardId || now - _lastReadMs > 1000) {
        Serial.print(F("Card read UID: "));
        Serial.println(cardId);
        
        if (_callback != nullptr) {
            _callback(cardId);
        }
        
        _lastCardId = cardId;
        _lastReadMs = now;
    }

    // Halt PICC
    _mfrc522.PICC_HaltA();
    // Stop encryption on PCD
    _mfrc522.PCD_StopCrypto1();
}
