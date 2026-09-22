import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { MEDIA_SPECS } from '../../constants/mediaSpecs';

/**
 * "Size & dimensions" — a click-to-open reference for every image an institute
 * page accepts.
 *
 * Client feedback 22 Sep 2026, row 2, and the follow-up: "size & dimension
 * nowhere we are showing. on click there should be modal and all info should
 * be there."
 *
 * So the trigger sits beside each media field, and the dialog lists *all three*
 * image types rather than only the one clicked — someone checking the logo size
 * is usually about to upload a banner too, and a single reference is easier to
 * act on than three separate tooltips. The type that was clicked is
 * highlighted.
 *
 * Shared by the Platform Admin's institute editor
 * (components/InstituteFullDetailsModal.jsx) and the Institute Console's page
 * editor (pages/InstitutePageEditor.jsx), reading the same MEDIA_SPECS the
 * upload validator enforces — so what the dialog promises and what the form
 * accepts cannot disagree.
 */
export default function ImageSpecHelp({ kind = 'logo', label = 'Size & dimensions' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 bg-transparent border-none p-0 text-[11px] font-semibold text-primary cursor-pointer hover:underline"
      >
        <span className="material-symbols-outlined text-[14px]">info</span>
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} width={520}>
        <h2 className="text-lg font-bold text-on-surface m-0 mb-1">Image Size &amp; Dimensions</h2>
        <p className="text-xs text-on-surface-variant m-0 mb-5">
          Uploads are checked against these before they are accepted. Anything larger than the size
          limit, or smaller than the recommended dimensions, is refused with a message.
        </p>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(MEDIA_SPECS).map(([key, spec]) => {
            const active = key === kind;
            return (
              <div
                key={key}
                className={`p-4 rounded-xl border ${
                  active ? 'border-primary bg-primary-container/20' : 'border-outline-variant'
                }`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <h3 className="text-sm font-bold text-on-surface m-0">{spec.label}</h3>
                  {active && (
                    <span className="text-[10px] font-semibold text-primary bg-primary-container/60 px-2 py-0.5 rounded-full">
                      This field
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-2.5">
                  <div>
                    <span className="text-on-surface-variant">Dimensions</span>
                    <p className="font-semibold text-on-surface m-0">{spec.dimensions}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Aspect ratio</span>
                    <p className="font-semibold text-on-surface m-0">{spec.aspect}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Maximum file size</span>
                    <p className="font-semibold text-on-surface m-0">{spec.maxMB} MB</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Formats</span>
                    <p className="font-semibold text-on-surface m-0">{spec.formats}</p>
                  </div>
                </div>

                <p className="text-[11px] text-on-surface-variant m-0 mb-1">
                  <span className="font-semibold text-on-surface">Where it shows: </span>
                  {spec.shownAs}
                </p>
                <p className="text-[11px] text-on-surface-variant m-0">
                  <span className="font-semibold text-on-surface">Tip: </span>
                  {spec.tip}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-outline-variant">
          <Button size="sm" onClick={() => setOpen(false)}>Got it</Button>
        </div>
      </Modal>
    </>
  );
}
