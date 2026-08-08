const stylelint = require('stylelint');

const ruleName = 'vinhphat/no-hardcoded-colors';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value) => `[Architecture Guard] Cấm sử dụng màu tĩnh "${value}". Bắt buộc dùng Semantic Design Tokens (vd: var(--surface)). Nếu thực sự cần, phải thêm comment /* @architecture-exception: lý do */ ngay phía trên.`,
});

module.exports = stylelint.createPlugin(ruleName, function () {
  return function (root, result) {
    const validProps = ['color', 'background', 'background-color', 'border', 'border-color', 'fill', 'stroke', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
    const regex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\b(white|black|red|blue|green|yellow|gray|grey)\b)/i;

    root.walkDecls(decl => {
      if (!validProps.includes(decl.prop)) return;

      // Ignore standard variables and inherit/transparent
      if (decl.value.includes('var(--') || decl.value === 'inherit' || decl.value === 'transparent') {
         // It might have var(--something) but also a hex fallback, we'll allow it if it uses var.
         return; 
      }

      if (regex.test(decl.value)) {
        // Check for exception comment
        let hasException = false;
        
        let prev = decl.prev();
        while (prev) {
          if (prev.type === 'comment') {
            if (prev.text.trim().startsWith('@architecture-exception:')) {
              hasException = true;
              break;
            }
          } else {
             // stop if we hit another decl
             break;
          }
          prev = prev.prev();
        }

        // Sometimes the comment is on the parent rule if it's the first declaration
        if (!hasException && decl.parent) {
           let parentPrev = decl.parent.prev();
           while (parentPrev) {
             if (parentPrev.type === 'comment') {
               if (parentPrev.text.trim().startsWith('@architecture-exception:')) {
                 hasException = true;
                 break;
               }
             } else {
                break;
             }
             parentPrev = parentPrev.prev();
           }
        }

        if (!hasException) {
          stylelint.utils.report({
            message: messages.rejected(decl.value),
            node: decl,
            result,
            ruleName,
          });
        }
      }
    });
  };
});
module.exports.ruleName = ruleName;
module.exports.messages = messages;
