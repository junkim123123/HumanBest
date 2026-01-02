# Product Photos

This folder contains product photos organized by category.

## Folder Structure

Create subfolders for each category. Folder names can be in Korean or English:

```
product-photos/
├── 전자제품/          # Electronics
│   ├── phone-case.jpg
│   └── charger.png
├── 의류/              # Apparel
│   └── jacket.jpg
├── accessories/       # English names also work
│   └── watch.jpg
└── uncategorized/     # Default category
    └── misc-item.jpg
```

## Supported Formats

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.gif`

## Generating the Manifest

Run the manifest generator script to create `public/photo-manifest.json`:

```bash
npx tsx scripts/generatePhotoManifest.ts
```

This will scan all folders and create a JSON manifest with:
- `id`: Unique identifier
- `src`: Image path relative to public
- `categoryKey`: Folder name (original)
- `categoryLabel`: English label (from photoCategories.ts mapping)
