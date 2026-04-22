export function parseMarkdownToJson(md: string) {
  const getSection = (title: string) => {
    const regex = new RegExp(
      `### ${title}[\\s\\S]*?- Found: (YES|NO)[\\s\\S]*?- Action: (.*)`,
      'i',
    );

    const match = md.match(regex);

    return {
      found: match?.[1] === 'YES',
      action: match?.[2]?.trim() || '',
    };
  };

  return {
    duplicate_code: getSection('1. Duplicate Code'),
    vietnamese_strings: getSection('2. Vietnamese Strings'),
    business_logic: getSection('3. Business Logic in UI'),
    validation: getSection('4. Validation'),
    naming: getSection('5. Naming'),
    final_status: md.includes('PRODUCTION READY')
      ? 'PRODUCTION READY'
      : 'NEEDS REFACTOR',
  };
}
