const fs = require('fs');
const cp = require('child_process');

const trees = fs
  .readFileSync('tmp-trees.txt', 'utf8')
  .split('\n')
  .map((t) => t.trim())
  .filter(Boolean);

console.log(`Checking ${trees.length} trees...`);

let foundTree = null;
for (const tree of trees) {
  try {
    const list = cp.execSync(`git ls-tree -r ${tree}`).toString();
    if (
      list.includes('SupplierPaymentSheet.tsx') &&
      list.includes('useSupplierDebt.ts') &&
      list.includes('PaymentSheet.tsx')
    ) {
      foundTree = tree;
      break;
    }
  } catch (e) {}
}

if (foundTree) {
  console.log(`Found matching tree! Hash: ${foundTree}`);
  // We can write a git read-tree or checkout command string
  const hash = foundTree;
  fs.writeFileSync('tmp-found-tree.txt', hash);
  console.log('Restoring from tree object...');
  // We can extract all files from this tree by checking them out!
  // git checkout <tree-ish> -- src/features
  cp.execSync(`git checkout ${foundTree} -- src/features`);
  console.log('Restored src/features from the lost tree!');
} else {
  console.log('Could not find the tree.');
}
