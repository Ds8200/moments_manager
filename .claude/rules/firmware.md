# LAYER INACTIVE
---
paths: ["firmware/**"]
---

> All rules in `shared.md` apply to this layer. The sections below are firmware-specific additions
> and overrides. In case of conflict, the rules below take precedence.

# Firmware — ESP32 + Arduino + PlatformIO

---

## Layer 1 — Core Behavior

- The `String` class is forbidden — it causes heap fragmentation on ESP32. Use `const char*` or `const char[]` for static literals, `char buf[N]` + `snprintf` for dynamic formatting, and `std::string` only when a dynamically sized string is unavoidable at runtime.
- `delay()` is forbidden anywhere. Every `loop()` method must use the `millis()`-based non-blocking timer pattern.
- Direct calls to `Serial.print`, `Serial.println`, and `Serial.printf` are forbidden — use only the log macros from `include/logger.h`.
- All GPIO pin numbers must be declared as `constexpr uint8_t` in `include/pins.h`.
- All magic numbers (timeouts, sizes, intervals) must be declared as named constants in `include/config.h`.
- Stack allocation is required in `loop()` — `new` and `malloc` in `loop()` are forbidden.

---

## Layer 2 — Architecture

### Stack

- ESP32 (any variant), Arduino Framework, C++17
- PlatformIO (VS Code extension or CLI)
- MQTT: PubSubClient library
- JSON: ArduinoJson v7 using `JsonDocument` — `StaticJsonDocument` and `DynamicJsonDocument` are forbidden (removed in v7)
- Linting: clang-format

### Project Structure

```
firmware/
├── platformio.ini
├── .clang-format
├── src/
│   ├── main.cpp             setup() and loop() only — thin orchestrator
│   └── {Module}/
│       ├── Module.h
│       └── Module.cpp
├── include/
│   ├── pins.h               all GPIO pin assignments
│   ├── topics.h             all MQTT topic strings
│   ├── config.h             compile-time constants (timeouts, sizes)
│   ├── logger.h             LOG_INFO/WARN/ERROR/DEBUG macros
│   └── secrets.h            WiFi/MQTT credentials — GITIGNORED
├── lib/                     vendored libs not in PlatformIO registry
├── test/                    PlatformIO native unit tests
└── include/secrets.h.example  committed placeholder
```

### secrets.h.example Required Fields

`firmware/include/secrets.h.example` must define the following macros using `#define`, each with a clearly labeled placeholder string value:

- `WIFI_SSID` — placeholder: `"your-wifi-ssid"`
- `WIFI_PASSWORD` — placeholder: `"your-wifi-password"`
- `MQTT_BROKER_HOST` — placeholder: `"192.168.1.100"`
- `MQTT_BROKER_PORT` — placeholder: `1883` (integer, not string)
- `MQTT_USER` — placeholder: `"your-mqtt-user"`
- `MQTT_PASSWORD` — placeholder: `"your-mqtt-password"`
- `SECRETS_OTA_PASSWORD` — placeholder: `"change-me"`, with an inline comment instructing to generate with `openssl rand -base64 24`

The file must open with `#pragma once`.

- `secrets.h` (the real file) must mirror this structure exactly — no extra fields in `secrets.h` without a matching entry in `secrets.h.example`.
- `SECRETS_OTA_PASSWORD` must never contain the placeholder value `"change-me"` at flash time — the bootstrap check must catch this.
- When MQTT over TLS is active, `MQTT_BROKER_PORT` must be `8883` and a `certs.h.example` placeholder file must be created alongside `secrets.h.example`.

### main.cpp — Clean Orchestrator Pattern

`main.cpp` must contain only `setup()` and `loop()`. Logic, state, timers, and `if/else` blocks must not appear in `main.cpp`. Every module exposes exactly two entry points: `begin()` and `loop()`.

**Class vs namespace decision:**

| Use `class` | Use `namespace` |
|-------------|-----------------|
| Module has persistent state (`_lastMs`, connection, buffer) | Module is stateless (Config helpers, Topics) |
| Multiple instances are possible | Singleton by nature |

`setup()` must:
1. Call `Serial.begin(115200)`
2. Call `begin()` on every module in dependency order (WiFi before MQTT, WiFi before OTA)
3. Log free heap: `LOG_INFO("Setup complete. Free heap: %u", ESP.getFreeHeap())`

`loop()` must:
- Call `loop()` on every module in the same order as `setup()`
- Contain no other code

### Non-Blocking Timer Pattern

Every `loop()` method must follow this pattern:
1. Capture `const unsigned long now = millis()`
2. Compare `now - _lastMs < INTERVAL_CONSTANT` and return early if the interval has not elapsed
3. Set `_lastMs = now` — set before performing work so that interval timing is measured from the start of the work cycle, not its completion. This prevents drift accumulation across iterations.
4. Perform the actual work

