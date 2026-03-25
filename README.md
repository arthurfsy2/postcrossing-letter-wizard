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
1. **Step 1**: Read Postcrossing address emails from your mailbox
2. **Step 2**: Analyze recipient preferences and background
3. **Step 3**: Save structured analysis to local file
4. **Step 4**: Collect your personal context (or reuse existing template)
5. **Step 5**: Generate personalized postcard messages (60-90 words, English + Chinese translation)

All files are saved to `postcrossing_content/` in your workspace.

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

All generated files are saved in the `postcrossing_content/` folder in your workspace root:

| File | Content |
|------|---------|
| `{date}_recipient-analysis.md` | Recipient information and preference analysis |
| `user-content-template.md` | Your personal background material (reused across batches) |
| `{date}_postcard-content.md` | Generated postcard messages (English + Chinese translation for zh users) |

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
    ├── scripts/                  # IMAP email reading scripts
    │   ├── imap-config.js
    │   ├── list-folders.js
    │   ├── search-postcrossing.js
    │   └── get-postcrossing-body.js
    └── templates/                # Output file format templates
        ├── recipient-analysis-template.md
        ├── user-content-template.md
        └── postcard-content-template.md
```

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
