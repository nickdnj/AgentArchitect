# Apple Contacts Cleanup & Google Contacts Sync

**Date:** 2026-02-05
**Session type:** execution
**Agents involved:** Max (personal-assistant), direct CLI work

## Summary

Completed a major Apple Contacts reorganization: audited 860 contacts for duplicates, merged/deleted 36 contacts (bringing total to 824), fixed group memberships (Wharfside, Mentor), then synced the clean Apple contacts to Google Contacts by exporting as vCard and importing into a wiped Google account.

## Key Findings

- Started with 860 Apple contacts after prior session's Google import
- Found 5 exact duplicates, 16 ambiguous same-name duplicates, ~13 real cross-name duplicates among 67 flagged
- Most cross-name matches were Mentor colleagues sharing office phone numbers (not real dups)
- Wharfside group had 128 extra members without Wharfside addresses (cleaned)
- Mentor group was missing 46 contacts with mentor.com emails (added)
- Mary Brady was in Wharfside group but her address is MSKCC in NYC, not Wharfside Drive (correctly removed)
- Paul Pcard entries had credit card data in org field (deleted both)
- AppleScript `vcard of every person` concatenates vCards with `, ` (comma-space) between entries, which breaks Google's vCard parser - only first contact imports. Fixed by replacing `, BEGIN:VCARD` with `\nBEGIN:VCARD`.

## Decisions Made

- Merged duplicate contacts keeping the record with more data, transferring unique fields from losers to winners
- Renamed "Brousell" to "Gary Brousell" and "Conforti Ken" to "Ken Conforti"
- Strategy for Google/Apple sync: wipe Google Contacts, import Apple's clean vCard, then enable two-way sync via System Settings > Internet Accounts
- Nick uses Gmail web client primarily but carries iPhone, so needs both Google and Apple contacts current

## Research Sources

- Apple Contacts data exported via AppleScript to TSV format
- Group memberships exported via AppleScript
- Custom Python audit scripts for duplicate detection and operation planning

## Artifacts Created

- `/private/tmp/claude-503/.../scratchpad/audit_export.tsv` - All contacts export (post-fix)
- `/private/tmp/claude-503/.../scratchpad/audit_groups.tsv` - Group memberships
- `/private/tmp/claude-503/.../scratchpad/audit_contacts.py` - Comprehensive audit script
- `/private/tmp/claude-503/.../scratchpad/audit_results.json` - Audit results with IDs
- `/private/tmp/claude-503/.../scratchpad/build_all_operations.py` - Operations planner
- `/private/tmp/claude-503/.../scratchpad/all_operations.json` - Planned operations
- `/private/tmp/claude-503/.../scratchpad/execute_all_fixes.py` - Operations executor (AppleScript)
- `/private/tmp/claude-503/.../scratchpad/apple_contacts_clean.vcf` - Original vCard export (buggy)
- `/private/tmp/claude-503/.../scratchpad/apple_contacts_fixed.vcf` - Fixed vCard export (824 contacts)

## Open Items

- [ ] Google flagged "Joanne Serhat" as a duplicate via Merge & fix (3 suggestions total) - needs review
- [ ] Enable two-way sync: System Settings > Internet Accounts > Google (YOUR_PERSONAL_EMAIL) > toggle Contacts ON
- [ ] Google Trash still has ~867 deleted contacts (auto-purge in 30 days)
- [ ] Consider whether the "All Contacts" label in Google is redundant once sync is enabled (Google has its own "Contacts" view)

## Context for Next Session

Google Contacts now has all 824 clean contacts imported from Apple, with matching labels (All Contacts 824, Altium 31, Mentor 90, Wharfside 192). All stale labels have been deleted (card, Imported on 10/27, Imported on 2/5, Imported on 2/5 1, Wharfside Community Contacts, WharfsideBOT). The next step is to enable two-way sync in macOS System Settings so future changes in either Apple or Google propagate automatically. Google's "Merge & fix" has 3 suggestions (including a Joanne Serhat duplicate) that should be reviewed before enabling sync to avoid re-introducing duplicates.

## Technical Notes

### AppleScript vCard Export Bug
When using `vcard of every person` in AppleScript, the result is a list that gets coerced to text with `, ` delimiters. This produces invalid vCard syntax (`END:VCARD, BEGIN:VCARD`). Fix: post-process the file to replace `, BEGIN:VCARD` with `\nBEGIN:VCARD`.

### Audit Script Architecture
Three-tier duplicate detection:
1. **Exact**: Same normalized name + overlapping phone or email
2. **Ambiguous**: Same normalized name, no overlapping contact info
3. **Cross-name**: Different names but same phone or email (catches misspellings, nicknames)

Group verification checks:
- Wharfside: address contains "wharfside"
- Altium: email domain contains "altium.com"
- Mentor: email domain contains "mentor.com"
- All Contacts: every contact should be a member

### Operation Execution
All modifications done via AppleScript (`osascript -e`), batched in groups of 50 for deletes and group operations. Zero errors across all 6 steps.
