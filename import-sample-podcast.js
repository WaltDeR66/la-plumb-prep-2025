// Sample podcast episode from user's attached file
const sampleEpisode = {
  title: "Louisiana State Plumbing Code §101 Administration",
  transcript: `Did you know that Louisiana has its own specific plumbing regulations? It's called the Louisiana State Plumbing Code, or LSPC, and it serves as the backbone of plumbing standards across the state.

Formally, the LSPC is adopted as Part XIV of the Sanitary Code by the Department of Health and Hospitals, specifically under the Office of Public Health. It's a comprehensive legal document that outlines the expectations and requirements for all plumbing work in Louisiana.

What's interesting is that this code goes by a few different names. Officially, it can be referred to as the Louisiana State Plumbing Code, or more formally as Part XIV (Plumbing) of the Sanitary Code, State of Louisiana. In legal and professional settings, it's often just referred to as "this code" or "this Part," which shows how adaptable legislative language can be.

Now, let's talk about where this code gets its authority.

The foundation of the LSPC's authority comes from R.S. 36:258(B), with additional supporting provisions found in Title 40 of the Louisiana Revised Statutes, particularly in Chapters 1 and 4. The official promulgation of the code is aligned with R.S. 40:4(A)(7) and R.S. 40:5, which provide the legal backing necessary for the code's enforcement and updates.

Historically, the LSPC was first adopted in June 2002, and it underwent a significant amendment in November 2012. These updates typically reflect evolving standards in both plumbing technology and public health priorities.

The Louisiana State Plumbing Code isn't just about technical specs—it's a public health tool. Its regulations affect not just individual homes but the overall health of communities. That's why the Office of Public Health plays such a crucial role, overseeing the implementation of the code and ensuring compliance throughout the state.

So how is compliance maintained?

Typically, this involves regular inspections carried out by authorized plumbing inspectors. These professionals ensure that any plumbing installation meets the requirements set forth in the code. On top of that, there's a strong focus on certification. Plumbing contractors in Louisiana are required to be certified, which means they've demonstrated a clear understanding of the LSPC and are committed to upholding its standards.

This certification process helps guarantee competency and safety in the field. When residents know that their plumbing systems are installed and maintained by certified professionals, it naturally builds public trust and confidence.

But staying compliant isn't just a one-time task—it requires ongoing education. Louisiana, along with professional plumbing associations, offers a variety of training sessions, workshops, and online resources to help plumbers stay up to date with any code changes and new technologies.

This creates a cycle of continuous improvement:
→ Updated codes lead to better practices,
→ which require more training,
→ which results in improved public health outcomes.

The bottom line is this: the Louisiana State Plumbing Code is about much more than pipes and fittings. It's about protecting the health and safety of every resident in the state.

As plumbing technology continues to evolve and public health needs shift, maintaining and adapting these regulatory frameworks will be essential. By understanding the legislative roots, enforcement mechanisms, and educational components of the LSPC, we can truly appreciate how critical these standards are to our everyday lives.`,
  duration: 212, // ~3.5 minutes
  chapter: "Chapter 1",
  section: "101",
  difficulty: "hard"
};

// Use this to import: fetch('/api/admin/podcast/bulk-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b', episodes: [sampleEpisode] }) })
console.log("Sample episode data ready for import:", sampleEpisode);