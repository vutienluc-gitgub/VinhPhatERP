import re

def modify_file(filepath, pattern, repl, count=0):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(pattern, repl, content, count=count)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

modify_file(r'd:\VinhPhatERP_v3\src\features\yarn-receipts\YarnReceiptList.tsx', r'import type \{ DocStatus \} from \'@/schema/yarn-receipt.schema\';\n', r'')
