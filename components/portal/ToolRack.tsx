import { UI } from '@/content/ui-strings';
import { portalLabel } from '@/lib/content/loaders';
import { t } from '@/lib/i18n';
import { href } from '@/lib/seo/href';
import { Heading } from '@/components/primitives';
import type { Locale, Localized, ToolDef } from '@/lib/types';

const TK = /\bTK_/;
const isTK = (value: Localized): boolean => TK.test(value.en) || TK.test(value.es);

/**
 * TOOL RACK (Part 7.2 slot 4) — marine cards linking to tool pages. The hub
 * loads NO engine code: cards are plain anchors built from ToolDef content;
 * the calculator island mounts only on the tool route itself. bone text on
 * marine only; teal for the small mono tag (contrast rule, Part 1.3).
 */

export interface ToolRackProps {
  tools: ToolDef[];
  locale: Locale;
  /** Heading varies by surface (hub rack vs. subpage related-tools). */
  heading: Localized;
}

export function ToolRack({ tools, locale, heading }: ToolRackProps): JSX.Element | null {
  if (tools.length === 0) return null;

  return (
    <section>
      <Heading level={2}>{t(heading, locale)}</Heading>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <a
            key={tool.id}
            className="block bg-marine px-6 py-6"
            href={href(`tool.${tool.id}`, locale)}
          >
            <p className="font-mono text-xs uppercase tracking-wider text-teal">
              {t(UI.sections.calculatorTag, locale)}
            </p>
            {/* 5e: unfilled titles degrade to the structural slug; an
                unfilled question renders NO blurb (the home-entry precedent —
                no invented copy, no raw marker on a card). */}
            <p className="mt-3 font-display text-xl text-bone">
              {t(portalLabel(tool), locale)}
            </p>
            {isTK(tool.answer.question) ? null : (
              <p className="mt-2 font-sans text-sm text-bone">
                {t(tool.answer.question, locale)}
              </p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
