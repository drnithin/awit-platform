# AWIT Program Platform (prototype)

Static prototype of the Arogya World India Trust program tools.

| Page | Path | What it is |
| --- | --- | --- |
| Program MIS | `/` | Central dashboard: organisation overview plus Healthy Schools, Arogya Schools, Street Food Vendor Training and Arogya City |
| Arogya SchoolTrack | `/schooltrack/` | Field app and monitoring dashboard for HSP sessions and Arogya Schools accreditation |
| Street Food Vendor Training | `/sfvt/` | Vendor registration with QR code, training day desks (attendance, screening, certificate and apron), stall visits, dashboard |

Arogya City runs from its own repository and is linked from the MIS.

Notes

- The MIS charts show sample data. Its "Live" panels read the real records that the two tools have saved in the same browser.
- SchoolTrack and the vendor training tool keep their data in the browser of the device they are opened on. Two phones do not share data yet.
- A vendor's QR pass opens at `/sfvt/?v=VENDOR-ID`.
- No build step: every page is a single HTML file.
