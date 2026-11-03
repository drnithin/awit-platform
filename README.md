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
- `templates/` holds the Excel templates the Data hub offers: program figures, HSP schools, past HSP sessions, and donor project figures.
- `funders/hcltech/` is the HCLTech preview donor page (passcode hcltech-2026); `funders/govandi/` is the Godrej page.

Real figures

- Program MIS, Data hub, "Real figures for the MIS": download the template, fill one row per program, state, partner and year (Arogya City as a running total, the WhatsApp challenge by edition, social media month by month in its own sheet), and upload it. "Edit every figure" changes or deletes any row, target or outcome. The MIS switches from sample to real figures as soon as there are any.
- On any MIS page, "Edit this page" hides a chart or key number (and brings it back), and adds key numbers or text boxes. Charts from any Excel sheet are added to a page from "Turn any Excel sheet into an infographic".
- "Donor pages": choose Govandi or HCLTech, upload a filled donor template or type the figures, then publish.
- "Schools: add from Excel" and "HSP sessions held before SchoolTrack" load the real HSP school list and past sessions into SchoolTrack on that computer.

Going live with the online store (so every device sees the same figures)

1. Sign in at supabase.com and create a new project. Choose the Mumbai region.
2. In the project, open SQL Editor, choose New query, paste the whole of admin/supabase-setup.sql and press Run.
3. Under Authentication, Sign In / Providers, turn off "Allow new users to sign up". Under Authentication, Users, choose Add user for each team member who will enter figures, and tick "Auto confirm".
4. Under Project Settings, API, copy the Project URL and the anon (or publishable) key. On GitHub, edit access.js and paste them into window.AWIT_DB = { url: "...", key: "..." }. Commit.
5. Open the Program MIS, Data hub, sign in under "Online store", and upload or re-save your figures. Every device now reads them.

Without step 4 everything still works: figures are kept in that browser, and you publish them by downloading mis.json or the donor .json file and uploading it to the data folder.

The online store holds program totals and donor indicators only. School lists, sessions and photos stay in the field tools on each device until those move to the store too.
- `sw.js` keeps the two field apps working without network once they have been opened on a phone with a signal. `icons/` and each field folder's `manifest.webmanifest` let coordinators add the app to the home screen.
