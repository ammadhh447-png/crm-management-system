import { Link, useParams, Navigate } from 'react-router-dom';
import { ChevronDown, FileText, Shield, HelpCircle, Bot } from 'lucide-react';
import { useState } from 'react';
import { AI_ASSISTANT_HELP, LEGAL_NAV, LEGAL_PAGES } from '../../data/legalContent';

const PAGE_ICONS = {
  faqs: HelpCircle,
  privacy: Shield,
  terms: FileText,
};

const LegalPage = () => {
  const { type } = useParams();
  const [openFaq, setOpenFaq] = useState(null);
  const content = LEGAL_PAGES[type];

  if (!content) {
    return <Navigate to="/legal/faqs" replace />;
  }

  const isFaq = type === 'faqs';
  const Icon = PAGE_ICONS[type] || FileText;
  let questionCounter = 0;

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <nav className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {LEGAL_NAV.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              type === item.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-8 sm:px-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {content.title}
              </h1>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-600">
            {content.intro}
          </p>
        </header>

        <div className="px-6 py-8 sm:px-10">
          <div className="space-y-10">
            {content.sections.map((section, sectionIndex) => {
              const sectionNumber = sectionIndex + 1;

              return (
                <section key={section.heading} className="scroll-mt-6">
                  <div className="flex items-baseline gap-3 border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Section {sectionNumber}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">{section.heading}</h2>
                  </div>

                  {isFaq && section.items && (
                    <div className="mt-5 space-y-3">
                      {section.items.map((item) => {
                        questionCounter += 1;
                        const key = `${sectionIndex}-${questionCounter}`;
                        const isOpen = openFaq === key;

                        return (
                          <div
                            key={key}
                            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40"
                          >
                            <button
                              type="button"
                              onClick={() => setOpenFaq(isOpen ? null : key)}
                              className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                            >
                              <div className="flex gap-3">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                  {questionCounter}
                                </span>
                                <span className="text-sm font-medium leading-relaxed text-slate-800">
                                  {item.q}
                                </span>
                              </div>
                              <ChevronDown
                                className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <div className="border-t border-slate-200 bg-white px-5 py-4 pl-14">
                                <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!isFaq && section.items && (
                    <dl className="mt-5 space-y-4">
                      {section.items.map((item) => (
                        <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50/50 px-5 py-4">
                          <dt className="text-sm font-semibold text-slate-900">{item.label}</dt>
                          <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.text}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {section.paragraphs && (
                    <div className="mt-5 space-y-4">
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p
                          key={`${section.heading}-${paragraphIndex}`}
                          className="text-sm leading-7 text-slate-600"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <footer className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{AI_ASSISTANT_HELP}</p>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
};

export default LegalPage;
