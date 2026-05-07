import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is it really free?",
    answer:
      "Yes — completely free. No credit card required, no premium tier, no ads. Every lecture, worksheet, and feature is available to every student at no cost. We're committed to keeping it that way.",
  },
  {
    question: "Which year levels and subjects are covered?",
    answer:
      "We cover Year 7 through to Year 12 across Mathematics, Sciences, English, and Humanities. We're adding new topics regularly — if there's something you need that isn't there yet, let us know.",
  },
  {
    question: "Which Australian curriculum does the content follow?",
    answer:
      "Content is aligned to the Australian Curriculum v9 and mapped to the senior secondary frameworks of each state and territory, including VCE, HSC, QCE, ATAR, SACE, TCE, BSSS, and NTCET.",
  },
  {
    question: "Are the tutors qualified?",
    answer:
      "All tutors hold a current Working With Children Check (WWCC) valid in their state or territory and have verified teaching or tutoring experience in their subject area.",
  },
  {
    question: "Can I use it on my phone or tablet?",
    answer:
      "Yes. The platform is fully responsive and works on all modern browsers across desktop, tablet, and mobile. No app to download.",
  },
  {
    question: "How do the worksheets and feedback work?",
    answer:
      "After reading or watching a lecture, you attempt the corresponding worksheet. Most questions are auto-graded — once you submit, you see your score and per-question feedback immediately. Essay questions are marked as practice and not auto-graded.",
  },
];

export function FAQ() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-reading mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-section-title text-fg mb-4">Frequently asked questions</h2>
        </div>
        <div className="divide-y divide-border">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-body font-semibold text-fg">
                {faq.question}
                <ChevronDown
                  className="w-5 h-5 text-muted flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-body text-muted leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
