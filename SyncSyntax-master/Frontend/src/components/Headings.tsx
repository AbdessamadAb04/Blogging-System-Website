interface HeadingsProps {
  upheading?: string;
  mainHeading: string;
  highlightWords?: string[];
  subheading?: string;
  alignment?: 'left' | 'center' | 'right';
}

export default function Headings({
  upheading,
  mainHeading,
  highlightWords = [],
  subheading,
  alignment = 'center',
}: HeadingsProps) {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[alignment];

  const getHighlightedHeading = () => {
    if (highlightWords.length === 0) return mainHeading;

    let result = mainHeading;
    highlightWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, `<span class="text-[#0077B6]">${word}</span>`);
    });
    return result;
  };

  return (
    <div className={`${alignmentClass} mb-12`}>
      {upheading && (
          <p className="text-[18px] font-bold uppercase tracking-wide mb-3 inline-block bg-[#0077B6] text-white rounded-full px-5 py-2">
          {upheading}
        </p>
      )}
      <h2
        className="text-[36px] font-semibold text-[#333333] mb-4 leading-tight"
        dangerouslySetInnerHTML={{ __html: getHighlightedHeading() }}
      />
      {subheading && (
        <p className="text-[18px] text-[#333333] max-w-2xl mx-auto leading-relaxed">
          {subheading}
        </p>
      )}
    </div>
  );
}
