// Utility functions for chapter-based filtering
export function getChapterFromSection(sectionValue: string): number {
  return Math.floor(parseInt(sectionValue, 10) / 100);
}

export function parseChapterNumber(chapterStr: string): number {
  const match = chapterStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function filterSectionsByChapter(chapterStr: string): typeof PLUMBING_CODE_SECTIONS {
  const chapterNum = parseChapterNumber(chapterStr);
  return PLUMBING_CODE_SECTIONS.filter(section => 
    getChapterFromSection(section.value) === chapterNum
  ).sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
}

// Louisiana Plumbing Code sections data - you can add sections here
export const PLUMBING_CODE_SECTIONS: Array<{ value: string; label: string }> = [
  // Add your sections here in the format:
  // { value: "101", label: "§101 - Section Title" },
];