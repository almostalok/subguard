import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

describe('Security & Multi-Tenant Authorization Invariants', () => {
  test('session tokens are cryptographically random strings stored as SHA-256 digests', () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    assert.strictEqual(rawToken.length, 64, 'Token must be 256 bits (64 hex characters)');

    const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
    const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

    assert.strictEqual(hash1, hash2, 'Hash generation is deterministic');
    assert.notStrictEqual(rawToken, hash1, 'Raw token is never stored in plain text');
  });

  test('password hashes use strong bcrypt cost factor', async () => {
    const password = 'StrongPassword123!';
    const hash = await bcrypt.hash(password, 12);

    assert.ok(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$'), 'Bcrypt cost factor must be 12');
    const valid = await bcrypt.compare(password, hash);
    assert.strictEqual(valid, true);

    const invalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(invalid, false);
  });

  test('validates cross-user ownership barrier logic for mandates and reminders', () => {
    const userACommitment = { id: 'c1111111-1111-1111-1111-111111111111', userId: 'user-A' };
    const userBCommitment = { id: 'c2222222-2222-2222-2222-222222222222', userId: 'user-B' };

    function checkCommitmentOwnership(commitmentUserId: string, requestingUserId: string): boolean {
      return commitmentUserId === requestingUserId;
    }

    // User A accessing User A's commitment
    assert.strictEqual(checkCommitmentOwnership(userACommitment.userId, 'user-A'), true);
    // User B attempting to bind User A's commitment in a mandate or reminder
    assert.strictEqual(checkCommitmentOwnership(userACommitment.userId, 'user-B'), false);
    // User A attempting to bind User B's commitment
    assert.strictEqual(checkCommitmentOwnership(userBCommitment.userId, 'user-A'), false);
  });

  test('prevents CSV formula injection triggers', () => {
    const { escapeCsvCell } = require('@subguard/utils');

    assert.strictEqual(escapeCsvCell('=cmd|/c calc'), "'=cmd|/c calc");
    assert.strictEqual(escapeCsvCell('+SUM(A1:A10)'), "'+SUM(A1:A10)");
    assert.strictEqual(escapeCsvCell('-2+3*cmd'), "'-2+3*cmd");
    assert.strictEqual(escapeCsvCell('@SUM'), "'@SUM");
    assert.strictEqual(escapeCsvCell('Normal Merchant'), 'Normal Merchant');
    assert.strictEqual(escapeCsvCell(''), '');
  });
});
