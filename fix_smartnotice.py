import re

with open('src/components/notices/SmartNoticeCard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add onClick to props
content = content.replace(
    '  requiresAck?: boolean;\n}',
    '  requiresAck?: boolean;\n  onClick?: () => void;\n}'
)

content = content.replace(
    '  requiresAck\n}: SmartNoticeCardProps) {',
    '  requiresAck,\n  onClick\n}: SmartNoticeCardProps) {'
)

# Pass onClick as onExpand to CombinedNotice
content = content.replace(
    'onImageClick={handleImageClick}',
    'onImageClick={handleImageClick}\n        onExpand={onClick}'
)

with open('src/components/notices/SmartNoticeCard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
