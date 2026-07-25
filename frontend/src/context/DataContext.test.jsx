import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataProvider, useData } from './DataContext';

function setup() {
  return renderHook(() => useData(), { wrapper: DataProvider });
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('DataContext', () => {
  it('addLead creates a pending lead attributed to the referrer', () => {
    const { result } = setup();
    act(() => {
      result.current.addLead({ name: 'Rahul Sharma', mobile: '9876543210', city: 'Pune', course: 'B.Tech CS', source: 'student', referrerKey: 'Alex' });
    });
    const mine = result.current.leadsFor('Alex');
    expect(mine).toHaveLength(1);
    expect(mine[0].status).toBe('pending');
    expect(mine[0].points).toBe(0);
  });

  it('verifyLead marks a lead verified and awards points once', () => {
    const { result } = setup();
    act(() => {
      result.current.addLead({ name: 'Priya', mobile: '9876500000', city: 'Delhi', course: 'MBA', source: 'student', referrerKey: 'Alex' });
    });
    const id = result.current.leadsFor('Alex')[0].id;
    act(() => {
      result.current.verifyLead(id);
    });
    const verified = result.current.leadsFor('Alex')[0];
    expect(verified.status).toBe('verified');
    expect(verified.points).toBe(100);
  });

  it('unlockLead deducts credits and blocks when balance is insufficient', () => {
    const { result } = setup();
    act(() => {
      result.current.addLead({ name: 'Ankit', mobile: '9876511111', city: 'Mumbai', course: 'Design', source: 'student', referrerKey: 'Someone' });
    });
    const id = result.current.leadsFor('Someone')[0].id;
    const startingCredits = result.current.creditsFor('Acme Institute');

    let firstUnlock;
    act(() => {
      firstUnlock = result.current.unlockLead(id, 'Acme Institute');
    });
    expect(firstUnlock.ok).toBe(true);
    expect(result.current.creditsFor('Acme Institute')).toBe(startingCredits - result.current.unlockCost);

    let secondUnlock;
    act(() => {
      secondUnlock = result.current.unlockLead(id, 'Acme Institute');
    });
    expect(secondUnlock.ok).toBe(false);
    expect(secondUnlock.reason).toBe('not-found');
  });

  it('updateLeadStatus cycles hot -> interested -> converted', () => {
    const { result } = setup();
    act(() => {
      result.current.addLead({ name: 'Neha', mobile: '9876522222', city: 'Chennai', course: 'Law', source: 'mentor', referrerKey: 'Mentor A' });
    });
    const id = result.current.leadsFor('Mentor A')[0].id;
    act(() => {
      result.current.unlockLead(id, 'Bright Institute');
    });

    let s1, s2, s3;
    act(() => { s1 = result.current.updateLeadStatus(id); });
    act(() => { s2 = result.current.updateLeadStatus(id); });
    act(() => { s3 = result.current.updateLeadStatus(id); });
    expect([s1, s2, s3]).toEqual(['hot', 'interested', 'converted']);
  });
});