`_lastMs` must be declared as `private: unsigned long _lastMs = 0;` in the class header.

Interval constants must be defined in `include/config.h` as `constexpr uint32_t`.

`unsigned long` (not `int`) must be used for all `millis()` values to handle the 49-day rollover correctly.

### MQTT Architecture

- The `PubSubClient` object must be owned by the `MqttClient` class — global declaration in `main.cpp` is forbidden.
- All topic strings must be declared as `constexpr const char*` constants in `include/topics.h`. `#define` macros and `String` objects are forbidden for topic strings.
- Reconnect logic must live in `MqttClient::loop()` using the non-blocking timer pattern.
- Max payload size: `constexpr size_t MQTT_MAX_PAYLOAD = 512` in `include/config.h`.
- Callback functions must route by topic prefix. When a topic uses dynamic segments (e.g., `device/{id}/command`) that prevent prefix matching, exact string comparison must be used and a comment must document why prefix routing is not used.
- `setSocketTimeout(5)` and `setKeepAlive(30)` must be called in `begin()`.

### Memory Management

- Free heap must be logged at the end of `setup()` using `LOG_INFO("Free heap: %u", ESP.getFreeHeap())`.
- Free heap must also be logged after reconnection events.
- `HEAP_WARN_THRESHOLD_BYTES` and `HEAP_CRITICAL_THRESHOLD_BYTES` must be defined in `include/config.h` as `constexpr uint32_t` (default values: `8192` and `4096` respectively).
- When free heap falls below `HEAP_WARN_THRESHOLD_BYTES`, log a `WARN` message including the current free heap value.
- When free heap falls below `HEAP_CRITICAL_THRESHOLD_BYTES`, log an `ERROR` message and call `ESP.restart()`.
- `JsonDocument` (ArduinoJson v7) must be used for all JSON operations — no size argument is needed.

### Logger Implementation

`include/logger.h` must define four macros: `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, and `LOG_DEBUG`. Each macro accepts a printf-style format string and variadic arguments. The output format for each macro must be: severity tag in brackets (e.g. `[INFO]`), followed by the source filename and line number, followed by the formatted message, all on one line.

`LOG_DEBUG` must be compiled out in release builds: it must be wrapped in `#ifdef DEBUG` / `#else` / `#endif` guards, with an empty no-op replacement (`do {} while(0)`) in the non-debug branch. `LOG_INFO`, `LOG_WARN`, and `LOG_ERROR` must always be active regardless of build flags.

`Serial` calls are permitted in `logger.h` macros only. Direct `Serial` calls in all other source files are forbidden.

### PlatformIO Configuration

- The `.pio/` directory must not be edited — it is the build cache.
- All dependencies must be added to `platformio.ini` under `lib_deps`.
- Libraries must not be manually copied into `lib/` unless absent from the PlatformIO registry.
- Board-specific config (flash size, partition scheme) must go in `platformio.ini`.
- `[env:native]` is required for `pio test -e native`.
- `[env:debug]` enables `LOG_DEBUG` macro output — use only during development.
- `platformio.ini` must define at minimum: `[env:esp32dev]` with `platform`, `board`, `framework = arduino`, and `monitor_speed = 115200`; plus `[env:native]` for host-side tests.


---

## Layer 3 — Workflow

### WiFi Reconnection

All WiFi reconnection logic must live in `WiFiManager::loop()` using the non-blocking timer pattern. `main.cpp` must not reference `WiFi` directly.

Reconnection steps in `WiFiManager::loop()`:
1. Return early if `WiFi.status() == WL_CONNECTED`
2. Return early if `now - _lastRetryMs < WIFI_RETRY_INTERVAL_MS`
3. Set `_lastRetryMs = now`
4. Log warning and call `WiFi.reconnect()`

### OTA Updates

OTA is required for every project. `OtaManager` must be included in every firmware scaffold regardless of deployment context.

`ArduinoOTA` is built into the ESP32 Arduino framework — no extra `lib_deps` entry is needed.

`OtaManager` class interface:
- `begin()` — registers `onStart`, `onEnd`, `onError` callbacks, sets OTA password, calls `ArduinoOTA.begin()`
- `loop()` — calls `ArduinoOTA.handle()` (non-blocking when no update is in progress)
- Private field: `bool _initialized = false`

`OtaManager::begin()` must be called after `WiFiManager::begin()` — OTA requires an active WiFi connection.

The OTA password is required: set it with `ArduinoOTA.setPassword(SECRETS_OTA_PASSWORD)` before `ArduinoOTA.begin()`. `SECRETS_OTA_PASSWORD` must be defined in `include/secrets.h`. Hardcoding the password inline is forbidden.

### NVS — Persistent Configuration

