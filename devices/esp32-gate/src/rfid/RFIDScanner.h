#ifndef RFID_SCANNER_H
#define RFID_SCANNER_H

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>

class RFIDScanner
{
public:
    RFIDScanner(uint8_t ssPin = 5, uint8_t rstPin = 21);
    void begin();
    void loop();
    void setCallback(void (*cb)(const String &, bool));
    String getLastCardId() const { return _lastCardId; };
    unsigned long getLastReadTime() const { return _lastReadMs; };

private:
    uint8_t _ssPin;
    uint8_t _rstPin;
    MFRC522 _mfrc522;
    void (*_callback)(const String &, bool);
    unsigned long _lastReadMs;
    String _lastCardId;
};

#endif // RFID_SCANNER_H
