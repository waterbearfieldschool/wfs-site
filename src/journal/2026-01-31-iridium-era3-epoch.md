---
title: "Debugging the Iridium ERA3 Epoch Transition"
date: 2026-01-31
layout: layouts/post.njk
tags: journal
image: /assets/images/grassnomads/iridium-era3-debug.jpg
excerpt: "A satellite modem time sync was corrupting our RTC with dates from 2015. The culprit: Iridium's ERA3 epoch transition on January 14, 2026."
foundations:
  - water
---

![Debugging the satellite time sync at the bayou](/assets/images/grassnomads/iridium-era3-debug.jpg)

Our [Sweet-P water level monitor](/projects/sweet-p/) uses a RockBLOCK satellite modem to transmit data at scheduled times (5 AM, 1 PM, and 6 PM EST). After each successful transmission, it syncs its real-time clock (RTC) with the Iridium satellite network. Recently, we noticed the device was sending data 4 hours late—at 9 AM, 5 PM, and 10 PM instead.

## The Symptoms

The initial symptom seemed like a simple timezone bug. The device was consistently 4 hours off from its scheduled transmission times. But when we added debug output to trace the time synchronization, we discovered something far stranger:

```
DEBUG: RTC BEFORE sync: 2026-01-30 23:26:55
DEBUG: Raw satellite struct_time: struct_time(tm_year=2015, ...)
DEBUG: Satellite time (should be UTC): 00:37:36
DEBUG: RTC AFTER sync: 2015-04-26 19:37:36
```

The satellite was returning **April 2015**—eleven years in the past! The RTC had the correct time *before* the sync, but the satellite time was overwriting it with garbage.

## Following the Data

The RockBLOCK modem uses the AT-MSSTM command to retrieve time from the Iridium network. This returns a 32-bit hex value representing "ticks" (90-millisecond intervals) since a reference epoch. The Adafruit RockBlock library converts this to a human-readable time.

We added debug output to see the raw values:

```
DEBUG ROCKBLOCK: Raw hex from modem: '140d6135'
DEBUG ROCKBLOCK: Ticks since Iridium epoch: 336421173
DEBUG ROCKBLOCK: Seconds since epoch: 30277905
```

The library was calculating from the **ERA2 epoch** (May 11, 2014, 14:23:55 UTC). With that epoch, 336 million ticks equals about 350 days—landing in April 2015.

But 336 million ticks seemed low. For January 2026, we'd expect around 4.1 billion ticks from the 2014 epoch. Something didn't add up.

## The Root Cause: ERA3

Searching the [RockBLOCK documentation](https://docs.groundcontrol.com/iot/rockblock/user-manual/iridium-time), we found the answer:

> **ERA3 begins January 14, 2026**

The Iridium network uses 32-bit counters for system time. These counters would overflow after about 12.3 years, so Iridium periodically transitions to a new "era" with a reset counter and new epoch. On January 14, 2026, the network transitioned from ERA2 to ERA3.

The critical detail from the [Iridium epoch change documentation](https://www.beamcommunications.com/support/product-support-news/169-iridium-epoch-change):

> After the change to ERA3, the zero base value equates to **February 14, 2025, 18:14:17 UTC**

The Adafruit library was still using the ERA2 epoch (May 11, 2014). When we recalculated with the ERA3 epoch:

```python
# ERA3 epoch: February 14, 2025, 18:14:17 UTC
# Ticks: 336,421,173
# Seconds: 30,277,906
# Result: February 14, 2025 + 350 days = January 31, 2026 04:46 UTC
```

The modem was returning the correct time all along—we just needed the right epoch to interpret it.

## The Fix

The fix was straightforward. In the `adafruit_rockblock.py` library, we changed the epoch from ERA2 to ERA3:

```python
# OLD (ERA2 - no longer valid after Jan 14, 2026):
# result_time = _add_seconds_to_datetime(2014, 5, 11, 14, 23, 55, secs_since_epoch)

# NEW (ERA3 - active since Jan 14, 2026):
result_time = _add_seconds_to_datetime(2025, 2, 14, 18, 14, 17, secs_since_epoch)
```

We also replaced the library's use of `time.mktime()` and `time.localtime()` with direct calendar arithmetic. CircuitPython's time functions have inconsistent epoch handling across different boards, so calculating dates manually is more reliable.

## Lessons Learned

1. **Check for epoch transitions**: Satellite and GPS systems periodically reset their time counters. The GPS "Week Number Rollover" in 2019 caused similar issues. Always verify your time conversion code against current epoch documentation.

2. **Debug with raw values**: Printing the raw hex response from the modem immediately revealed that the tick count was plausible—just misinterpreted.

3. **Protect against bad syncs**: While debugging, we added a sanity check to skip syncs if the satellite year differed from the RTC year by more than one. This prevented the RTC from being corrupted while we investigated.

4. **CircuitPython time quirks**: The `time.mktime()` function behaves differently on CircuitPython (year 2000 epoch) vs standard Python (year 1970 epoch). Doing calendar math manually avoids these platform inconsistencies.

## References

- [Ground Control: Iridium Time Documentation](https://docs.groundcontrol.com/iot/rockblock/user-manual/iridium-time)
- [Beam Communications: Iridium Epoch Change](https://www.beamcommunications.com/support/product-support-news/169-iridium-epoch-change)
- [Apollo Satellite: Iridium Time Re-Epoch 2026 Guide](https://blog.apollosatellite.com/iridium-time-re-epoch-2026-firmware-update/)
- [RockBLOCK: AT-MSSTM Command Reference](https://docs.rockblock.rock7.com/reference/-msstm)

The updated library code is in the [Sweet-P firmware repository](https://github.com/edgecollective/sweet-p) under `firmware/sync_debug/lib/adafruit_rockblock.py`.
