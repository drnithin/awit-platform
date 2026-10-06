# AWIT Program Platform (prototype)

| Page | Path | Who it is for |
| --- | --- | --- |
| Program MIS and Data hub | `/` | Managers and heads (team passcode) |
| SchoolTrack dashboard | `/schooltrack/dashboard/` | Managers and heads (team passcode) |
| Vendor training dashboard | `/sfvt/dashboard/` | Managers and heads (team passcode) |
| SchoolTrack field app | `/schooltrack/field/` | Field coordinators (no passcode) |
| Vendor training field app | `/sfvt/field/` | Field coordinators (no passcode) |
| Nourishing Govandi progress | `/funders/govandi/` | The funding team (funder passcode) |
| Change a passcode | `/admin/passcodes.html` | Whoever maintains the site |

Other files

- `access.js` holds the passcode fingerprints. See `/admin/passcodes.html` to change one.
- `data/govandi.json` is what the funder dashboard shows. Replace it with the file downloaded from the Data hub to publish new figures.
- `lib/` holds the Excel reader and shared chart code.

Notes

- The passcode screens are a lock for a prototype, not real security. Do not enter real personal or health data until logins and a shared database are added.
- The tools keep their data in the browser of the device they are opened on. Two devices do not share data yet.
