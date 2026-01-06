# Delete Thread AMP

A powerful command-line tool (CLI) to bulk delete threads from ampcode.com. Delete single or multiple threads efficiently with configurable delays, automatic validation, and detailed reporting. Perfect for forum management, content cleanup, and automated thread deletion.

## Features

- Delete single or multiple threads
- Read thread IDs from a file
- Configurable delay between requests
- Automatic thread ID format validation
- Detailed success/failure reporting
- Support for custom cookies via environment variable

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Valid ampcode.com session cookies

## Project Structure

```
delete-thread-amp/
├── src/
│   └── delete-threads.ts      # Main CLI tool
├── tools/
│   ├── extract-thread-ids-auto-scroll.js      # Browser script to extract thread IDs
│   └── extract-thread-ids-auto-scroll.min.js  # Minified version
├── examples/
│   └── threads-example.txt     # Example file with thread IDs
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. **Set up your cookies** (see below)

## ⚠️ Security Warning

**IMPORTANT**: This tool requires your ampcode.com session cookies to work. 

- **NEVER** commit your cookies to version control
- **NEVER** share your cookies publicly
- Cookies are like passwords - anyone with them can access your account
- Always use environment variables or `.env` file (which is gitignored)
- If you accidentally committed cookies, **immediately revoke your session** on ampcode.com

## Getting Your Cookies (REQUIRED)

**Cookies are REQUIRED** - the tool will not work without them. To obtain your session cookies from ampcode.com:

1. Open your browser and log in to ampcode.com
2. Open Developer Tools (F12)
3. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Navigate to **Cookies** → `https://ampcode.com`
5. Copy the values of `_cfuvid`, `GAESA`, and `session` cookies
6. Format them as: `_cfuvid=...; GAESA=...; session=...`

**Example format:**
```
_cfuvid=abc123...; GAESA=xyz789...; session=Fe26.2*1*...
```

## Usage

### Delete Single Thread

```bash
npm start T-019b3350-378c-713b-a1d9-9c9d6441e43a
```

Or using tsx directly:

```bash
npx tsx src/delete-threads.ts T-019b3350-378c-713b-a1d9-9c9d6441e43a
```

### Delete Multiple Threads

```bash
npm start T-019b3350-378c-713b-a1d9-9c9d6441e43a T-019b3584-5699-7391-86d7-c35bbb7c2701 T-019b3585-5752-71de-a9ce-1adfc7764fe6
```

### Delete Threads from File

Create a text file with one thread ID per line:

```bash
npm start --file examples/threads-example.txt
```

Or with custom delay:

```bash
npm start --delay 2000 --file examples/threads-example.txt
```

### Setting Cookies (REQUIRED)

You **must** set the `AMPCODE_COOKIES` environment variable. Choose one method:

#### Method 1: Environment Variable (Temporary)

**Linux/Mac:**
```bash
export AMPCODE_COOKIES="your-cookies-here"
npm start --file examples/threads-example.txt
```

**Windows (PowerShell):**
```powershell
$env:AMPCODE_COOKIES="your-cookies-here"
npm start --file examples/threads-example.txt
```

**Windows (CMD):**
```cmd
set AMPCODE_COOKIES=your-cookies-here
npm start --file examples/threads-example.txt
```

#### Method 2: .env File (Recommended)

1. Copy `env.example` to `.env`:
```bash
cp env.example .env
```

2. Edit `.env` and add your cookies:
```
AMPCODE_COOKIES=your-cookies-here
```

3. The tool will automatically load from `.env` if you use a package like `dotenv`, or you can source it:
```bash
# Linux/Mac
export $(cat .env | xargs)
npm start --file examples/threads-example.txt
```

**Note**: `.env` is already in `.gitignore` and will not be committed.

## Command Line Options

- `--file, -f <path>`: Read thread IDs from a file (one per line)
- `--delay <milliseconds>`: Delay between requests in milliseconds (default: 1000ms)

## File Format

Thread ID files should contain one thread ID per line. Lines starting with `#` are treated as comments and ignored.

Example file (`threads.txt`):

```
# This is a comment
T-019b3350-378c-713b-a1d9-9c9d6441e43a
T-019b3584-5699-7391-86d7-c35bbb7c2701
T-019b3585-5752-71de-a9ce-1adfc7764fe6
```

## Extracting Thread IDs

This repository includes a browser script to help you extract thread IDs from ampcode.com:

1. Open ampcode.com in your browser
2. Navigate to the page containing the threads you want to delete
3. Open Developer Tools (F12) and go to the Console tab
4. Copy and paste the contents of `tools/extract-thread-ids-auto-scroll.js` into the console
5. Press Enter to run the script
6. The script will:
   - Auto-scroll down the page
   - Collect all thread IDs automatically
   - Stop when no new threads are found
   - Copy the results to your clipboard
   - Provide a download link

You can also manually stop the collection by calling `stopCollection()` in the console.

## Output

The tool provides detailed output for each deletion attempt:

```
Found 3 thread(s) to delete
Delay between requests: 1000ms

[1/3] Deleting thread: T-019b3350-378c-713b-a1d9-9c9d6441e43a...
  ✓ Successfully deleted T-019b3350-378c-713b-a1d9-9c9d6441e43a

[2/3] Deleting thread: T-019b3584-5699-7391-86d7-c35bbb7c2701...
  ✓ Successfully deleted T-019b3584-5699-7391-86d7-c35bbb7c2701

[3/3] Deleting thread: T-019b3585-5752-71de-a9ce-1adfc7764fe6...
  ✗ Failed to delete T-019b3585-5752-71de-a9ce-1adfc7764fe6: HTTP 403: Forbidden

=== Summary ===
Total: 3
Successful: 2
Failed: 1

Failed threads:
  - T-019b3585-5752-71de-a9ce-1adfc7764fe6: HTTP 403: Forbidden
```

## Thread ID Format

Thread IDs must follow the format: `T-xxxxx-xxxx-xxxx-xxxx`

The tool automatically validates thread ID format before attempting deletion.

## Error Handling

The tool handles various error scenarios:

- Invalid thread ID format
- Network errors
- HTTP errors (403, 404, 500, etc.)
- Authentication failures

All errors are reported in the summary at the end of execution.

## Security Notes

⚠️ **CRITICAL SECURITY WARNINGS**: 

- **Cookies are REQUIRED** - there are NO default cookies in the code
- **NEVER** commit your cookies to version control (`.env` is gitignored)
- **NEVER** share your cookies publicly or in screenshots
- Cookies are like passwords - anyone with them can access your account
- Always use environment variables or `.env` file
- Cookies expire after some time - you may need to refresh them periodically
- If you accidentally committed cookies, **immediately revoke your session** on ampcode.com
- The tool will exit with an error if `AMPCODE_COOKIES` is not set

## Troubleshooting

### "HTTP 403: Forbidden"

- Your cookies may have expired - get fresh cookies from your browser
- You may not have permission to delete the thread
- The thread may have already been deleted

### "Invalid thread ID format"

- Ensure thread IDs follow the format: `T-xxxxx-xxxx-xxxx-xxxx`
- Check for typos in your thread IDs

### "No thread IDs provided"

- Make sure you've provided thread IDs as arguments or in a file
- Check that your file path is correct
- Ensure your file contains valid thread IDs (not empty or only comments)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
