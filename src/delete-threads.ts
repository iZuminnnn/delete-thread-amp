#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration from curl command
const API_URL = 'https://ampcode.com/_app/remote/1sy86lg/deleteThreadCommand';

// Get cookies from environment variable (REQUIRED)
const COOKIES = process.env.AMPCODE_COOKIES;

if (!COOKIES) {
  console.error('❌ Error: AMPCODE_COOKIES environment variable is required!');
  console.error('');
  console.error('Please set your cookies using one of the following methods:');
  console.error('');
  console.error('  Linux/Mac:');
  console.error('    export AMPCODE_COOKIES="your-cookies-here"');
  console.error('    npm start <thread-id>');
  console.error('');
  console.error('  Windows (PowerShell):');
  console.error('    $env:AMPCODE_COOKIES="your-cookies-here"');
  console.error('    npm start <thread-id>');
  console.error('');
  console.error('  Windows (CMD):');
  console.error('    set AMPCODE_COOKIES=your-cookies-here');
  console.error('    npm start <thread-id>');
  console.error('');
  console.error('  Or create a .env file:');
  console.error('    AMPCODE_COOKIES=your-cookies-here');
  console.error('');
  console.error('See README.md for instructions on how to get your cookies.');
  process.exit(1);
}

interface DeleteResult {
  threadId: string;
  success: boolean;
  error?: string;
}

/**
 * Validate thread ID format
 */
function isValidThreadId(threadId: string): boolean {
  // Thread IDs typically start with "T-" followed by UUID format
  return /^T-[a-f0-9-]+$/i.test(threadId);
}

/**
 * Delete a single thread
 */
async function deleteThread(threadId: string): Promise<DeleteResult> {
  try {
    // Validate thread ID format
    if (!isValidThreadId(threadId)) {
      return {
        threadId,
        success: false,
        error: `Invalid thread ID format: ${threadId} (expected format: T-xxxxx-xxxx-xxxx-xxxx)`
      };
    }

    // Create payload: [{"threadID":1}, "T-..."]
    // The first element seems to be a threadID number, second is the thread ID string
    const payload = JSON.stringify([
      { threadID: 1 },
      threadId
    ]);
    
    // Base64 encode the payload
    const encodedPayload = Buffer.from(payload).toString('base64');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'accept-language': 'en,en-US;q=0.9,vi;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        'cookie': COOKIES,
        'origin': 'https://ampcode.com',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': `https://ampcode.com/threads/${threadId}`,
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        'x-sveltekit-pathname': `/threads/${threadId}`,
        'x-sveltekit-search': ''
      },
      body: JSON.stringify({
        payload: encodedPayload,
        refreshes: []
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        threadId,
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    return {
      threadId,
      success: true
    };
  } catch (error) {
    return {
      threadId,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Show usage information
 */
function showUsage(): void {
  console.error('Usage:');
  console.error('  npm start <thread-id-1> <thread-id-2> ...');
  console.error('  npm start --file <path-to-file>');
  console.error('  npm start --delay <milliseconds> --file <path-to-file>');
  console.error('  tsx src/delete-threads.ts <thread-id-1> <thread-id-2> ...');
  console.error('  tsx src/delete-threads.ts --file <path-to-file>');
  console.error('');
  console.error('Options:');
  console.error('  --file, -f <path>    Read thread IDs from file (one per line)');
  console.error('  --delay <ms>         Delay between requests in milliseconds (default: 1000)');
  console.error('');
  console.error('Environment variables (REQUIRED):');
  console.error('  AMPCODE_COOKIES      Your ampcode.com session cookies (required)');
  console.error('');
  console.error('File format: one thread ID per line (lines starting with # are ignored)');
}

/**
 * Parse command line arguments and extract options
 */
function parseArgs(): { threadIds: string[]; delay: number } {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    process.exit(1);
  }

  let delay = 1000;
  const threadIds: string[] = [];
  let i = 0;

  while (i < args.length) {
    if (args[i] === '--file' || args[i] === '-f') {
      if (i + 1 >= args.length) {
        console.error('Error: File path is required after --file');
        process.exit(1);
      }
      const filePath = join(process.cwd(), args[i + 1]);
      const content = readFileSync(filePath, 'utf-8');
      const ids = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      threadIds.push(...ids);
      i += 2;
    } else if (args[i] === '--delay') {
      if (i + 1 >= args.length) {
        console.error('Error: Delay value is required after --delay');
        process.exit(1);
      }
      delay = parseInt(args[i + 1], 10);
      if (isNaN(delay) || delay < 0) {
        console.error('Error: Delay must be a positive number');
        process.exit(1);
      }
      i += 2;
    } else if (!args[i].startsWith('--')) {
      // Check if it's a valid thread ID format first
      if (isValidThreadId(args[i])) {
        // It's a thread ID
        threadIds.push(args[i]);
      } else {
        // Might be a file path, check if file exists
        const potentialPath = join(process.cwd(), args[i]);
        if (existsSync(potentialPath)) {
          // It's a file, read it
          const content = readFileSync(potentialPath, 'utf-8');
          const ids = content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
          threadIds.push(...ids);
          console.log(`Auto-detected file: ${args[i]} (found ${ids.length} thread IDs)`);
        } else {
          // Neither valid thread ID nor file, show error
          console.error(`Error: "${args[i]}" is neither a valid thread ID nor an existing file`);
          console.error(`  Thread ID format: T-xxxxx-xxxx-xxxx-xxxx`);
          console.error(`  File path: ${potentialPath} (not found)`);
          process.exit(1);
        }
      }
      i++;
    } else {
      i++;
    }
  }

  if (threadIds.length === 0) {
    console.error('Error: No thread IDs provided');
    showUsage();
    process.exit(1);
  }

  return { threadIds, delay };
}

/**
 * Main function
 */
async function main() {
  const { threadIds, delay } = parseArgs();
  
  console.log(`Found ${threadIds.length} thread(s) to delete`);
  console.log(`Delay between requests: ${delay}ms\n`);
  
  const results: DeleteResult[] = [];

  for (let i = 0; i < threadIds.length; i++) {
    const threadId = threadIds[i];
    console.log(`[${i + 1}/${threadIds.length}] Deleting thread: ${threadId}...`);
    
    const result = await deleteThread(threadId);
    results.push(result);
    
    if (result.success) {
      console.log(`  ✓ Successfully deleted ${threadId}\n`);
    } else {
      console.log(`  ✗ Failed to delete ${threadId}: ${result.error}\n`);
    }
    
    // Add delay between requests (except for the last one)
    if (i < threadIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed threads:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.threadId}: ${r.error}`));
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
