import assert from 'node:assert/strict';
import { test } from 'node:test';
import { codeKind } from '../src/lib/code-kind.ts';

test('one code field routes ECG delegate and chair codes to ECG', () => {
  assert.equal(codeKind('M78Q-8WNK'), 'ecg');
  assert.equal(codeKind(' qkyhtxqp '), 'ecg');
  assert.equal(codeKind('QKYH TXQP'), 'ecg');
});

test('one code field preserves older committee chair and organiser codes', () => {
  assert.equal(codeKind('ILO-A7WLY7AL'), 'chair');
  assert.equal(codeKind('COPUOS-HUP9XYUY'), 'chair');
  assert.equal(codeKind('ORGA-8GCZFHZU'), 'organizer');
  assert.equal(codeKind('KAMUN-ORGANISER-LONG-CODE'), 'organizer');
  assert.equal(codeKind('KAMUN-MEMBER'), 'legacy_member');
});