Use `Preferences` (built into ESP32 Arduino framework) to store configuration that survives reboots.

Rules:
- Namespace string must be 15 characters or fewer — NVS partition key limit.
- `prefs.end()` must be called after write operations are complete to release the NVS handle.
- NVS data survives firmware updates but is wiped by `pio run -t erase`.

### MQTT over TLS (Production)

TLS is required for all broker connections. The only exempt environments are:
- `localhost` (loopback)
- RFC 1918 private network ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`

Development environments connecting to a local Mosquitto container are exempt. All other environments must use port 8883.

Requirements:
- Replace `WiFiClient` with `WiFiClientSecure` in `MqttClient`.
- CA cert must be stored as a `const char[]` in `include/certs.h` (gitignored) — add placeholder to `secrets.h.example`.
- Set CA cert with `_wifiClient.setCACert(broker_ca_cert)` in `begin()`.
- Port 8883 is required — port 1883 (plaintext) is acceptable only on isolated local networks.
- `setInsecure()` is forbidden in production — it disables certificate validation.

### Watchdog Timer

A watchdog timer is required in every project. Use the ESP-IDF 5.x API (arduino-esp32 >= 3.0):

Requirements:
- Use `esp_task_wdt_config_t` with `timeout_ms = WDT_TIMEOUT_MS`, `trigger_panic = true`.
- `WDT_TIMEOUT_MS` must be defined in `include/config.h` as `constexpr uint32_t`.
- Call `esp_task_wdt_reconfigure(&wdt_config)` in `setup()`.
- Disabling the watchdog is forbidden — a hanging module must cause a device reset.
- `esp_task_wdt_reset()` must be called once per `loop()` iteration in `main.cpp`, after calling every module's `loop()` method and before `main.cpp`'s `loop()` returns. Individual modules must not call `esp_task_wdt_reset()` directly.
- `WDT_TIMEOUT_MS` must be set to a value greater than the maximum expected total `loop()` execution time across all active modules. A module whose `loop()` can block longer than `WDT_TIMEOUT_MS` has a design defect and must be refactored.

---

## Layer 4 — Quality Control

### Logging

- `Serial.begin(115200)` must be called in `setup()` — a different baud rate requires a comment.
- Log macros defined in `include/logger.h`: `LOG_INFO`, `LOG_WARN`, `LOG_ERROR`, `LOG_DEBUG`.
- `LOG_DEBUG` is compiled out in release builds — `LOG_INFO/WARN/ERROR` are always active.
- The `DEBUG` flag must be defined only in `platformio.ini` under `[env:debug]` `build_flags`.
- Logging inside `loop()` on every iteration is forbidden — log only on state change or using a `millis()` throttle.

### Linting

- clang-format enforced on `*.cpp` and `*.h` files via lint-staged pre-commit.
- Manual reformatting is forbidden — clang-format is the sole authority on code style.

### Testing

Test structure:

```
firmware/test/
└── test_{Module}/
    └── test_{Module}.cpp    one test folder per src module
```

**What to test — pure logic only:**
- Parsers (JSON payload → struct)
- State machines (transition logic)
- Calculations (sensor data formulas, threshold checks)
- String/buffer utilities

**What must not be tested:** GPIO state, WiFi/MQTT connection, `Serial` output — test the logic around these interfaces, not the interfaces themselves.

Test file pattern: include `<unity.h>` and the module under test. Call `UNITY_BEGIN()`, then `RUN_TEST()` for each test function, then `UNITY_END()` in `main()`.

**Coverage:** Percentage enforcement does not apply to firmware. `pio test -e native` pass/fail is the acceptance criterion. The 80% coverage rule in `shared.md` applies to frontend and backend only.

**Test commands:**

| Command | When to use |
|---------|-------------|
| `pio test -e native` | After every change — runs on host machine |
| `pio test -v` | Verbose output when a test fails |

---

## Layer 5 — Failure and Decision

- A watchdog event must cause a device reset. Suppressing or disabling the watchdog to hide a hang is forbidden.
- `secrets.h` absent → the build fails. Do not provide fallback credentials inline as a workaround.
- Module state grows beyond a single responsibility → split into a new class. Expanding `main.cpp` to absorb the state is forbidden.
- A new module added → update `main.cpp` to call its `begin()` and `loop()` in the correct dependency order.
- `delay()` found in any module → replace with the `millis()` non-blocking timer pattern. No exceptions.
- When module requirements are ambiguous (unspecified pin assignment, undefined timing constant, unclear protocol behavior), stop and report — do not assume hardware behavior.
- When a firmware rule conflicts with a shared rule, apply the firmware rule for this layer and flag the conflict explicitly in the PR description before proceeding.
- When a specification gap is found (missing constant, unspecified module interaction, undefined failure mode), escalate — do not fill the gap with guesses.
