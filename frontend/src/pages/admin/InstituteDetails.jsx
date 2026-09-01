import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import InstituteFullDetailsModal from '../../components/InstituteFullDetailsModal';
import { fetchPage, ApiError } from '../../Api/Api';

/**
 * `/admin/pages/:pageId` — the full institute record on its own route.
 *
 * Client feedback, 01 Sep 2026: the eye button used to open a 90vw modal. As a
 * route it gets a URL an admin can bookmark, reload and share, and the browser
 * Back button behaves the way they expect while working through a list of
 * institutes.
 *
 * The page is loaded here rather than inside the editor so this screen owns the
 * loading, error and not-found states — the editor is handed a record it can
 * trust.
 */
export default function InstituteDetails() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPage(await fetchPage(pageId));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? 'That institute no longer exists.'
          : 'Could not load this institute.',
      );
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-center text-xs text-on-surface-variant py-16 m-0">Loading institute…</p>
    );
  }

  if (error || !page) {
    return (
      <div className="p-8 max-w-3xl mx-auto w-full">
        <EmptyState
          icon="storefront"
          title="Institute unavailable"
          description={error || 'Could not load this institute.'}
        />
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
          <Link to="/admin/pages" className="no-underline">
            <Button size="sm">Back to Institute Pages</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InstituteFullDetailsModal
      variant="page"
      open
      institute={page}
      onClose={() => navigate('/admin/pages')}
      // Keep the header (name, slug, type) in step with what was just saved,
      // without a full refetch.
      onSaveSuccess={(updated) => setPage((prev) => ({ ...prev, ...updated }))}
    />
  );
}
