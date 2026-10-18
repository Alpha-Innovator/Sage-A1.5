# Website maintenance

`docs/` in the complete `Agents-A1.5` repository is the website source of truth.
Maintain the homepage, showcase pages, assets, and site manifest together here.
Other directories and standalone HTML files are sharing snapshots, not separate
website sources. Export a new snapshot from this checkout when one is needed.

For the current shared workspace, the maintained checkout is
`/mnt/shared-storage-gpfs2/sciprismax2/chenyixin/Agents-A1.5`.

Preview directly from this repository root:

```sh
python3 -m http.server 8876 --bind 0.0.0.0 --directory docs
```

The homepage is `/index.html`; the gallery is `/demos.html`. The ten-case light
Scientific Co-working page is `/showcases/scientific-co-working/index.html`.
Keep each page's relative navigation within this same site.

The four homepage collections follow Section 4 of the A1.5 technical report.
Scientific Co-working follows Figure 8 panel order; Auto-Research follows
Figure 9: energy economics, gravitational waves, then atomistic materials.

When changing hashed scripts, update their filenames, HTML references, and
`assets/index-inline.json` checksums together. Refresh entry-page hashes in
`site-manifest.json`. Preserve recorded scientific artifacts and distinguish
presentation edits from changes to underlying results.
