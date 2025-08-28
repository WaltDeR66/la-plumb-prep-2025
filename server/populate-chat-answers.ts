import { storage } from "./storage";

const chatAnswers = [
  {
    question: "Who enforces the Louisiana State Plumbing Code?",
    answer: "The Louisiana State Plumbing Code (LSPC) is enforced by the **state health officer**, who has the primary responsibility for ensuring code compliance throughout Louisiana.\n\nKey points about enforcement:\n• The state health officer can **delegate this authority** to local plumbing inspectors\n• Local parishes and municipalities can have their own qualified enforcement officers\n• This delegation system ensures consistent code enforcement across different jurisdictions\n• Enforcement includes permit issuance, inspections, and violation corrections",
    keywords: ["enforce", "enforces", "enforcement", "authority", "health officer", "delegate"]
  },
  {
    question: "What is the legal basis for the Louisiana State Plumbing Code?",
    answer: "The legal foundation for the Louisiana State Plumbing Code stems from specific **Louisiana Revised Statutes (R.S.)**:\n\n**Primary Authority:** R.S. 36:258(B)\n**Additional Provisions:** Chapters 1 and 4 of Title 40\n**Supporting Statutes:** R.S. 40:4(A)(7) and R.S. 40:5(2), (3), (7), (9), (16), (17), and (20)\n\nThe Department of Health and Hospitals officially adopted Part XIV of the Sanitary Code, which is referred to as the Louisiana State Plumbing Code.",
    keywords: ["legal basis", "lspc", "statute", "statutes", "r.s.", "title 40", "sanitary code"]
  },
  {
    question: "What are the historical notes about the Louisiana State Plumbing Code?",
    answer: "**Historical Timeline of the Louisiana State Plumbing Code:**\n\n📅 **June 2002:** Originally promulgated by the Department of Health and Hospitals, Office of Public Health\n• Published in Louisiana Register, Vol. 28, No. 6\n\n📅 **November 2012:** Major amendments made\n• Published in Louisiana Register, Vol. 38, No. 11\n• Reference: LR 38:2795\n\nThis gives us the current version that's been in effect for over a decade with important updates from the 2012 amendments.",
    keywords: ["historical", "history", "amendment", "amendments", "promulgate", "promulgated", "2002", "2012"]
  },
  {
    question: "How does the enforcement authority delegation process work?",
    answer: "**Enforcement Authority Delegation Process:**\n\n🏛️ **Primary Authority:** State health officer\n⬇️ **Can delegate to:**\n• Local plumbing inspectors\n• Parish enforcement officers\n• Municipal code officials\n• Other qualified entities\n\n**Benefits of delegation:**\n• Ensures local expertise and faster response\n• Maintains consistent statewide standards\n• Allows for regional enforcement adaptation\n• Creates accountability at multiple levels",
    keywords: ["delegation", "delegate", "authority", "local", "parish", "municipal"]
  },
  {
    question: "What about code violations and penalties?",
    answer: "While Section 101 focuses on administration rather than specific violations, **code enforcement officials have authority to:**\n\n⚠️ **Issue stop-work orders** for non-compliant installations\n📋 **Require corrections** to meet code standards\n🔍 **Conduct inspections** at various project stages\n📝 **Review and approve plans** before work begins\n\nFor specific violation procedures and penalties, you would need to consult other sections of the Louisiana Plumbing Code that detail enforcement actions.",
    keywords: ["violation", "violations", "penalties", "stop-work", "inspections", "corrections"]
  },
  {
    question: "What are the key responsibilities of the state health officer?",
    answer: "**Key Responsibilities of the State Health Officer:**\n\n👨‍⚖️ **Primary Duties:**\n• Overall enforcement of the Louisiana State Plumbing Code\n• Delegation of authority to qualified local officials\n• Ensuring statewide code compliance\n• Oversight of local enforcement activities\n\n🤝 **Delegation Powers:**\n• Can authorize local inspectors to enforce the code\n• Maintains oversight while allowing local implementation\n• Ensures consistent application across Louisiana",
    keywords: ["responsibilities", "health officer", "duties", "oversight", "statewide"]
  },
  {
    question: "How do local jurisdiction requirements work?",
    answer: "**Local Jurisdiction Requirements:**\n\n🏛️ **Local Authority:**\n• Can adopt **more restrictive** requirements than the state code\n• Cannot adopt **less restrictive** requirements\n• Must maintain consistency with Louisiana State Plumbing Code\n\n📋 **Implementation:**\n• Local jurisdictions handle day-to-day enforcement\n• Issue permits and conduct inspections\n• Apply both state code and local amendments\n• Report to state health officer as needed",
    keywords: ["local", "jurisdiction", "requirements", "restrictive", "permits", "amendments"]
  },
  {
    question: "What is Section 101 about?",
    answer: "**Louisiana Plumbing Code Section 101 - Administration** covers the foundational aspects of code management:\n\n📋 **Key Topics:**\n• Enforcement authority and delegation\n• Legal basis and statutory foundation\n• Historical development and amendments\n• Administrative responsibilities\n• Local jurisdiction requirements\n\nThis section establishes who has authority to enforce the code, how that authority can be delegated, and the legal framework that supports the entire Louisiana State Plumbing Code system.",
    keywords: ["section 101", "administration", "code management", "foundational"]
  }
];

export async function populateChatAnswers() {
  console.log("Populating chat answers...");
  
  try {
    // Check if answers already exist
    const existing = await storage.getAllChatAnswers();
    if (existing.length > 0) {
      console.log("Chat answers already exist, skipping population");
      return;
    }

    // Create all answers
    for (const answer of chatAnswers) {
      await storage.createChatAnswer(answer);
      console.log(`Added answer: ${answer.question}`);
    }
    
    console.log(`Successfully populated ${chatAnswers.length} chat answers`);
  } catch (error) {
    console.error("Error populating chat answers:", error);
  }
}