import { useLocalStorageState } from '../hooks/useLocalStorageState';

// Which Institute Pages (by slug) the current session follows — drives the
// free "Sell Lead" visibility in the Marketplace tab on Profile. See
// docs/CLIENT_FEEDBACK_2026-08-16.md, Section 3.
export function useFollows() {
  const [followedSlugs, setFollowedSlugs] = useLocalStorageState('followedPages', []);

  const isFollowing = (slug) => followedSlugs.includes(slug);

  const follow = (slug) => setFollowedSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));

  const unfollow = (slug) => setFollowedSlugs((prev) => prev.filter((s) => s !== slug));

  const toggleFollow = (slug) => setFollowedSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  return { followedSlugs, isFollowing, follow, unfollow, toggleFollow };
}
