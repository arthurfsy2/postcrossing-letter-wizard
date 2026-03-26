# Postcrossing Letter Wizard

> Automatically read Postcrossing recipient information from your email, generate personalized postcard messages with AI, and save all files locally.

## Quick Start

### 1. Install Dependencies

```bash
cd postcrossing-letter-wizard
npm install
```

### 2. Generate Postcard Content (AI Auto-Mode)

Simply tell the AI what you want (in English or Chinese):

```
Generate postcard content for me
```

Or in Chinese:

```
帮我生成明信片内容
```

The AI will automatically execute the complete workflow:
1. **Step 1**: Environment setup (email credentials, language, country/city)
2. **Step 2**: Read Postcrossing address emails from your mailbox
3. **Step 2.5**: Save raw email content (new, for verification)
4. **Step 3**: Analyze recipient preferences and background
5. **Step 4**: Collect your personal context (or reuse existing template, supports blog import)
6. **Step 5**: Generate personalized postcard messages (60-90 words, English + Chinese translation)
7. **Step 6**: Send backup email with all files compressed (optional, new)

Additional features:
- HTML print version generation (A4 format with cut lines, new)
- Handwritten preference detection (highlight recipients who prefer handwritten cards, new)

All files are saved to `postcrossing_content/{date}/` in your workspace (date-based subfolders).

### Manual Mode (Optional)

If you prefer to run scripts manually:

```bash
# List email folders
node scripts/list-folders.js

# Search Postcrossing emails
node scripts/search-postcrossing.js --folder "your_folder" --date 2026-03-25 --limit 10

# Read specific email
node scripts/get-postcrossing-body.js --uid 220 --folder "your_folder"
```

## Output Files

All generated files are saved in the `postcrossing_content/{date}/` folder in your workspace root (date-based subfolders):

| File | Content |
|------|---------|
| `{date}_raw-emails.md` | Raw email content for verification (new) |
| `{date}_recipient-analysis.md` | Recipient information and preference analysis |
| `user-content-template.md` | Your personal background material (reused across batches, supports blog import) |
| `{date}_postcard-content.md` | Generated postcard messages (English + Chinese translation) |
| `{date}_print.html` | HTML print version with cut lines (new, optional) |

## Detailed Documentation

See [SKILL.md](./SKILL.md)

## Project Structure

```
your-workspace/
├── .env_postcrossing             # User configuration (do not commit to git)
├── postcrossing_content/         # Generated analysis and content files
└── postcrossing-letter-wizard/   # Skill main directory
    ├── SKILL.md                  # Complete skill specification (for AI)
    ├── README.md                 # Project documentation (for humans)
    ├── package.json
    ├── .gitignore
    ├── .env.example              # Configuration template (for reference)
    ├── scripts/                  # IMAP email reading scripts
    │   ├── imap-config.js        # Auto-detect IMAP configuration
    │   ├── list-folders.js       # List email folders
    │   ├── search-postcrossing.js # Search Postcrossing emails
    │   ├── get-postcrossing-body.js # Read email body
    │   ├── save-raw-emails.js    # Save raw emails to markdown (new)
    │   └── generate-print-html.js # Generate HTML print version (new)
    └── templates/                # Output file format templates
        ├── raw-emails-template.md # Raw emails template (new)
        ├── recipient-analysis-template.md
        ├── user-content-template.md
        ├── postcard-content-template.md
        └── print-html-template.html # HTML print template (new)
```

> **Note**: `.env.example` is a template file for reference only. The actual configuration file `.env_postcrossing` should be placed in your **workspace root directory** (parent of `postcrossing-letter-wizard/`). However, you don't need to manually create it — the AI will guide you through the setup automatically in Step 1.

## Dependencies

- `imap`: IMAP protocol for reading emails
- `mailparser`: Parse email content
- `dotenv`: Read .env_postcrossing environment variables

## License

MIT

---

## Notes

- **SKILL.md** is written in Chinese (for AI reference) but the skill fully supports English-speaking users through the `LANG` environment variable
- All scripts are self-contained in the `scripts/` directory
- Generated files are saved to your workspace's `postcrossing_content/` folder (not in the skill directory)
