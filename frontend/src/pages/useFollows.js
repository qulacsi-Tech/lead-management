import { useCallback, useEffect, useState } from 'react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { fetchMyFollows, followPage, unfollowPage } from '../Api/Api';
import { useAuth } from '../context/AuthContext';

export function useFollows() {
  const { user } = useAuth();
  const [followedSlugs, setFollowedSlugs] = useLocalStorageState('followedPages', []);
  const [followedPageIds, setFollowedPageIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchMyFollows()
      .then((pages) => {
        if (Array.isArray(pages)) {
          const slugs = pages.map((p) => p.slug).filter(Boolean);
          const ids = pages.map((p) => p.id).filter(Boolean);
          setFollowedSlugs(slugs);
          setFollowedPageIds(ids);
        }
      })
      .catch(() => {});
  }, [user]);

  const isFollowing = useCallback(
    (identifier) => followedSlugs.includes(identifier) || followedPageIds.includes(identifier),
    [followedSlugs, followedPageIds]
  );

  const follow = useCallback(
    async (pageIdOrSlug) => {
      setFollowedSlugs((prev) => (prev.includes(pageIdOrSlug) ? prev : [...prev, pageIdOrSlug]));
      if (user) {
        try {
          await followPage(pageIdOrSlug);
        } catch (e) {
          console.warn('API follow error:', e);
        }
      }
    },
    [user, setFollowedSlugs]
  );

  const unfollow = useCallback(
    async (pageIdOrSlug) => {
      setFollowedSlugs((prev) => prev.filter((s) => s !== pageIdOrSlug));
      setFollowedPageIds((prev) => prev.filter((id) => id !== pageIdOrSlug));
      if (user) {
        try {
          await unfollowPage(pageIdOrSlug);
        } catch (e) {
          console.warn('API unfollow error:', e);
        }
      }
    },
    [user, setFollowedSlugs]
  );

  const toggleFollow = useCallback(
    (pageIdOrSlug) => {
      if (isFollowing(pageIdOrSlug)) {
        unfollow(pageIdOrSlug);
      } else {
        follow(pageIdOrSlug);
      }
    },
    [isFollowing, follow, unfollow]
  );

  return { followedSlugs, isFollowing, follow, unfollow, toggleFollow };
}

