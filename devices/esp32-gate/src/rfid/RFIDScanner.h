#ifndef RFID_SCANNER_H
#define RFID_SCANNER_H

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include "../_core/gate_type.h"

class RFIDScanner
{
public:
    RFIDScanner(GateType type, uint8_t ssPin = 5, uint8_t rstPin = 21);
    void begin();
    void loop();
    void setCallback(void (*cb)(GateType, const String &, bool));
    String getLastCardId() const { return _lastCardId; };
    unsigned long getLastReadTime() const { return _lastReadMs; };
    GateType getGateType() const { return _gateType; };

private:
    GateType _gateType;
    uint8_t _ssPin;
    uint8_t _rstPin;
    MFRC522 _mfrc522;
    void (*_callback)(GateType, const String &, bool);
    unsigned long _lastReadMs;
    String _lastCardId;
};

#endif // RFID_SCANNER_H
