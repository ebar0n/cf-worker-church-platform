import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPage from '@/app/privacy/page';
import { CHURCH_CONTACT } from '@/lib/constants';

describe('privacy policy page', () => {
  it('shows the current church contact data', () => {
    render(<PrivacyPage />);
    expect(
      screen.getByText(`${CHURCH_CONTACT.pastorName}: ${CHURCH_CONTACT.pastorPhone}`)
    ).toBeDefined();
    expect(screen.getByText(new RegExp(CHURCH_CONTACT.email))).toBeDefined();
    expect(screen.getByText(new RegExp(CHURCH_CONTACT.address))).toBeDefined();
  });
});
