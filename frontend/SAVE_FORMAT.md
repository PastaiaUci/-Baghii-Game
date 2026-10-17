# Save compatibility

Saves live locally; no account, authentication or network synchronization is enabled.
`src/save-data.js` owns the portable format, validation, checksums, migrations and
two-slot storage. `save-state.js` converts between validated progress and Phaser;
`save-system.js` handles menus and autosave.

## Envelope version 2

- `version`: schema version, independent of game releases.
- `game`: `The Redemption`.
- `savedAt`: timestamp of this snapshot.
- `data`: validated progress. Contains no Phaser objects, DOM nodes or credentials.
- `profile`: stable save `id`, `createdAt`, increasing `revision`, and `parentRevision`.
- `checksum`: corruption check of the JSON payload, excluding `checksum` itself.

The storage keys keep their original `.v1` names for compatibility. The envelope
determines the schema version. Export/import preserves profile identity and history.
A confirmed new game creates a new identity. Revisions advance only after a successful
local write; failed writes never advance the in-memory revision.

## Adding a version

1. Add a pure `N -> N+1` entry to `MIGRATIONS` and increment `SAVE_VERSION`.
2. Preserve earned XP, points, inventory, gold and quest rewards. Supply defaults
   only for newly introduced fields. Never execute gameplay reward functions.
3. Update validation and the canonical signed envelope if its fields change.
4. Add a historical-format fixture test covering migration and corruption.
5. Run the complete test suite and a browser Continue/import check.

Reads verify the original checksum **before** migration, then migrate sequentially
and validate the result. Reading does not rewrite storage. After a successful load,
the first upgraded write retains the original file in the backup slot. Invalid saves
fall back to the independent backup. Unknown future versions cannot be overwritten
by autosave from an older client.

## Future online synchronization

The same portable envelope can become the payload of a remote repository. Keep
account ownership and authentication on the server; a client-provided profile ID is
not proof of ownership. Do not put login tokens in exports.

Use profile ID plus server revision/checksum for conditional writes. Equal local
revisions can still contain divergent progress after playing on two devices, so
detect conflicts with checksums and ancestry; never resolve them using timestamps
alone. Keep both conflicting snapshots until the player chooses one. Client
checksums detect corruption, not cheating or tampering; server-authoritative
progress requires separate validation.

## Mountain rescue

The optional `data.mountainRescue` field records the search stage, fixed hidden
stone index, broken stone indices, and completed calls to Bobita. Missing fields
in older saves default to no expedition. Reloading resumes outside in the alpine
village; entering the portal restores the expedition. A discovered or carried
Bobita resumes at the summit, and a rescued Bobita reappears beside Luis. Partial
stone damage resets on re-entry; broken stones and the hidden target persist.

The later `transporting`, `delivered`, and `thawed` stages track the journey to
Matei's house. Transport resumes with Bobita carried in the village. Delivered
Bobita stays inside the house; an interrupted thaw animation restarts safely on
re-entry. Thawed Bobita remains warm in the house without replaying the rescue.

An optional `mountainRescue.firewood` object stores the `needed`, `chopped`,
`collected`, or `burning` stage and remaining sleigh HP (0–4). Collected wood is
one inventory stack of three `firewood` items and is consumed once on delivery.
Older delivered saves begin the firewood quest; already-thawed saves stay complete.

Optional `mountainRescue.rewards` flags record the book and necklace separately,
so full inventories defer each reward without duplication. The optional `bobita`
payload persists HP, sleep/death state and remaining heal cooldown. The necklace
has its own equipment slot; its fixed bonuses are validated as +4 strength and
+6 vitality. Older thawed saves receive the new rewards and companion on load.
