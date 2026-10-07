# AWIT Program Platform (prototype)

| Page | Path | Who it is for | How it opens |
| --- | --- | --- | --- |
| Program MIS and Data hub | `/` | Arogya World managers and heads | Team passcode |
| SchoolTrack dashboard | `/schooltrack/dashboard/` | Arogya World, CINI and MAMTA managers | Organisation passcode |
| Vendor training dashboard | `/sfvt/dashboard/` | Arogya World and NASVI managers | Organisation passcode |
| SchoolTrack field app | `/schooltrack/field/` | Healthy Schools coordinators | Name and PIN |
| Vendor training field app | `/sfvt/field/` | NASVI and Arogya World coordinators | Name and PIN |
| Nourishing Govandi progress | `/funders/govandi/` | The funding team | Funder passcode |
| Change a passcode | `/admin/passcodes.html` | Whoever maintains the site | Open |

Other files

- `access.js` holds the passcode fingerprints for the team, each partner and each funder.
- `data/govandi.json` is what the funder dashboard shows. Replace it with the file downloaded from the Data hub to publish new figures.
- `lib/awit.js` holds the shared charts and helpers. `lib/xlsx.mini.min.js` reads Excel files.

Notes

- Passcodes and PINs are a screen lock for a prototype, not real security. Do not enter real personal or health data until logins and a shared database are added.
- Every tool keeps its data in the browser of the device it is opened on. Two devices do not share data yet.
