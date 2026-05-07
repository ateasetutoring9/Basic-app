import { ShieldCheck } from "lucide-react";

const tutors = [
  {
    initials: "MK",
    name: "Tutor Name",
    subjects: "Mathematics · Year 10–12",
    bio: "Experienced in senior Maths Methods and Specialist Mathematics, with a focus on helping students build exam technique and problem-solving confidence.",
  },
  {
    initials: "SJ",
    name: "Tutor Name",
    subjects: "Sciences · Year 9–12",
    bio: "Covers Biology, Chemistry, and Physics. Passionate about making complex scientific concepts accessible and turning exam anxiety into exam readiness.",
  },
  {
    initials: "ER",
    name: "Tutor Name",
    subjects: "English & Humanities · Year 7–10",
    bio: "Specialises in essay writing, text analysis, and building the critical thinking skills that underpin strong results across all senior subjects.",
  },
];

// TODO: Replace placeholder initials, names, and bios with real tutor profiles once onboarded
export function MeetTutors() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-page mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-section-title text-fg mb-4">Meet the tutors</h2>
          <p className="text-body text-muted max-w-xl mx-auto">
            All tutors hold a current Working With Children Check and have verified teaching or tutoring experience in their subject area.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tutors.map((t) => (
            <div key={t.subjects} className="bg-card border border-border rounded-md p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-[var(--accent-text-on)] font-bold text-small flex-shrink-0 select-none">
                  {t.initials}
                </div>
                <div>
                  <p className="text-small font-semibold text-fg">{t.name}</p>
                  <p className="text-small text-muted">{t.subjects}</p>
                </div>
              </div>
              <p className="text-small text-muted leading-relaxed flex-1">{t.bio}</p>
              <span className="inline-flex items-center gap-1.5 text-small font-medium text-success bg-success-soft border border-border rounded-full px-3 py-1 self-start">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                WWCC Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
