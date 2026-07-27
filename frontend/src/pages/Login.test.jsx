import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import Login from './Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DataProvider>
          <Login />
        </DataProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Login page', () => {
  it('renders the role picker and sign-in form', () => {
    renderLogin();
    expect(screen.getByText('Next Move')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('shows forgot-password link and role-based register CTA', () => {
    renderLogin();
    expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/forgot-password');
    // Student is the default role — register CTA should be present
    expect(screen.getByText(/register as student/i)).toBeInTheDocument();
  });
});

