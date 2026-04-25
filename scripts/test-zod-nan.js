import { z } from 'zod';

const schema = z.object({
  width: z.number().nullable().optional(),
});

console.log('Testing null:', schema.safeParse({ width: null }));
console.log('Testing undefined:', schema.safeParse({ width: undefined }));
console.log('Testing NaN:', schema.safeParse({ width: NaN }));
console.log('Testing 0:', schema.safeParse({ width: 0 }));
