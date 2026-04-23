const fs=require('fs');
['d:/VinhPhatERP_v3/src/api/customers.api.ts', 'd:/VinhPhatERP_v3/src/api/suppliers.api.ts'].forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/catch \(error: any\) \{/g, 'catch (error: unknown) {');
  c = c.replace(/if \(error\?\.code === '23505'\)/g, "if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === '23505')");
  fs.writeFileSync(p, c);
});
