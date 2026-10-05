# AWIT Program Platform (prototype)

Static prototype of the Arogya World India Trust program tools.

| Page | Path | What it is |
| --- | --- | --- |
| Program MIS | `/` | Central dashboard: organisation overview plus Healthy Schools, Arogya Schools, Street Food Vendors and Arogya City |
| Arogya SchoolTrack | `/schooltrack/` | Field app and monitoring dashboard for HSP sessions and Arogya Schools accreditation |
| Arogya StallTrack | `/stalltrack/` | Vendor registration, stall visits and integrity queue for street food vendor training |

Arogya City runs from its own repository and is linked from the MIS.

Notes

- The MIS shows sample data. It is not yet connected to the tools.
- SchoolTrack and StallTrack keep their data in the browser of the device they are opened on.
- No build step: every page is a single HTML file.
