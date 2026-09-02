import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/useSession', () => ({ useSession: () => ({ auth: { id: 'u1' }, name: 'Suman', profile: {} }) }));
vi.mock('../context/LoginPrompt', () => ({ useLoginPrompt: () => ({ openLogin: vi.fn() }) }));
vi.mock('../Api/Api', () => ({
  fetchPublicOpportunities: vi.fn(), fetchPublicPages: vi.fn(),
  fetchMyFollows: vi.fn(), followPage: vi.fn(), unfollowPage: vi.fn(),
  likeOpportunity: vi.fn(), unlikeOpportunity: vi.fn(),
  resolveAssetUrl: (u) => u, ApiError: class extends Error {},
}));
vi.mock('../hooks/useMyPages', () => ({ useMyPages: () => ({ pages: [], loading: false }) }));

const { SuggestionsRail } = await import('./Feed');

const institute = (n) => ({ id: `p${n}`, name: `Institute ${n}`, type: 'Coaching', slug: `i${n}`, city: 'Indore' });

function renderRail(pages, myPageIds = new Set()) {
  return render(
    <MemoryRouter>
      <SuggestionsRail
        pages={pages}
        myPageIds={myPageIds}
        followedIds={new Set()}
        onToggleFollow={vi.fn()}
        busyId={null}
      />
    </MemoryRouter>,
  );
}

describe('SuggestionsRail', () => {
  it("shows an institute the viewer administers, instead of hiding it", () => {
    // The reported bug: a user created their organisation, went to the home
    // page, and could not find it — because their own pages were filtered out,
    // which reads as "it was never created".
    renderRail([institute(1)], new Set(['p1']));

    expect(screen.getByText('Institute 1')).toBeInTheDocument();
    // ...but you cannot follow yourself.
    expect(screen.queryByRole('button', { name: 'Follow' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage' })).toBeInTheDocument();
  });

  it('offers Follow for institutes the viewer does not administer', () => {
    renderRail([institute(1)], new Set());
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
  });

  it('shows five at a time and reveals the rest a page at a time', () => {
    renderRail(Array.from({ length: 12 }, (_, i) => institute(i + 1)));

    expect(screen.getByText('Institute 5')).toBeInTheDocument();
    expect(screen.queryByText('Institute 6')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show 5 more of 7/ }));
    expect(screen.getByText('Institute 10')).toBeInTheDocument();
    expect(screen.queryByText('Institute 11')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show 2 more/ }));
    expect(screen.getByText('Institute 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('has no expander when everything already fits', () => {
    renderRail([institute(1), institute(2)]);
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
  });

  it('renders nothing rather than an empty card when there are no institutes', () => {
    const { container } = renderRail([]);
    expect(container).toBeEmptyDOMElement();
  });
});
