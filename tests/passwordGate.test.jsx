import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordGate from '../src/PasswordGate';

describe('PasswordGate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('says a wrong password on the page, not in a browser pop-up', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<PasswordGate>secret</PasswordGate>);

    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'nope' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Incorrect password');
    expect(screen.queryByText('secret')).toBeNull();

    // Typing again clears the message.
    fireEvent.change(screen.getByPlaceholderText('Enter password'), {
      target: { value: 'nope2' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
