interface CollapsibleSectionHeadingProps {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  headingLevel?: 'h2' | 'h3';
  className?: string;
  tooltip?: string;
}

export default function CollapsibleSectionHeading({
  title,
  collapsed,
  onToggle,
  headingLevel: Tag = 'h2',
  className = '',
  tooltip = 'Show or hide the idiom list in this section',
}: CollapsibleSectionHeadingProps) {
  return (
    <Tag className={`section-heading ${className}`.trim()}>
      <button
        type="button"
        className="section-heading__toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        data-tooltip={tooltip}
      >
        <span className="section-heading__label">{title}</span>
        <span
          className={`section-heading__chevron${collapsed ? '' : ' section-heading__chevron--open'}`}
          aria-hidden
        />
      </button>
    </Tag>
  );
}
