import { ENTITY, LICENSE_LABEL } from '@/config/entity';
import { UI } from '@/content/ui-strings';
import { t } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export interface SiteFooterProps {
  locale: Locale;
}

const isReal = (v: string) => !/\bTK_/.test(v);

export function SiteFooter({ locale }: SiteFooterProps): JSX.Element {
  const { address, email, licenses, phone, tradeName } = ENTITY.entity;

  return (
    <footer className="border-t border-hair">
      <div className="mx-auto max-w-5xl px-6 md:px-8 py-8 space-y-6">
        <div>
          {isReal(phone) ? <div className="font-mono text-sm text-ink">{phone}</div> : null}
          {isReal(email) ? <div className="font-mono text-sm text-ink">{email}</div> : null}
          {isReal(address.line1) ? (
            <div className="font-mono text-sm text-ink">
              {address.line1}, {address.city}, {address.state} {address.zip}
            </div>
          ) : null}
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-marine">
            {t(UI.footer.licenses, locale)}
          </div>
          {licenses.map((license) => (
            <div key={license.role} className="font-mono text-sm tabular-nums text-ink">
              {`${LICENSE_LABEL[license.role]} · ${license.number}`}
            </div>
          ))}
        </div>
        <div className="font-mono text-xs text-marine">
          {`© ${new Date().getFullYear()} ${tradeName} · ${t(UI.footer.rights, locale)}`}
        </div>
      </div>
    </footer>
  );
}
