# LogiDiary — Transport Trip Diary (MVP)

## Overview
Single-user React Native (Expo) mobile app for transport companies to maintain their trip diary (past & future), plus a fleet directory of vehicles and drivers. **All data is stored on-device using AsyncStorage** — no backend, no login.

## Tech Stack
- Expo Router (file-based navigation, bottom tabs + modal stack)
- React Native + TypeScript
- AsyncStorage (on-device mobile database)
- expo-image-picker (base64 photos & documents)
- @react-native-community/datetimepicker (date fields)
- @expo/vector-icons (Ionicons)

## Navigation
Bottom tabs (Dashboard / Trips / Fleet / Profile) with modal screens for entity forms:
- `/trip-form?id=&date=`
- `/vehicle-form?id=`
- `/driver-form?id=`

## Data Model (AsyncStorage keys)
| Key | Shape |
|---|---|
| `@logidiary/trips` | `Trip[]` — id, title, bookingDate, bookedOnDate, from/to location + contact, totalCost, driverId+driverName, vehicleId+vehicleNumber |
| `@logidiary/vehicles` | `Vehicle[]` — id, vehicleType, model, registrationNumber, photo (base64), registrationDoc (base64) |
| `@logidiary/drivers` | `Driver[]` — id, name, contactNumber, licenseDoc (base64), profilePic (base64) |
| `@logidiary/profile` | `Profile` — name, mobile, email, company |

## Screens
1. **Dashboard** — 2 KPI cards (Total Trips, Revenue last 30d in ₹), horizontal date strip (-30 → +30 days) with `Today` jump, and vertical list of trips for the selected day.
2. **Trips** — Filter chips (All / Upcoming / Past), FlatList with route timeline + driver/vehicle pills + INR cost. FAB opens trip form.
3. **Fleet** — Segmented tabs (Vehicles | Drivers). Cards with photo/avatar, reg#/name, and type/contact. FAB adds new item.
4. **Profile** — Editable name, mobile, email, company; auto-generated initials avatar.

## Design
Navy (`#1E3A8A`) + Sky (`#3B82F6`) palette, Plus Jakarta Sans, 8pt spacing, radius tokens (sm/md/lg/pill), toast system for feedback (no `Alert`).

## Notes
- Photos & docs stored inline as base64 data URIs (no cloud storage).
- All lists use pull-to-refresh where relevant; forms use `KeyboardAvoidingView` + `SafeAreaView`.
- Every interactive element has a stable `testID`.
