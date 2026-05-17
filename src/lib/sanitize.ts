import sanitize from 'sanitize-html'

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ['p', 'span', 'strong', 'em', 'u', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: { '*': ['style'] },
    allowedStyles: {
      '*': {
        color: [/.*/],
        'background-color': [/.*/],
        'font-size': [/^\d+(\.\d+)?(px|em|rem|%)$/],
      },
    },
  })
}
