import assert from 'node:assert/strict';
import { test } from 'node:test';
import { codeKind } from '../src/lib/code-kind.ts';

test('one code field routes ECG delegate and chair codes to ECG', () => {
  assert.equal(codeKind('M78Q-8WNK'), 'ecg');
  assert.equal(codeKind(' qkyhtxqp '), 'ecg');
  assert.equal(codeKind('QKYH TXQP'), 'ecg');
});

test('imported five-character ECE codes reach private verification for every role', () => {
  // Synthetic examples: routing never infers delegate, chair or admin privileges.
  for (const code of ['A1B2C', ' d3e4f ', 'g5h6j', 'A1 B2C', 'a1–b2c']) {
    assert.equal(codeKind(code), 'ecg');
  }
  for (const code of ['AB12', 'AB1234', 'AB12345', 'AB12!', 'AB1234567']) {
    assert.notEqual(codeKind(code), 'ecg');
  }
});

test('one code field preserves older committee chair and organiser codes', () => {
  assert.equal(codeKind('ILO-A7WLY7AL'), 'chair');
  assert.equal(codeKind('COPUOS-HUP9XYUY'), 'chair');
  assert.equal(codeKind('ORGA-8GCZFHZU'), 'organizer');
  assert.equal(codeKind('KAMUN-ORGANISER-LONG-CODE'), 'organizer');
  assert.equal(codeKind('KAMUN-MEMBER'), 'legacy_member');
});
