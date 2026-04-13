'use strict';

/**
 * Read stdin with timeout. Common utility for all hook scripts.
 * @param {number} timeout - Timeout in milliseconds (default: 1000)
 * @returns {Promise<string>} stdin data
 */
function readStdin(timeout = 1000) {
  return new Promise((resolve) => {
    let data = '';
    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve(data);
      }
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', finish);
    setTimeout(finish, timeout);

    if (process.stdin.isTTY) finish();
  });
}

module.exports = { readStdin };
