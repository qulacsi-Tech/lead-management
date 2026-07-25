import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import Login from './Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
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

  it('links to signup and forgot-password routes', () => {
    renderLogin();
    expect(screen.getByText(/sign up as a new student/i).closest('a')).toHaveAttribute('href', '/signup');
    expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/forgot-password');
  });
});
