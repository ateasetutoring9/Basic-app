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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">Meet the tutors</h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            All tutors hold a current Working With Children Check and have verified teaching or tutoring experience in their subject area.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tutors.map((t) => (
            <div key={t.subjects} className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 select-none">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-fg text-sm">{t.name}</p>
                  <p className="text-xs text-muted">{t.subjects}</p>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed flex-1">{t.bio}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-green-50 border border-green-100 rounded-full px-3 py-1 self-start">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                WWCC Verified
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
