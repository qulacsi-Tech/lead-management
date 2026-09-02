import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

const fetchMyPages = vi.fn();
let currentUser = { id: 'u1', role: 'professional' };

vi.mock('../Api/Api', () => ({ fetchMyPages: (...a) => fetchMyPages(...a) }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: currentUser }) }));

const { useMyPages } = await import('./useMyPages');

/** Stands in for the Me menu: shows the console entry only to page admins. */
function MeMenu() {
  const { isInstituteAdmin } = useMyPages();
  return <span data-testid="menu">{isInstituteAdmin ? 'Institute Console' : 'Create Institute Page'}</span>;
}

/** Stands in for the profile's organisation tab, which triggers the refresh. */
function OrgTab() {
  const { refresh, pages } = useMyPages();
  return (
    <button type="button" onClick={refresh} data-testid="save">
      saved:{pages.length}
    </button>
  );
}

describe('useMyPages', () => {
  beforeEach(() => {
    fetchMyPages.mockReset();
    currentUser = { id: 'u1', role: 'professional' };
  });

  it('refresh from one component updates every other consumer', async () => {
    // The reported bug: saving Organisation Details created the page, but the
    // Me menu kept offering "Create Institute Page" until a manual reload,
    // because each caller held its own copy of the list.
    fetchMyPages.mockResolvedValueOnce([]);
    render(<><MeMenu /><OrgTab /></>);

    await waitFor(() => expect(screen.getByTestId('menu')).toHaveTextContent('Create Institute Page'));

    fetchMyPages.mockResolvedValueOnce([{ id: 'p1', name: 'Herald Institute' }]);
    await act(async () => {
      screen.getByTestId('save').click();
    });

    await waitFor(() => expect(screen.getByTestId('menu')).toHaveTextContent('Institute Console'));
    expect(screen.getByTestId('save')).toHaveTextContent('saved:1');
  });

  it('shares one request between simultaneous consumers', async () => {
    // Its own user id: the store is module-level and deliberately keeps what
    // an earlier test loaded, which would otherwise serve this from cache.
    currentUser = { id: 'u-shared', role: 'professional' };
    fetchMyPages.mockResolvedValue([{ id: 'p1', name: 'Shared' }]);
    render(<><MeMenu /><OrgTab /></>);

    await waitFor(() => expect(screen.getByTestId('menu')).toHaveTextContent('Institute Console'));
    expect(fetchMyPages).toHaveBeenCalledTimes(1);
  });

  it('never shows one account the pages of another', async () => {
    currentUser = { id: 'u-switch-a', role: 'professional' };
    fetchMyPages.mockResolvedValue([{ id: 'p1', name: 'First user page' }]);
    const { rerender } = render(<MeMenu />);
    await waitFor(() => expect(screen.getByTestId('menu')).toHaveTextContent('Institute Console'));

    currentUser = { id: 'u-switch-b', role: 'professional' };
    fetchMyPages.mockResolvedValue([]);
    rerender(<MeMenu />);

    await waitFor(() => expect(screen.getByTestId('menu')).toHaveTextContent('Create Institute Page'));
  });
});
