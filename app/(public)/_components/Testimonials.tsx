const testimonials = [
  {
    quote:
      "I went from barely scraping through to actually understanding the material. The worksheets with instant feedback made all the difference.",
    name: "Student Name",
    detail: "Year 11 · Victoria",
  },
  {
    quote:
      "Finally a resource that actually covers the Australian curriculum properly. I used it every week leading up to my exams.",
    name: "Student Name",
    detail: "Year 12 · NSW",
  },
  {
    quote:
      "As a parent, I love that it's completely free and the content is genuinely good quality. My daughter uses it every evening.",
    name: "Parent Name",
    detail: "Parent of Year 9 student",
  },
];

// TODO: Replace placeholder names and quotes with real testimonials once collected from students
export function Testimonials() {
  return (
    <section className="py-16 md:py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-4">What students are saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <svg key={j} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-400">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="font-semibold text-fg text-sm">{t.name}</p>
                <p className="text-xs text-muted">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
