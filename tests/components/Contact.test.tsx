import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Contact from '@/app/components/Contact';
import { CHURCH_CONTACT } from '@/lib/constants';

// The pastor and phone change from time to time: they live in
// CHURCH_CONTACT (src/lib/constants.ts) and this test guarantees the
// landing section actually renders whatever that constant says.
describe('Contact section (home landing)', () => {
  it('shows the current pastor name and phone', () => {
    render(<Contact />);
    expect(screen.getByText(CHURCH_CONTACT.pastorName)).toBeDefined();
    expect(screen.getByText(CHURCH_CONTACT.pastorPhone)).toBeDefined();
  });
});
