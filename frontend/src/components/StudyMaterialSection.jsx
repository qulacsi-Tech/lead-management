import { useState } from 'react';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { downloadPaper, resolveAssetUrl, ApiError } from '../Api/Api';

/**
 * Guess papers and study material on an institute's public page.
 *
 * The contrast with the Quick Enquiry panel next to it is the whole point.
 * That panel exists to hand the institute a lead; this one deliberately hands
 * it nothing. Per the client:
 *
 *   "guess paper upload ka option bhi isme hi daal do jo keval download ho,
 *    download karne wali ki information uske pass nahi jaye"
 *
 * So there is no form here, no phone field, and no "we'll be in touch". A
 * signed-in reader clicks once and gets the PDF. The institute's only signal is
 * that the counter moved — enforced on the server, where no page-scoped
 * endpoint can read a download row back (see backend/models/study_paper.py).
 *
 * Two groups, kept visually distinct: this institute's own papers, and papers
 * a Main Admin has cleared to run platform-wide. The second group always names
 * the institute it came from, so a reader is never misled about who wrote a
 * paper appearing on someone else's page.
 *
 * The count is shown to readers as well as admins because it is the paper's
 * own credibility signal: "2,458 downloads" is why you trust it is worth
 * opening.
 */

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-IN');
}

/**
 * `bare` drops the outer Card and heading.
 *
 * On the institute's public page this now renders inside the Guess Papers tab
 * of the ads section (client feedback 22 Sep 2026, row 5), which already
 * supplies the card and the tab label — nesting a second titled Card inside it
 * would repeat the heading. Everywhere else it keeps its own chrome.
 */
export default function StudyMaterialSection({
  papers = [],
  sharedPapers = [],
  isMyPage,
  onRequireLogin,
  bare = false,
}) {
  // Per-paper state so one failed download does not blank the whole list.
  const [counts, setCounts] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  if (papers.length === 0 && sharedPapers.length === 0 && !isMyPage) return null;

  const handleDownload = async (paper) => {
    setBusyId(paper.id);
    setErrorId(null);
    try {
      const res = await downloadPaper(paper.id);
      setCounts((prev) => ({ ...prev, [paper.id]: res.downloads_count }));

      // Navigating rather than using a download attribute: the file is served
      // from the API origin, and a cross-origin `download` is ignored by the
      // browser, which would silently do nothing.
      window.open(resolveAssetUrl(res.file_url), '_blank', 'noopener');
    } catch (err) {
      // 401 is the expected path for a signed-out reader — send them to the
      // sign-in page instead of showing them an error they cannot act on.
      if (err instanceof ApiError && err.status === 401) {
        onRequireLogin?.('Sign in to download study material.');
      } else {
        setErrorId(paper.id);
      }
    } finally {
      setBusyId(null);
    }
  };

  const renderPaper = (p, { showOrg = false } = {}) => {
    const count = counts[p.id] ?? p.downloads_count;
    const facts = [p.subject, p.class_level, p.exam].filter(Boolean);
    return (
      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant">
        <span className="material-symbols-outlined text-[22px] text-primary shrink-0">description</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-on-surface m-0 truncate">
              {p.kind || 'Guess Paper'}: {p.title}
            </p>
            {p.downloaded_by_me && <Badge tone="success">Downloaded</Badge>}
          </div>
          <p className="text-[11px] text-on-surface-variant m-0 mt-0.5">
            {showOrg && p.org ? `By ${p.org} · ` : ''}
            {facts.length > 0 ? `${facts.join(' · ')} · ` : ''}
            Downloads: {formatCount(count)}
          </p>
          {errorId === p.id && (
            <p className="text-[11px] text-error m-0 mt-0.5">That download failed. Please try again.</p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          icon="download"
          onClick={() => handleDownload(p)}
          disabled={busyId === p.id}
        >
          {busyId === p.id ? 'Opening…' : 'Download'}
        </Button>
      </div>
    );
  };

  const body = (
    <>
      {!bare && (
        <h2 className="text-sm font-bold text-on-surface mb-1">Guess Papers &amp; Study Material</h2>
      )}
      <p className="text-xs text-on-surface-variant mb-3">
        Free to download. No enquiry form, and your details are never shared with the institute.
      </p>

      {papers.length === 0 ? (
        <p className="text-sm text-on-surface-variant mb-0">No study material published yet.</p>
      ) : (
        <div className="space-y-3">{papers.map((p) => renderPaper(p))}</div>
      )}

      {sharedPapers.length > 0 && (
        <div className="mt-5 pt-4 border-t border-outline-variant">
          <p className="text-xs font-semibold text-on-surface m-0 mb-1">More on Connectedus</p>
          <p className="text-[11px] text-on-surface-variant m-0 mb-3">
            Shared by other institutes on the platform.
          </p>
          <div className="space-y-3">{sharedPapers.map((p) => renderPaper(p, { showOrg: true }))}</div>
        </div>
      )}
    </>
  );

  return bare ? body : <Card className="p-5">{body}</Card>;
}
